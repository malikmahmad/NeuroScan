# Changelog

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [1.2.0] — 2026-07-07

### Added
- **4 new classification models** — ResNet-50, DenseNet-121, MobileNetV3-Large, and Swin Transformer (Swin-T), all trained under identical conditions (same data splits, augmentation, optimizer, 15 epochs) as the original 3 models.
- **Architecture-specific explainability for all new models** — Grad-CAM for ResNet-50, DenseNet-121, MobileNetV3 (all CNN-based); Attention Rollout for Swin-T (transformer-based).
- **`timm==1.0.9`** added to `requirements.txt` for Swin Transformer support.
- **Updated API endpoints** — `/api/classify` and `/api/analyze` now accept all 7 model names.
- **Updated README** — full 7-model results table, architecture details, and comparison with published work.

### Results (held-out test set, 1,600 images)

| Model | Accuracy | Macro F1 | ROC-AUC |
|---|---|---|---|
| ResNet-50 | 95.44% | 0.954 | 0.990 |
| MobileNetV3 | 94.13% | 0.940 | 0.988 |
| Swin-T | 93.94% | 0.938 | 0.987 |
| DenseNet-121 | 93.87% | 0.937 | 0.989 |
| ViT-B/16 | 93.87% | 0.937 | 0.991 |

---

## [1.1.0] — 2026-07-03

### Changed
- **Repository restructured as full-stack research project.** Backend inference engine, training notebooks, model architectures, paper documentation, and React frontend (`frontend/`) are all maintained in this repository.
- **README completely rewritten** as a research-grade document covering architecture comparisons, full results tables (per-class metrics, confusion matrices), training methodology, dataset details, API reference, and limitations.
- **CONTRIBUTING.md rewritten** — removed frontend-specific guidelines, expanded research contribution areas (cross-dataset validation, ensemble evaluation, new architectures, uncertainty quantification).

---

## [1.0.1] — 2026-06-28

Fixes for known issues documented at v1.0.0.

### Fixed
- **GradCAM hook accumulation** — `GradCAM` is now a cached property on `ModelRegistry`. Hooks register once per model on first access and persist for the process lifetime. Previously, a new `GradCAM` instance (and new hooks) was constructed on every `classify()` call.
- **No tests** — `backend/tests/` now has 17 passing pytest tests: output shapes for all four architectures, GradCAM caching (regression for the hook leak), `WeightsNotFoundError` error path, `blend_cam_overlay` output, and MRI RGB channel validation. All pass without requiring `.pth` checkpoints.
- **Deprecated matplotlib API** — `cm.get_cmap("jet")` replaced with `matplotlib.colormaps["jet"]`.
- **Loose dependency pinning** — `requirements.txt` now uses exact versions (`torch==2.12.1`, `fastapi==0.138.1`, etc.).

---

## [1.0.0] — 2026-06-28

First complete, working release. All items below are implemented and verified against real training runs.

### Added

**Models**
- Custom CNN (4 conv blocks, trained from scratch)
- EfficientNet-B0 (ImageNet pretraining, last 2 blocks + head fine-tuned)
- ViT-B/16 (ImageNet pretraining, last encoder block + head fine-tuned)
- U-Net (encoder-decoder with skip connections, Dice+BCE loss)

**Research Results**
- Classification on 1,600-image held-out test set: CNN 78.12%, EfficientNet 91.56%, DenseNet 93.87%, MobileNetV3 94.13%, Swin-T 93.94%, ViT 93.87%, ResNet-50 95.44%
- Segmentation on 589-slice held-out test set: Dice 0.886, IoU 0.856
- All metrics stored in `notebooks/outputs/metrics/*.json` (read at runtime, not hard-coded)

**Explainability**
- Grad-CAM for CNN and EfficientNet-B0 (hooks on last convolutional layer)
- Attention Rollout for ViT-B/16 (layer-by-layer attention multiplication with residual identity)

**Backend**
- FastAPI server with 8 endpoints: health, model status, metrics, classify, compare, segment, analyze
- MRI plausibility check on every upload (mean RGB channel difference threshold)
- `ModelRegistry` with lazy checkpoint loading (loads on first request, not at startup)
- `WeightsNotFoundError` raised explicitly if checkpoint is missing (no silent fallback)

**Training Infrastructure**
- Kaggle-ready training notebooks: `notebooks/train_classification.py`, `notebooks/train_segmentation.py`
- Full training outputs committed: metrics JSON, training history, figures
- Identical data splits, preprocessing, augmentation, and optimizer across all seven classifiers

**Documentation**
- `paper/paper_outline.md` — IEEE-style paper structure with real results
- `README.md` — Architecture comparisons, datasets, API reference, limitations
- GitHub Actions CI: pytest on push/PR, black+flake8 quality check

---

## Planned

### [1.2.0]
- Ensemble accuracy measurement on full 1,600-image test set
- Uncertainty quantification (MC Dropout)
- ROC curve figures in outputs

### [2.0.0] Planned
- Cross-dataset validation
- 3D volumetric segmentation
- Additional architectures (ConvNeXt, MedViT, EfficientNetV2)
- DICOM input support

