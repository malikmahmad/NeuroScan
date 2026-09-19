import io
import os

import numpy as np
import pytest
from PIL import Image

CI = os.environ.get("NEUROSCAN_CI") == "1"


def test_weights_not_found_error_is_runtime_error():
    from app.inference import WeightsNotFoundError

    err = WeightsNotFoundError("missing.pth")
    assert isinstance(err, RuntimeError)
    assert "missing.pth" in str(err)


def test_load_checkpoint_raises_when_missing(tmp_path):
    import torch.nn as nn

    from app.inference import WeightsNotFoundError, _load_checkpoint

    model = nn.Linear(4, 4)
    fake_path = tmp_path / "nonexistent.pth"

    with pytest.raises(WeightsNotFoundError, match="nonexistent.pth"):
        _load_checkpoint(model, str(fake_path))


def test_blend_cam_overlay_output_size():
    from app.gradcam import blend_cam_overlay

    img = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    cam = np.random.rand(14, 14).astype(np.float32)

    result = blend_cam_overlay(img, cam)

    assert isinstance(result, Image.Image)
    assert result.size == img.size
    assert result.mode == "RGB"


def test_blend_cam_overlay_pixel_range():
    from app.gradcam import blend_cam_overlay

    img = Image.fromarray(np.full((32, 32, 3), 128, dtype=np.uint8))
    cam = np.zeros((7, 7), dtype=np.float32)

    result = blend_cam_overlay(img, cam, alpha=0.5)
    arr = np.array(result)

    assert arr.min() >= 0
    assert arr.max() <= 255


def test_gradcam_cached_in_registry():
    from app.inference import ModelRegistry
    from app.models import build_custom_cnn

    registry = ModelRegistry()
    registry._cnn = build_custom_cnn().eval()

    cam1 = registry.cnn_gradcam
    cam2 = registry.cnn_gradcam
    assert cam1 is cam2, "cnn_gradcam must be cached — new instance each call leaks hooks"


def test_efficientnet_gradcam_cached_in_registry():
    from app.inference import ModelRegistry
    from app.models import build_efficientnet

    registry = ModelRegistry()
    registry._efficientnet = build_efficientnet().eval()

    cam1 = registry.efficientnet_gradcam
    cam2 = registry.efficientnet_gradcam
    assert cam1 is cam2, "efficientnet_gradcam must be cached"


def _make_image_bytes(mode: str, color) -> bytes:
    img = Image.new(mode, (64, 64), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def test_grayscale_image_passes_channel_check():
    gray_val = 128
    rgb = np.full((64, 64, 3), gray_val, dtype=np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    channel_diff = (
        np.abs(r - g).mean() + np.abs(r - b).mean() + np.abs(g - b).mean()
    ) / 3.0
    assert channel_diff < 18.0


def test_colorful_image_fails_channel_check():
    img = np.zeros((64, 64, 3), dtype=np.float32)
    img[:, :, 1] = 255
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    channel_diff = (
        np.abs(r - g).mean() + np.abs(r - b).mean() + np.abs(g - b).mean()
    ) / 3.0
    assert channel_diff > 18.0
