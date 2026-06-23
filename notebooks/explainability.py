"""
Explainability figures: Grad-CAM for CNN/EfficientNet, Attention Rollout for ViT.

Why two different methods?
Grad-CAM works by computing gradients with respect to a convolutional feature
map. ViT has no convolutional layers, so there is no spatial feature map to
hook into — applying Grad-CAM to a transformer is technically incorrect.
Attention Rollout (Abnar & Zuidema, 2020) is the right approach for ViT: it
multiplies attention matrices across all encoder layers, tracking how much
each input patch influenced the final classification token.

Run this after train_classification.py. It expects the weights in outputs/weights/.
"""

import json
import os
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import matplotlib.pyplot as plt
from torchvision import models, transforms
from PIL import Image

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMAGE_SIZE = 224

OUTPUT_DIR = Path("outputs")
FIG_DIR = OUTPUT_DIR / "figures" / "explainability"
FIG_DIR.mkdir(parents=True, exist_ok=True)

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

eval_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

with open(OUTPUT_DIR / "metrics" / "cnn_test_results.json") as f:
    CLASS_NAMES = list(json.load(f)["per_class"].keys())

NUM_CLASSES = len(CLASS_NAMES)


# --- Model loaders -----------------------------------------------------------

def load_cnn():
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
    # Index 14 is the ReLU right after the last conv block, before the final pool.
    return model.to(DEVICE).eval(), model[14]


def load_efficientnet():
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_features, NUM_CLASSES))
    model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "efficientnet_best.pth", map_location=DEVICE))
    return model.to(DEVICE).eval(), model.features[-1]


def load_vit():
    model = models.vit_b_16(weights=None)
    in_features = model.heads.head.in_features
    model.heads.head = nn.Linear(in_features, NUM_CLASSES)
    model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "vit_best.pth", map_location=DEVICE))
    return model.to(DEVICE).eval()


# --- Grad-CAM ----------------------------------------------------------------

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

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))
        cam = F.interpolate(cam, size=(IMAGE_SIZE, IMAGE_SIZE), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam, class_idx


# --- Attention Rollout -------------------------------------------------------

@torch.no_grad()
def attention_rollout(model, input_tensor):
    """
    Aggregate self-attention across all ViT encoder layers.
    The CLS token row of the final product tells us which patches the model
    attended to — used as a spatial explanation map.
    """
    handles = []
    captured = {}

    for i, layer in enumerate(model.encoder.layers):
        sa = layer.self_attention

        def pre_hook(module, args, kwargs, idx=i):
            kwargs["need_weights"] = True
            kwargs["average_attn_weights"] = True
            return args, kwargs

        def post_hook(module, inp, out, idx=i):
            captured[idx] = out[1].detach()

        handles.append(sa.register_forward_pre_hook(pre_hook, with_kwargs=True))
        handles.append(sa.register_forward_hook(post_hook))

    model(input_tensor)
    for h in handles:
        h.remove()

    n_layers = len(model.encoder.layers)
    tokens = captured[0][0].shape[-1]

    rollout = torch.eye(tokens, device=input_tensor.device)
    for i in range(n_layers):
        attn = captured[i][0] + torch.eye(tokens, device=input_tensor.device)
        attn = attn / attn.sum(dim=-1, keepdim=True)
        rollout = attn @ rollout

    cls_attn = rollout[0, 1:]
    grid = int(cls_attn.shape[0] ** 0.5)
    cam = cls_attn.reshape(grid, grid).cpu().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
    return cam


# --- Visualization -----------------------------------------------------------

def blend_heatmap(pil_image, cam, alpha=0.45):
    cam_up = np.array(
        Image.fromarray((cam * 255).astype(np.uint8)).resize(pil_image.size, Image.BILINEAR)
    ) / 255.0
    heatmap = plt.get_cmap("jet")(cam_up)[:, :, :3]
    base = np.array(pil_image.convert("RGB")) / 255.0
    return np.clip((1 - alpha) * base + alpha * heatmap, 0, 1)


def visualize(image_path, true_label):
    pil = Image.open(image_path).convert("RGB")
    tensor = eval_transform(pil).unsqueeze(0).to(DEVICE)

    fig, axes = plt.subplots(1, 4, figsize=(16, 4))

    axes[0].imshow(pil)
    axes[0].set_title(f"Original\nTrue: {true_label}")
    axes[0].axis("off")

    cnn, cnn_layer = load_cnn()
    cam, pred = GradCAM(cnn, cnn_layer).generate(tensor.clone().requires_grad_())
    axes[1].imshow(blend_heatmap(pil, cam))
    axes[1].set_title(f"CNN — Grad-CAM\nPred: {CLASS_NAMES[pred]}")
    axes[1].axis("off")

    eff, eff_layer = load_efficientnet()
    cam, pred = GradCAM(eff, eff_layer).generate(tensor.clone().requires_grad_())
    axes[2].imshow(blend_heatmap(pil, cam))
    axes[2].set_title(f"EfficientNet — Grad-CAM\nPred: {CLASS_NAMES[pred]}")
    axes[2].axis("off")

    vit = load_vit()
    cam = attention_rollout(vit, tensor)
    pred = vit(tensor).argmax(dim=1).item()
    axes[3].imshow(blend_heatmap(pil, cam))
    axes[3].set_title(f"ViT — Attention Rollout\nPred: {CLASS_NAMES[pred]}")
    axes[3].axis("off")

    plt.tight_layout()
    out_path = FIG_DIR / f"{Path(image_path).stem}_explainability.png"
    plt.savefig(out_path, dpi=150)
    plt.show()
    print(f"Saved: {out_path}")


# --- Run on one sample per class ---------------------------------------------

KAGGLE_PATH = "/kaggle/input/brain-tumor-mri-dataset"
DATA_ROOT = KAGGLE_PATH if os.path.exists(KAGGLE_PATH) else "data"
TEST_DIR = Path(DATA_ROOT) / "Testing"

for cls in CLASS_NAMES:
    samples = list((TEST_DIR / cls).glob("*"))[:1]
    for img_path in samples:
        visualize(img_path, cls)
