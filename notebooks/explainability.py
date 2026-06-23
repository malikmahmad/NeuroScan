# %% [markdown]
# # Explainability — Grad-CAM (CNN / EfficientNet) + Attention Rollout (ViT)
#
# IMPORTANT METHODOLOGICAL NOTE (put this in the paper's Methodology section):
# Grad-CAM relies on convolutional feature maps and gradients flowing through
# them — it is NOT directly valid for a pure transformer like ViT, which has
# no spatial conv feature map. Applying "Grad-CAM" to a ViT and calling it
# Grad-CAM (as some example repos do) is methodologically incorrect.
# The correct technique for transformers is "Attention Rollout" (Abnar &
# Zuidema, 2020), which aggregates self-attention weights across all blocks
# to show which image patches the model actually attended to.
#
# This script implements BOTH correctly:
#   - Grad-CAM            -> for the Custom CNN and EfficientNet-B0
#   - Attention Rollout    -> for ViT-B/16
#
# Run this AFTER train_classification.py (needs outputs/weights/*_best.pth).

# %%
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
from torchvision import models, transforms
from PIL import Image

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
OUTPUT_DIR = Path("outputs")
(OUTPUT_DIR / "figures" / "explainability").mkdir(parents=True, exist_ok=True)

IMAGE_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

eval_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

with open(OUTPUT_DIR / "metrics" / "cnn_test_results.json") as f:
    CLASS_NAMES = list(json.load(f)["per_class"].keys())
NUM_CLASSES = len(CLASS_NAMES)


# %%
# ---------------------------------------------------------------------------
# Rebuild architectures (must match train_classification.py exactly) and
# load the best checkpoints saved during training.
# ---------------------------------------------------------------------------
def load_cnn():
    import torch.nn as nn
    model = nn.Sequential(
        nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(), nn.MaxPool2d(2),
        nn.AdaptiveAvgPool2d((1, 1)), nn.Flatten(), nn.Dropout(0.3),
        nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.3),
        nn.Linear(128, NUM_CLASSES),
    )
    model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "cnn_best.pth", map_location=DEVICE))
    # index 14 = ReLU after the last conv block (best spatial resolution before final pool)
    return model.to(DEVICE).eval(), model[14]


def load_efficientnet():
    import torch.nn as nn
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_features, NUM_CLASSES))
    model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "efficientnet_best.pth", map_location=DEVICE))
    return model.to(DEVICE).eval(), model.features[-1]  # last conv block for Grad-CAM hook


def load_vit():
    import torch.nn as nn
    model = models.vit_b_16(weights=None)
    in_features = model.heads.head.in_features
    model.heads.head = nn.Linear(in_features, NUM_CLASSES)
    model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "vit_best.pth", map_location=DEVICE))
    return model.to(DEVICE).eval()


# %%
# ---------------------------------------------------------------------------
# Grad-CAM (for CNN + EfficientNet)
# ---------------------------------------------------------------------------
class GradCAM:
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

    def generate(self, input_tensor, class_idx=None):
        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = output.argmax(dim=1).item()

        self.model.zero_grad()
        output[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)  # global-avg-pool gradients
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=(IMAGE_SIZE, IMAGE_SIZE), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam, class_idx


# %%
# ---------------------------------------------------------------------------
# Attention Rollout (for ViT) — Abnar & Zuidema, 2020
# ---------------------------------------------------------------------------
@torch.no_grad()
def vit_attention_rollout(model, input_tensor, discard_ratio=0.0, head_fusion="mean"):
    attentions = []

    def hook(module, inp, out):
        # torchvision's MultiheadAttention block returns (out, weights) only if
        # need_weights=True; we patch the forward to request weights.
        pass

    # torchvision ViT encoder layers wrap nn.MultiheadAttention; we monkeypatch
    # forward to capture attention weights for each block.
    handles = []
    captured = {}

    def make_hook(idx):
        def hook_fn(module, inp, kwargs):
            kwargs["need_weights"] = True
            kwargs["average_attn_weights"] = (head_fusion == "mean")
            return inp, kwargs
        return hook_fn

    # Simpler approach: re-run forward manually capturing attn via output hook
    for i, layer in enumerate(model.encoder.layers):
        def make_capture(idx):
            def capture(module, inp, out):
                # self_attention module of EncoderBlock returns (x, attn_weights)
                pass
            return capture

    # torchvision's EncoderBlock.forward calls self.self_attention(x, x, x, need_weights=False) internally,
    # so we override need_weights via a forward hook on self_attention with input modification.
    for i, layer in enumerate(model.encoder.layers):
        sa = layer.self_attention

        def fwd_pre_hook(module, args, kwargs, idx=i):
            kwargs["need_weights"] = True
            kwargs["average_attn_weights"] = True
            return args, kwargs

        h = sa.register_forward_pre_hook(fwd_pre_hook, with_kwargs=True)
        handles.append(h)

        def fwd_hook(module, inp, out, idx=i):
            # out = (attn_output, attn_weights)
            captured[idx] = out[1].detach()  # (batch, tokens, tokens)

        h2 = sa.register_forward_hook(fwd_hook)
        handles.append(h2)

    _ = model(input_tensor)
    for h in handles:
        h.remove()

    n_layers = len(model.encoder.layers)
    attn_mats = [captured[i][0] for i in range(n_layers)]  # drop batch dim -> (tokens, tokens)

    tokens = attn_mats[0].shape[-1]
    result = torch.eye(tokens, device=input_tensor.device)
    for attn in attn_mats:
        attn = attn + torch.eye(tokens, device=input_tensor.device)  # residual connection
        attn = attn / attn.sum(dim=-1, keepdim=True)
        result = attn @ result

    # CLS token's attention to all patch tokens (token 0 = CLS)
    cls_attention = result[0, 1:]  # drop CLS-to-CLS
    n_patches = cls_attention.shape[0]
    grid_size = int(n_patches ** 0.5)
    cam = cls_attention.reshape(grid_size, grid_size).cpu().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
    return cam


# %%
# ---------------------------------------------------------------------------
# Visualization helper
# ---------------------------------------------------------------------------
def overlay_heatmap(pil_image, cam, alpha=0.45):
    cam_resized = np.array(Image.fromarray((cam * 255).astype(np.uint8)).resize(pil_image.size, Image.BILINEAR))
    cmap = plt.get_cmap("jet")
    heatmap = cmap(cam_resized / 255.0)[:, :, :3]
    base = np.array(pil_image.convert("RGB")) / 255.0
    overlay = (1 - alpha) * base + alpha * heatmap
    return np.clip(overlay, 0, 1)


def visualize_sample(image_path, true_label_name):
    pil_image = Image.open(image_path).convert("RGB")
    input_tensor = eval_transform(pil_image).unsqueeze(0).to(DEVICE)

    fig, axes = plt.subplots(1, 4, figsize=(16, 4))
    axes[0].imshow(pil_image)
    axes[0].set_title(f"Original\nTrue: {true_label_name}")
    axes[0].axis("off")

    # CNN Grad-CAM
    cnn_model, cnn_layer = load_cnn()
    cam_gen = GradCAM(cnn_model, cnn_layer)
    cam, pred_idx = cam_gen.generate(input_tensor.clone().requires_grad_())
    axes[1].imshow(overlay_heatmap(pil_image, cam))
    axes[1].set_title(f"CNN Grad-CAM\nPred: {CLASS_NAMES[pred_idx]}")
    axes[1].axis("off")

    # EfficientNet Grad-CAM
    eff_model, eff_layer = load_efficientnet()
    cam_gen = GradCAM(eff_model, eff_layer)
    cam, pred_idx = cam_gen.generate(input_tensor.clone().requires_grad_())
    axes[2].imshow(overlay_heatmap(pil_image, cam))
    axes[2].set_title(f"EfficientNet Grad-CAM\nPred: {CLASS_NAMES[pred_idx]}")
    axes[2].axis("off")

    # ViT Attention Rollout
    vit_model = load_vit()
    cam = vit_attention_rollout(vit_model, input_tensor)
    with torch.no_grad():
        pred_idx = vit_model(input_tensor).argmax(dim=1).item()
    axes[3].imshow(overlay_heatmap(pil_image, cam))
    axes[3].set_title(f"ViT Attention Rollout\nPred: {CLASS_NAMES[pred_idx]}")
    axes[3].axis("off")

    plt.tight_layout()
    save_path = OUTPUT_DIR / "figures" / "explainability" / f"{Path(image_path).stem}_explainability.png"
    plt.savefig(save_path, dpi=150)
    plt.show()
    print(f"Saved: {save_path}")


# %%
# ---------------------------------------------------------------------------
# Run on a handful of test images — pick 1 correctly-classified example per
# class for the paper's qualitative figure.
# ---------------------------------------------------------------------------
import os

KAGGLE_PATH = "/kaggle/input/brain-tumor-mri-dataset"
DATA_ROOT = KAGGLE_PATH if os.path.exists(KAGGLE_PATH) else "data"
TEST_DIR = Path(DATA_ROOT) / "Testing"

for class_name in CLASS_NAMES:
    class_dir = TEST_DIR / class_name
    sample_images = list(class_dir.glob("*"))[:1]
    for img_path in sample_images:
        visualize_sample(img_path, class_name)

# %% [markdown]
# Use 4-6 of these side-by-side panels as Figure X in the paper's Results
# section — one row per class is a strong, standard layout for this kind of
# qualitative explainability comparison.
