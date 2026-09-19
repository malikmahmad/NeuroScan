import torch
from app.models import (
    CLASS_NAMES,
    NUM_CLASSES,
    UNet,
    build_custom_cnn,
    build_efficientnet,
    build_vit,
)

BATCH = 2
IMG = 224
SEG = 256


def _rand(b: int, h: int, w: int) -> torch.Tensor:
    return torch.randn(b, 3, h, w)


class TestCustomCNN:
    def test_output_shape(self):
        model = build_custom_cnn()
        model.eval()
        with torch.no_grad():
            out = model(_rand(BATCH, IMG, IMG))
        assert out.shape == (BATCH, NUM_CLASSES)

    def test_num_classes_constant(self):
        assert NUM_CLASSES == 4
        assert len(CLASS_NAMES) == NUM_CLASSES

    def test_class_names(self):
        assert set(CLASS_NAMES) == {"glioma", "meningioma", "notumor", "pituitary"}


class TestEfficientNet:
    def test_output_shape(self):
        model = build_efficientnet()
        model.eval()
        with torch.no_grad():
            out = model(_rand(BATCH, IMG, IMG))
        assert out.shape == (BATCH, NUM_CLASSES)

    def test_classifier_replaced(self):
        import torch.nn as nn

        model = build_efficientnet()
        assert isinstance(model.classifier[-1], nn.Linear)
        assert model.classifier[-1].out_features == NUM_CLASSES


class TestViT:
    def test_output_shape(self):
        model = build_vit()
        model.eval()
        with torch.no_grad():
            out = model(_rand(BATCH, IMG, IMG))
        assert out.shape == (BATCH, NUM_CLASSES)

    def test_head_replaced(self):
        import torch.nn as nn

        model = build_vit()
        assert isinstance(model.heads.head, nn.Linear)
        assert model.heads.head.out_features == NUM_CLASSES


class TestUNet:
    def test_output_shape(self):
        model = UNet()
        model.eval()
        with torch.no_grad():
            out = model(_rand(BATCH, SEG, SEG))
        assert out.shape == (BATCH, 1, SEG, SEG)

    def test_sigmoid_range(self):
        model = UNet()
        model.eval()
        with torch.no_grad():
            logits = model(_rand(1, SEG, SEG))
            probs = torch.sigmoid(logits)
        assert probs.min() >= 0.0
        assert probs.max() <= 1.0
