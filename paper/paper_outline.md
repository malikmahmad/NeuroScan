# Paper Outline

**Title:** A Comparative Deep Learning Framework with Explainable AI for Brain Tumor Classification and Segmentation from MRI

---

## Abstract
Write last. Cover: the problem (manual MRI reading is slow and variable), the gap (most work tests one architecture without a fair cross-family comparison), your approach (CNN vs EfficientNet vs ViT on identical splits + U-Net segmentation + correct explainability), your headline numbers, and the conclusion. Keep it under 250 words.

---

## I. Introduction

- Clinical motivation: brain tumor diagnosis from MRI is time-consuming and subject to inter-reader variability
- What current deep learning work does, and where it falls short:
  - Most papers report a single architecture's accuracy
  - Few papers combine classification, segmentation, and explainability in one evaluated system
  - Almost none use a methodologically correct explainability method for both CNN and transformer architectures
- Your contributions:
  1. A fair three-way comparison (CNN / EfficientNet / ViT) trained on identical data splits
  2. U-Net tumor localization as a separate evaluated component
  3. Grad-CAM for conv-based models, Attention Rollout for ViT — not mixed up

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
- **ViT-B/16:** ImageNet pretrained, all layers frozen except last encoder block + replaced head
- **U-Net:** Standard encoder-decoder with skip connections, Dice+BCE loss to handle tumor/background imbalance

### C. Training Setup
- Loss: cross-entropy (classification), Dice+BCE (segmentation)
- Optimizer: AdamW, lr=1e-4, ReduceLROnPlateau scheduler
- Epochs: 15 (classification), 25 (segmentation)
- Batch size: 32 (classification), 16 (segmentation)
- Hardware: NVIDIA T4 GPU (Kaggle Notebooks)

### D. Explainability
- Grad-CAM hooks onto the last ReLU activation before pooling for CNN, and the final feature block for EfficientNet
- Attention Rollout for ViT: multiply attention matrices layer by layer with residual identity added at each step, then read the CLS token's row for patch importance
- Both methods produce a spatial heatmap overlaid on the original image

### E. Evaluation Metrics
- Classification: accuracy, macro F1, weighted F1, ROC-AUC (one-vs-rest)
- Segmentation: Dice coefficient, IoU

---

## IV. Results

All numbers below come directly from the saved JSON/CSV output files — do not retype them.

**Table 1 — Classification comparison** (`outputs/metrics/model_comparison.csv`):

| Model | Accuracy | Macro F1 | ROC-AUC |
|---|---|---|---|
| Custom CNN | 78.2% | 0.769 | 0.926 |
| EfficientNet-B0 | 91.6% | 0.913 | 0.985 |
| ViT-B/16 | 94.7% | 0.946 | 0.990 |

**Table 2 — Segmentation** (`outputs_segmentation/metrics/segmentation_test_results.json`):

| Model | Dice | IoU |
|---|---|---|
| U-Net | 0.886 | 0.856 |

- Figure 1: Training curves per model — from `*_history.json`
- Figure 2: Confusion matrices — from `outputs/figures/`
- Figure 3: Explainability panels (one row per class, four columns: original / CNN Grad-CAM / EfficientNet Grad-CAM / ViT Attention Rollout)
- Figure 4: Segmentation overlays — from `outputs_segmentation/figures/`

---

## V. Discussion

- ViT achieved the highest accuracy (94.7%), which is consistent with transformers benefiting from ImageNet pretraining when fine-tuned on domain-specific data
- CNN vs EfficientNet gap (78.2% vs 91.6%) shows the value of transfer learning even with partial fine-tuning
- Meningioma had the lowest per-class F1 across all models — likely because its visual features overlap with other classes; worth noting explicitly
- Validation Dice fluctuation in U-Net training is expected on this dataset: many slices contain very small tumor regions, making Dice sensitive to slight mask misalignment
- Limitations: all inputs are 2D axial slices, not 3D volumes; segmentation dataset is single-institution; no clinical validation has been performed

---

## VI. Conclusion

Summarize: three-architecture comparison on identical splits, U-Net segmentation, and methodologically correct explainability in one end-to-end system. ViT outperformed the CNN baselines on this task. Segmentation Dice of 0.886 is within the published range for U-Net on this dataset.

Future work: 3D volumetric models, multi-institution data, prospective clinical evaluation.

---

## References

Use IEEE numbered format [1], [2], ... — generate from BibTeX via Google Scholar or Zotero rather than formatting by hand.
