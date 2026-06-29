import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image


class GradCAM:
    """Grad-CAM for CNN/EfficientNet. Not valid for ViT — use vit_attention_rollout instead."""

    def __init__(self, model, target_layer):
        self.model = model
        self.activations = None
        self.gradients = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(
        self, input_tensor: torch.Tensor, image_size: int, class_idx: int = None
    ):
        input_tensor = input_tensor.clone().requires_grad_()
        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = output.argmax(dim=1).item()

        self.model.zero_grad()
        output[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(
            cam, size=(image_size, image_size), mode="bilinear", align_corners=False
        )
        cam = cam.squeeze().detach().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        probs = torch.softmax(output, dim=1).detach().cpu().numpy()[0]
        return cam, class_idx, probs


@torch.no_grad()
def vit_attention_rollout(model, input_tensor: torch.Tensor):
    """
    Attention Rollout for Vision Transformers (Abnar & Zuidema, 2020).

    Multiplies attention matrices across all encoder layers, propagating token
    influence back to input patches. The CLS token's row in the final matrix
    indicates which patches the model attended to most.
    """
    handles = []
    captured = {}

    for i, layer in enumerate(model.encoder.layers):
        sa = layer.self_attention

        def fwd_pre_hook(module, args, kwargs):
            kwargs["need_weights"] = True
            kwargs["average_attn_weights"] = True
            return args, kwargs

        handles.append(sa.register_forward_pre_hook(fwd_pre_hook, with_kwargs=True))

        def fwd_hook(module, inp, out, idx=i):
            captured[idx] = out[1].detach()

        handles.append(sa.register_forward_hook(fwd_hook))

    output = model(input_tensor)

    for h in handles:
        h.remove()

    n_layers = len(model.encoder.layers)
    attn_mats = [captured[i][0] for i in range(n_layers)]
    tokens = attn_mats[0].shape[-1]

    # Add residual connection (identity) before normalising — Abnar & Zuidema §3
    rollout = torch.eye(tokens, device=input_tensor.device)
    for attn in attn_mats:
        attn = attn + torch.eye(tokens, device=input_tensor.device)
        attn = attn / attn.sum(dim=-1, keepdim=True)
        rollout = attn @ rollout

    # Row 0 is the CLS token; patch tokens start at index 1
    cls_attention = rollout[0, 1:]
    grid_size = int(cls_attention.shape[0] ** 0.5)
    cam = cls_attention.reshape(grid_size, grid_size).cpu().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

    pred_idx = output.argmax(dim=1).item()
    probs = torch.softmax(output, dim=1).cpu().numpy()[0]
    return cam, pred_idx, probs


def blend_cam_overlay(
    pil_image: Image.Image, cam: np.ndarray, alpha: float = 0.45
) -> Image.Image:
    """Blend a CAM heatmap over the original image and return the composite."""
    import matplotlib

    cam_img = Image.fromarray((cam * 255).astype(np.uint8)).resize(
        pil_image.size, Image.BILINEAR
    )
    cam_resized = np.array(cam_img) / 255.0

    heatmap = matplotlib.colormaps["jet"](cam_resized)[:, :, :3]
    base = np.array(pil_image.convert("RGB")) / 255.0
    overlay = (1 - alpha) * base + alpha * heatmap

    return Image.fromarray((np.clip(overlay, 0, 1) * 255).astype(np.uint8))
