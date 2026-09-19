# What Happens When Seven Deep Learning Models See the Exact Same Brain MRI Data?

---

> **NeuroScan** is an open-source medical imaging research project comparing seven deep learning architectures for four-class brain tumor MRI classification under identical experimental conditions. The repository also includes U-Net segmentation, architecture-specific explainability, a production-style FastAPI backend, and reproducible training notebooks.
>
> 🔗 [github.com/malikmahmad/NeuroScan](https://github.com/malikmahmad/NeuroScan)

---

## Key Contributions

✅ Fair benchmark across 7 architectures — same data, same splits, same conditions  
✅ Architecture-specific explainability — Grad-CAM for CNNs, Attention Rollout for transformers  
✅ Automatic U-Net segmentation when a tumor class is predicted  
✅ Production-style FastAPI backend with 17 passing pytest tests  
✅ Fully reproducible training pipeline on Kaggle (free T4 GPU)  
✅ Open-source, MIT-licensed, no fabricated results  

---

## The question most brain-tumor-MRI projects don't actually answer

Search GitHub and you'll find countless brain tumor MRI repositories reporting impressive accuracy numbers. What you'll rarely find is a controlled comparison where every model is trained and evaluated under identical conditions.

Without that control, a single accuracy number doesn't tell you whether you're looking at a better architecture or just a luckier data split. [NeuroScan](https://github.com/malikmahmad/NeuroScan) exists to answer that question honestly, then goes one step further: it segments the tumor once it's found, and explains its own predictions using architecture-correct methods — Grad-CAM for convolutional models, Attention Rollout for transformers — because the usual approach (Grad-CAM applied everywhere) doesn't actually work that way.

Everything below is either a number computed from a real held-out test set, or something you can go read in the source yourself. Nothing here is rounded up or estimated for effect.

---

## What's actually in the repository

- **Seven independent classifiers** — Custom CNN, EfficientNet-B0, ResNet-50, DenseNet-121, MobileNetV3-Large, Swin-T, and ViT-B/16 — all trained under identical conditions so architecture is the only variable
- **U-Net segmentation** that runs automatically whenever a tumor class is predicted, localizing it in the slice
- **Architecture-specific explainability** — Grad-CAM for the five CNN-based models, Attention Rollout for the two transformer-based models (Swin-T and ViT-B/16)
- **A FastAPI backend** with 8 endpoints, MRI-plausibility input validation, and 17 passing pytest tests
- **Full training infrastructure** — Kaggle-ready [notebooks](https://github.com/malikmahmad/NeuroScan/tree/main/notebooks), with every metric written to JSON and read live rather than hand-typed into documentation

The repo is structured as a full-stack research project — backend inference engine, training notebooks, model definitions, paper documentation, and a React frontend, all laid out in the [README](https://github.com/malikmahmad/NeuroScan/blob/main/README.md).

---

## The controlled comparison

All seven classifiers train on identical 224×224 resized, ImageNet-normalized inputs, with identical augmentation (horizontal flip, ±10° rotation, brightness/contrast jitter), the same AdamW optimizer (lr=1e-4) with the same ReduceLROnPlateau schedule, for the same 15 epochs at batch size 32, on the same NVIDIA T4 GPU. The only thing that changes between runs is the architecture itself, defined once and shared across training and inference.

| Model | Parameters (total) | Parameters (trainable) | Pretraining |
|---|---|---|---|
| Custom CNN | 0.42M | 0.42M (100%, from scratch) | None |
| EfficientNet-B0 | 4.01M | 1.13M (last 2 blocks + head) | ImageNet-1K |
| MobileNetV3-Large | 4.21M | 2.99M (last 3 blocks + head) | ImageNet-1K |
| DenseNet-121 | 6.96M | 2.16M (DenseBlock4 + head) | ImageNet-1K |
| ResNet-50 | 23.52M | 14.97M (Layer4 + head) | ImageNet-1K |
| Swin-T | 27.52M | 15.37M (last stage + head) | ImageNet-1K |
| ViT-B/16 | 85.8M | 7.09M (last encoder block + head) | ImageNet-1K |

All parameter counts are computed directly from the model definitions in `backend/app/models.py`, not estimated.

---

## Results — held-out test set, 1,600 images, 400 per class

| Model | Accuracy | Macro F1 | Weighted F1 | ROC-AUC (OvR) |
|---|---|---|---|---|
| Custom CNN | 78.12% | 0.769 | 0.769 | 0.926 |
| EfficientNet-B0 | 91.56% | 0.913 | 0.913 | 0.985 |
| DenseNet-121 | 93.87% | 0.937 | 0.937 | 0.989 |
| MobileNetV3-Large | 94.13% | 0.940 | 0.940 | 0.988 |
| Swin-T | 93.94% | 0.938 | 0.938 | 0.987 |
| ViT-B/16 | 93.87% | 0.937 | 0.937 | 0.991 |
| **ResNet-50** | **95.44%** | **0.954** | **0.954** | **0.990** |

A few things worth noting. The gap between the CNN baseline and all transfer-learned models is substantial — 17 percentage points between scratch-trained CNN (78.12%) and ResNet-50 (95.44%). Among the transfer-learned models, performance clusters tightly between 93.87% and 95.44%, meaning the choice of architecture matters far less than the decision to use pretraining at all.

Per-class F1 for ResNet-50: glioma 0.910, meningioma 0.940, no tumor 0.971, pituitary 0.994. Glioma is the hardest class across all seven models — consistent with documented label inconsistencies in the SARTAJ-sourced glioma subset. This has not been adjusted for or hidden.

Segmentation, on a held-out 589-slice test set: Dice coefficient 0.886, IoU 0.856.

The full methodology — exact splits, exact hyperparameters, exact evaluation protocol — is written up in IEEE format in the [paper draft](https://github.com/malikmahmad/NeuroScan/blob/main/paper/paper_outline.md), and the raw training runs are reproducible from the notebooks linked above.

---

## How this sits next to published work

| Method | Accuracy | Notes | Source |
|---|---|---|---|
| **ResNet-50 (this work)** | **95.44%** | Layer4 fine-tuned only | — |
| ViT-B/16 (this work) | 93.87% | Last encoder block fine-tuned only | — |
| EfficientNetV2b0 | 99.16% | Full backbone fine-tune | Hassan & Ghadiri, *Computers in Biology and Medicine*, 2025 |
| EfficientNetV2 + attention | 99.76% | Full fine-tune + custom attention modules | Pacal, *Cluster Computing*, 2024 |

The published results above fully fine-tune their backbone and add custom architectural components. This project deliberately fine-tunes only the last block or stage of each model, to keep the seven-way comparison fair under equal, modest tuning effort. That's a real gap — full fine-tuning would likely close some of it — but that's a different experiment than the one this project runs.

---

## Explainability: the right math for each architecture

Grad-CAM computes a class-discriminative heatmap by taking the gradient of the predicted class score with respect to a convolutional layer's feature maps, pooling that gradient per channel into an importance weight, and using it to combine the layer's activations. That requires an actual spatial convolutional feature map — which CNN, EfficientNet-B0, ResNet-50, DenseNet-121, and MobileNetV3 all have.

Swin-T and ViT-B/16 do not. For these two, the repo uses **Attention Rollout** (Abnar & Zuidema, 2020) instead: it aggregates the self-attention matrices from every encoder layer, adds back the identity to account for the residual connections, and composes the layers by repeated matrix multiplication. What's left is, for each patch, how much the classification token actually attended to it across the whole network — the correct question to ask a transformer.

The backend picks the right method automatically based on which model served the prediction. Both implementations live in one file, [`backend/app/gradcam.py`](https://github.com/malikmahmad/NeuroScan/blob/main/backend/app/gradcam.py).

---

## No fabricated results, by design

Model checkpoints load lazily — on first request, not at server startup — and if one is missing, the API raises a clear error instead of returning a placeholder prediction. That logic sits in [`backend/app/inference.py`](https://github.com/malikmahmad/NeuroScan/blob/main/backend/app/inference.py). A medical-imaging tool should never return a number it didn't actually compute, even in a demo.

Every upload is validated before it reaches a model: if the mean per-channel difference across R/G/B exceeds a threshold, it's treated as unlikely to be a real MRI slice and rejected. That's a heuristic, not a trained classifier — a desaturated color photo would still pass — and it's documented as exactly that.

---

## What doesn't work perfectly yet

Worth stating plainly, tracked openly in the [changelog](https://github.com/malikmahmad/NeuroScan/blob/main/CHANGELOG.md):

- The MRI validation is a channel-difference heuristic, not a real medical input validator
- Ensemble prediction is implemented — the API averages all seven models' outputs — but hasn't been benchmarked for aggregate accuracy on the full test set, so no number is claimed for it
- Segmentation is 2D, slice-by-slice, with no volumetric context between slices
- CORS is open for local research use and would need tightening for any real deployment
- Nothing here has been reviewed by a radiologist or validated against an external, multi-institution dataset

This is a research and educational project. It is not a diagnostic device, and nothing here should be read as evidence that it's ready to be one.

---

## What's next

Short-term: measuring ensemble accuracy on the full 1,600-image test set, uncertainty quantification via MC Dropout, and ROC curve visualizations. Longer-term: cross-dataset validation, 3D volumetric segmentation, and DICOM input support. All of it is on the same changelog linked above, dated rather than promised vaguely.

---

## A personal note

Building NeuroScan taught me far more than training neural networks. It reinforced the importance of reproducibility, fair experimentation, and transparent reporting — especially in medical AI, where every claimed improvement should be supported by evidence, not just stated.

The hardest part wasn't the code. It was resisting the temptation to present results that looked better than they were — to pick the best split, tune the comparison, or skip the limitations section. The value of this kind of project isn't the accuracy number. It's that someone else can run it and get the same number.

If you find the project useful — as a baseline, a teaching example, or just a reference for how Grad-CAM and Attention Rollout actually differ — I'd genuinely appreciate your feedback, suggestions, or contributions.

---

If any of this is useful to you, the [repository](https://github.com/malikmahmad/NeuroScan) is MIT-licensed and open. A star helps other people find it. Issues and pull requests are welcome, especially around the items flagged in [CONTRIBUTING.md](https://github.com/malikmahmad/NeuroScan/blob/main/CONTRIBUTING.md) — and if you read the code and find something that doesn't hold up, that's exactly the kind of issue worth opening.

⭐ **Star it if it's useful. Fork it if you want to push any of these numbers further.**
