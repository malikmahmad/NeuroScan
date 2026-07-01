import base64
import io
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from .models import build_custom_cnn, build_efficientnet, build_vit, UNet, CLASS_NAMES
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
        self._unet = None
        self._cnn_gradcam = None
        self._eff_gradcam = None

    def status(self) -> dict:
        return {
            "cnn": (MODELS_DIR / "cnn_best.pth").exists(),
            "efficientnet": (MODELS_DIR / "efficientnet_best.pth").exists(),
            "vit": (MODELS_DIR / "vit_best.pth").exists(),
            "unet_segmentation": (MODELS_DIR / "unet_best.pth").exists(),
        }

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

    if model_name == "cnn":
        model = registry.cnn
        if explain:
            cam, pred_idx, probs = registry.cnn_gradcam.generate(
                input_tensor, IMAGE_SIZE
            )
        else:
            with torch.no_grad():
                out = model(input_tensor)
            cam, pred_idx, probs = (
                None,
                out.argmax(dim=1).item(),
                F.softmax(out, dim=1)[0].cpu().numpy(),
            )
        method = "Grad-CAM"

    elif model_name == "efficientnet":
        model = registry.efficientnet
        if explain:
            cam, pred_idx, probs = registry.efficientnet_gradcam.generate(
                input_tensor, IMAGE_SIZE
            )
        else:
            with torch.no_grad():
                out = model(input_tensor)
            cam, pred_idx, probs = (
                None,
                out.argmax(dim=1).item(),
                F.softmax(out, dim=1)[0].cpu().numpy(),
            )
        method = "Grad-CAM"

    elif model_name == "vit":
        model = registry.vit
        if explain:
            cam, pred_idx, probs = vit_attention_rollout(model, input_tensor)
        else:
            with torch.no_grad():
                out = model(input_tensor)
            cam, pred_idx, probs = (
                None,
                out.argmax(dim=1).item(),
                F.softmax(out, dim=1)[0].cpu().numpy(),
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


def classify_ensemble(image: Image.Image) -> dict:
    available = [
        name
        for name, ready in registry.status().items()
        if ready and name != "unet_segmentation"
    ]

    if not available:
        raise WeightsNotFoundError(
            "No classification checkpoints found in backend/models/."
        )

    per_model = {
        name: classify(image, model_name=name, explain=False) for name in available
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
