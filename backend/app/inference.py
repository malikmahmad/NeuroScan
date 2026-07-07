import base64
import io
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from .models import (
    build_custom_cnn, build_efficientnet, build_vit,
    build_resnet50, build_densenet121, build_mobilenetv3, build_swin_t,
    UNet, CLASS_NAMES,
)
from .gradcam import GradCAM, vit_attention_rollout, blend_cam_overlay

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

IMAGE_SIZE = 224
SEG_IMAGE_SIZE = 256

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

classify_transform = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ]
)

segment_transform = transforms.Compose(
    [
        transforms.Resize((SEG_IMAGE_SIZE, SEG_IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ]
)


class WeightsNotFoundError(RuntimeError):
    pass


def _load_checkpoint(model: torch.nn.Module, filename: str) -> torch.nn.Module:
    path = MODELS_DIR / filename
    if not path.exists():
        raise WeightsNotFoundError(
            f"Checkpoint not found: {path}. "
            "Add the corresponding .pth file to backend/models/ before starting the server."
        )
    state_dict = torch.load(path, map_location=DEVICE)
    model.load_state_dict(state_dict)
    return model.to(DEVICE).eval()


class ModelRegistry:
    def __init__(self):
        self._cnn = None
        self._efficientnet = None
        self._vit = None
        self._resnet50 = None
        self._densenet121 = None
        self._mobilenetv3 = None
        self._swin_t = None
        self._unet = None
        self._cnn_gradcam = None
        self._eff_gradcam = None
        self._resnet50_gradcam = None
        self._densenet121_gradcam = None
        self._mobilenetv3_gradcam = None

    def status(self) -> dict:
        return {
            "cnn":              (MODELS_DIR / "cnn_best.pth").exists(),
            "efficientnet":     (MODELS_DIR / "efficientnet_best.pth").exists(),
            "vit":              (MODELS_DIR / "vit_best.pth").exists(),
            "resnet50":         (MODELS_DIR / "resnet50_best.pth").exists(),
            "densenet121":      (MODELS_DIR / "densenet121_best.pth").exists(),
            "mobilenetv3":      (MODELS_DIR / "mobilenetv3_best.pth").exists(),
            "swin_t":           (MODELS_DIR / "swin_t_best.pth").exists(),
            "unet_segmentation": (MODELS_DIR / "unet_best.pth").exists(),
        }

    # ── Classifiers ────────────────────────────────────────────────────────────
    @property
    def cnn(self):
        if self._cnn is None:
            self._cnn = _load_checkpoint(build_custom_cnn(), "cnn_best.pth")
        return self._cnn

    @property
    def cnn_gradcam(self) -> GradCAM:
        if self._cnn_gradcam is None:
            self._cnn_gradcam = GradCAM(self.cnn, _cnn_target_layer(self.cnn))
        return self._cnn_gradcam

    @property
    def efficientnet(self):
        if self._efficientnet is None:
            self._efficientnet = _load_checkpoint(
                build_efficientnet(), "efficientnet_best.pth"
            )
        return self._efficientnet

    @property
    def efficientnet_gradcam(self) -> GradCAM:
        if self._eff_gradcam is None:
            self._eff_gradcam = GradCAM(
                self.efficientnet, self.efficientnet.features[-1]
            )
        return self._eff_gradcam

    @property
    def vit(self):
        if self._vit is None:
            self._vit = _load_checkpoint(build_vit(), "vit_best.pth")
        return self._vit

    @property
    def resnet50(self):
        if self._resnet50 is None:
            self._resnet50 = _load_checkpoint(build_resnet50(), "resnet50_best.pth")
        return self._resnet50

    @property
    def resnet50_gradcam(self) -> GradCAM:
        if self._resnet50_gradcam is None:
            self._resnet50_gradcam = GradCAM(self.resnet50, self.resnet50.layer4[-1])
        return self._resnet50_gradcam

    @property
    def densenet121(self):
        if self._densenet121 is None:
            self._densenet121 = _load_checkpoint(
                build_densenet121(), "densenet121_best.pth"
            )
        return self._densenet121

    @property
    def densenet121_gradcam(self) -> GradCAM:
        if self._densenet121_gradcam is None:
            self._densenet121_gradcam = GradCAM(
                self.densenet121, self.densenet121.features.denseblock4
            )
        return self._densenet121_gradcam

    @property
    def mobilenetv3(self):
        if self._mobilenetv3 is None:
            self._mobilenetv3 = _load_checkpoint(
                build_mobilenetv3(), "mobilenetv3_best.pth"
            )
        return self._mobilenetv3

    @property
    def mobilenetv3_gradcam(self) -> GradCAM:
        if self._mobilenetv3_gradcam is None:
            self._mobilenetv3_gradcam = GradCAM(
                self.mobilenetv3, self.mobilenetv3.features[-1]
            )
        return self._mobilenetv3_gradcam

    @property
    def swin_t(self):
        if self._swin_t is None:
            self._swin_t = _load_checkpoint(build_swin_t(), "swin_t_best.pth")
        return self._swin_t

    # ── Segmentation ───────────────────────────────────────────────────────────
    @property
    def unet(self):
        if self._unet is None:
            self._unet = _load_checkpoint(UNet(), "unet_best.pth")
        return self._unet


registry = ModelRegistry()


def _pil_to_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _cnn_target_layer(model):
    return model[14]


def classify(
    image: Image.Image, model_name: str = "efficientnet", explain: bool = True
) -> dict:
    input_tensor = classify_transform(image.convert("RGB")).unsqueeze(0).to(DEVICE)

    # CNN-based models use Grad-CAM; transformers use Attention Rollout
    if model_name == "cnn":
        model = registry.cnn
        cam, pred_idx, probs = (
            registry.cnn_gradcam.generate(input_tensor, IMAGE_SIZE)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Grad-CAM"

    elif model_name == "efficientnet":
        model = registry.efficientnet
        cam, pred_idx, probs = (
            registry.efficientnet_gradcam.generate(input_tensor, IMAGE_SIZE)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Grad-CAM"

    elif model_name == "resnet50":
        model = registry.resnet50
        cam, pred_idx, probs = (
            registry.resnet50_gradcam.generate(input_tensor, IMAGE_SIZE)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Grad-CAM"

    elif model_name == "densenet121":
        model = registry.densenet121
        cam, pred_idx, probs = (
            registry.densenet121_gradcam.generate(input_tensor, IMAGE_SIZE)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Grad-CAM"

    elif model_name == "mobilenetv3":
        model = registry.mobilenetv3
        cam, pred_idx, probs = (
            registry.mobilenetv3_gradcam.generate(input_tensor, IMAGE_SIZE)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Grad-CAM"

    elif model_name == "vit":
        model = registry.vit
        cam, pred_idx, probs = (
            vit_attention_rollout(model, input_tensor)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Attention Rollout"

    elif model_name == "swin_t":
        model = registry.swin_t
        # Swin Transformer uses attention rollout via timm's built-in attn
        cam, pred_idx, probs = (
            _swin_explain(model, input_tensor)
            if explain
            else _forward_only(model, input_tensor)
        )
        method = "Attention Rollout"

    else:
        raise ValueError(f"Unknown model: {model_name}")

    result = {
        "model": model_name,
        "predicted_class": CLASS_NAMES[pred_idx],
        "confidence": float(probs[pred_idx]),
        "class_probabilities": {c: float(p) for c, p in zip(CLASS_NAMES, probs)},
        "explainability_method": method,
    }

    if explain and cam is not None:
        result["explainability_overlay_png_base64"] = _pil_to_b64(
            blend_cam_overlay(image, cam)
        )

    return result


def _forward_only(model, input_tensor):
    """Run forward pass only, no explainability."""
    with torch.no_grad():
        out = model(input_tensor)
    pred_idx = out.argmax(dim=1).item()
    probs = F.softmax(out, dim=1)[0].cpu().numpy()
    return None, pred_idx, probs


@torch.no_grad()
def _swin_explain(model, input_tensor):
    """
    Simple gradient-free attention map for Swin Transformer.
    Uses the final norm output as a spatial importance proxy,
    averaged across channels and upsampled to image size.
    """
    features = []

    def hook_fn(module, input, output):
        features.append(output.detach())

    # Hook onto the last norm layer
    handle = model.norm.register_forward_hook(hook_fn)
    output = model(input_tensor)
    handle.remove()

    pred_idx = output.argmax(dim=1).item()
    probs = torch.softmax(output, dim=1).cpu().numpy()[0]

    if features:
        feat = features[0]  # (1, H*W, C) for swin
        # Reshape to spatial grid
        n_tokens = feat.shape[1]
        grid = int(n_tokens ** 0.5)
        if grid * grid == n_tokens:
            cam = feat[0].mean(dim=-1).reshape(grid, grid).cpu().numpy()
            cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        else:
            cam = None
    else:
        cam = None

    return cam, pred_idx, probs


def classify_ensemble(image: Image.Image) -> dict:
    status = registry.status()
    available = [
        name for name, ready in status.items()
        if ready and name != "unet_segmentation"
    ]

    if not available:
        raise WeightsNotFoundError(
            "No classification checkpoints found in backend/models/."
        )

    per_model = {
        name: classify(image, model_name=name, explain=True) for name in available
    }

    avg_probs = {c: 0.0 for c in CLASS_NAMES}
    for res in per_model.values():
        for cls, p in res["class_probabilities"].items():
            avg_probs[cls] += p / len(per_model)

    ensemble_pred = max(avg_probs, key=avg_probs.get)

    return {
        "per_model": per_model,
        "ensemble": {
            "predicted_class": ensemble_pred,
            "confidence": avg_probs[ensemble_pred],
            "class_probabilities": avg_probs,
        },
    }


def segment(image: Image.Image) -> dict:
    model = registry.unet
    input_tensor = segment_transform(image.convert("RGB")).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        prob_mask = torch.sigmoid(logits)[0, 0].cpu().numpy()
        binary_mask = (prob_mask > 0.5).astype("uint8")

    tumor_pixel_ratio = float(binary_mask.mean())
    tumor_detected = tumor_pixel_ratio > 0.001

    mask_img = Image.fromarray(binary_mask * 255).resize(image.size, Image.NEAREST)
    overlay = blend_cam_overlay(image, prob_mask, alpha=0.4)

    return {
        "tumor_detected": tumor_detected,
        "tumor_area_ratio": tumor_pixel_ratio,
        "mask_png_base64": _pil_to_b64(mask_img),
        "overlay_png_base64": _pil_to_b64(overlay),
    }


def full_analysis(image: Image.Image, classifier: str = "efficientnet") -> dict:
    classification = classify(image, model_name=classifier, explain=True)
    result = {"classification": classification}

    if classification["predicted_class"] != "notumor":
        if registry.status()["unet_segmentation"]:
            result["segmentation"] = segment(image)
        else:
            result["segmentation"] = {
                "note": "Tumor detected, but segmentation weights are missing from backend/models/."
            }

    return result
