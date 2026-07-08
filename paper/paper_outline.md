# Paper Outline

**Title:** A Controlled Seven-Architecture Comparison with Explainable AI for Brain Tumor Classification and Segmentation from MRI

---

## Abstract
Write last. Cover: the problem (manual MRI reading is slow and variable), the gap (most work tests one architecture without a fair cross-family comparison), your approach (CNN vs EfficientNet vs ResNet-50 vs DenseNet-121 vs MobileNetV3 vs Swin-T vs ViT on identical splits + U-Net segmentation + architecture-correct explainability), your headline numbers, and the conclusion. Keep it under 250 words.

---

## I. Introduction

- Clinical motivation: brain tumor diagnosis from MRI is time-consuming and subject to inter-reader variability
- What current deep learning work does, and where it falls short:
  - Most papers report a single architecture's accuracy
  - Few papers combine classification, segmentation, and explainability in one evaluated system
  - Almost none use a methodologically correct explainability method for both CNN and transformer architectures
- Your contributions:
  1. A fair seven-way comparison (CNN / EfficientNet-B0 / ResNet-50 / DenseNet-121 / MobileNetV3 / Swin-T / ViT-B/16) trained on identical data splits
  2. U-Net tumor localization as a separate evaluated component
  3. Grad-CAM for conv-based models, Attention Rollout for transformers — not mixed up

---

## II. Related Work

One paragraph each:
- Early CNN approaches to brain tumor MRI
- Transfer learning on this task (EfficientNet, ResNet variants)
- Vision Transformers in medical imaging
- U-Net and segmentation variants for tumor localization
- Explainability in medical imaging (Grad-CAM, attention methods)

Key citations (verify details before submitting):
- Ronneberger et al. (2015) — U-Net
- Tan & Le (2019) — EfficientNet
- Dosovitskiy et al. (2020) — ViT
- Selvaraju et al. (2017) — Grad-CAM
- Abnar & Zuidema (2020) — Attention Rollout
- Buda, Saha & Mazurowski (2019) — LGG segmentation dataset paper

---

## III. Methodology

### A. Datasets
- **Classification:** Brain Tumor MRI Dataset (Nickparvar, Kaggle) — 4 classes, pull exact split sizes from your training output
- **Segmentation:** LGG MRI Segmentation (Buda et al., Kaggle) — 3,929 slice pairs, 1,373 tumor-positive, 2,556 negative
- Preprocessing: resize to 224×224 (classification) / 256×256 (segmentation), ImageNet normalization, augmentation (random flip, ±10° rotation, color jitter)

### B. Model Architectures
- **Custom CNN:** 4 conv blocks (3→32→64→128→256 channels), AdaptiveAvgPool, two FC layers — trained from scratch, no pretraining bias
- **EfficientNet-B0:** ImageNet pretrained, early feature blocks frozen, last 2 blocks + replaced classifier fine-tuned
- **ResNet-50:** ImageNet pretrained, all layers frozen except Layer4 + replaced fc head
- **DenseNet-121:** ImageNet pretrained, all frozen except DenseBlock4 + norm5 + replaced classifier
- **MobileNetV3-Large:** ImageNet pretrained, all frozen except last 3 feature blocks + replaced classifier
- **Swin-T:** ImageNet pretrained (timm), all frozen except last Swin stage + replaced head
- **ViT-B/16:** ImageNet pretrained, all layers frozen except last encoder block + replaced head
- **U-Net:** Standard encoder-decoder with skip connections, Dice+BCE loss to handle tumor/background imbalance

### C. Training Setup
- Loss: cross-entropy (classification), Dice+BCE (segmentation)
- Optimizer: AdamW, lr=1e-4, ReduceLROnPlateau scheduler
- Epochs: 15 (classification), 25 (segmentation)
- Batch size: 32 (classification), 16 (segmentation)
- Hardware: NVIDIA T4 GPU (Kaggle Notebooks)

### D. Explainability
- Grad-CAM hooks onto last convolutional feature map for CNN, EfficientNet-B0, ResNet-50, DenseNet-121, MobileNetV3
- Attention Rollout for Swin-T and ViT-B/16: multiply attention matrices layer by layer with residual identity added at each step, then read the CLS token's row for patch importance
- Both methods produce a spatial heatmap overlaid on the original image

### E. Evaluation Metrics
- Classification: accuracy, macro F1, weighted F1, ROC-AUC (one-vs-rest)
- Segmentation: Dice coefficient, IoU

---

## IV. Results

All numbers below come directly from the saved JSON output files — do not retype them.

**Table 1 — Classification comparison** (`outputs/metrics/model_comparison.csv`):

| Model | Accuracy | Macro F1 | ROC-AUC |
|---|---|---|---|
| Custom CNN | 78.19% | 0.769 | 0.926 |
| EfficientNet-B0 | 91.56% | 0.913 | 0.985 |
| DenseNet-121 | 94.25% | 0.941 | 0.986 |
| MobileNetV3-Large | 94.25% | 0.941 | 0.991 |
| Swin-T | 94.81% | 0.947 | 0.990 |
| ViT-B/16 | 94.69% | 0.946 | 0.990 |
| ResNet-50 | 95.25% | 0.951 | 0.991 |

**Table 2 — Segmentation** (`outputs_segmentation/metrics/segmentation_test_results.json`):

| Model | Dice | IoU |
|---|---|---|
| U-Net | 0.886 | 0.856 |

- Figure 1: Training curves per model — from `*_history.json`
- Figure 2: Confusion matrices — from `outputs/figures/`
- Figure 3: Explainability panels (one row per class, columns: original / CNN Grad-CAM / EfficientNet Grad-CAM / ResNet-50 Grad-CAM / Swin-T Attention Rollout / ViT Attention Rollout)
- Figure 4: Segmentation overlays — from `outputs_segmentation/figures/`

---

## V. Discussion

- ResNet-50 achieved the highest accuracy (95.25%), followed closely by Swin-T (94.81%) and ViT-B/16 (94.69%)
- The gap between CNN baseline (78.19%) and all transfer-learned models shows the dominant effect of pretraining over architecture choice
- Transfer-learned models cluster tightly (94.25%–95.25%), suggesting diminishing returns from architecture selection once pretraining is used
- Meningioma had the lowest per-class F1 across all models — likely because its visual features overlap with other classes
- Validation Dice fluctuation in U-Net training is expected on this dataset: many slices contain very small tumor regions
- Limitations: all inputs are 2D axial slices, not 3D volumes; segmentation dataset is single-institution; no clinical validation has been performed

---

## VI. Conclusion

Summarize: seven-architecture comparison on identical splits, U-Net segmentation, and architecture-correct explainability in one end-to-end system. ResNet-50 achieved best accuracy (95.25%) but all transfer-learned models performed within 1 percentage point of each other. Segmentation Dice of 0.886 is within the published range for U-Net on this dataset.

Future work: 3D volumetric models, multi-institution data, prospective clinical evaluation, DICOM support.

---

## References

Use IEEE numbered format [1], [2], ... — generate from BibTeX via Google Scholar or Zotero rather than formatting by hand.
