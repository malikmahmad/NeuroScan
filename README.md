# NeuroScan

[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.10+-EE4C2C.svg)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/malikmahmad/neuroscan/blob/main/LICENSE)
[![Status](https://img.shields.io/badge/status-research%20only-orange.svg)](https://github.com/malikmahmad/neuroscan)
[![Docker](https://img.shields.io/badge/docker-supported-2496ED.svg)](https://hub.docker.com/)
[![Quality](https://github.com/malikmahmad/neuroscan/actions/workflows/quality.yml/badge.svg)](https://github.com/malikmahmad/neuroscan/actions/workflows/quality.yml)
[![Tests](https://github.com/malikmahmad/neuroscan/actions/workflows/tests.yml/badge.svg)](https://github.com/malikmahmad/neuroscan/actions/workflows/tests.yml)

A brain tumor MRI system that classifies, segments, and explains its own predictions — built to find out, with real numbers instead of assumptions, how a CNN trained from scratch actually compares to a transfer-learned EfficientNet and a transfer-learned Vision Transformer when all three see the exact same data.

Most projects in this space train one model, report its accuracy, and stop. This one trains three architecturally different models under identical conditions, segments the tumor with a U-Net when one is found, and uses a different explainability method for the transformer than for the CNNs — because the usual one (Grad-CAM) doesn't actually apply to transformers, and a lot of public repos use it anyway.

> **Research and educational project** — not a medical device. See [Limitations](#known-limitations).

## Table of Contents

- [What it does](#what-it-does)
- [Why a controlled comparison](#why-a-controlled-comparison)
- [Results](#results)
- [Explainability: Grad-CAM vs. Attention Rollout](#explainability-grad-cam-vs-attention-rollout)
- [Pipeline](#pipeline)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [Datasets](#datasets)
- [Known limitations](#known-limitations)
- [Disclaimer](#disclaimer)
- [Citation](#citation)
- [Author](#author)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## What it does

- **Classification** — four classes (glioma, meningioma, pituitary tumor, no tumor) from a single MRI slice, scored by three independent models: a CNN trained from scratch, EfficientNet-B0, and ViT-B/16.
- **Segmentation** — a U-Net localizes the tumor in the slice when a tumor class is predicted, instead of just naming it.
- **Explainability** — Grad-CAM for the two CNN-based models, Attention Rollout for the transformer. Different math for a different architecture, not the same heatmap trick applied everywhere.
- **Comparison mode** — run all three classifiers on one image and see where they agree and where they don't, plus an averaged-probability ensemble.
- **Metrics dashboard** — the frontend reads training metrics straight from the JSON files the training scripts produce, so the numbers on screen are never hand-typed or stale.
- **PDF export** — generate a one-page report of a single prediction, client-side.

## Why a controlled comparison

It's easy to find a repo that trains a CNN, reports 90-something percent, and calls it done. What's harder to find is one where you can actually trust that the number reflects the architecture and not some difference in how the data was split or augmented.

Here, all three classifiers see the same train/val/test split, the same resizing, the same normalization, and the same augmentation (horizontal flip, ±10° rotation, brightness/contrast jitter). The only thing that changes between runs is the model. That's the whole point — if ViT comes out ahead, it's because ViT is better at this task under these conditions, not because it got an easier slice of the data.

## Results

Held-out test set: 1,600 images, 400 per class, never seen during training or model selection.

| Model | Accuracy | Macro F1 | Weighted F1 | ROC-AUC (OvR) |
|---|---|---|---|---|
| Custom CNN | 78.19% | 0.7693 | 0.7693 | 0.9264 |
| EfficientNet-B0 | 91.56% | 0.9130 | 0.9130 | 0.9850 |
| **ViT-B/16** | **94.69%** | **0.9461** | **0.9461** | **0.9897** |

Per-class F1, ViT-B/16:

| Class | F1 |
|---|---|
| Glioma | 0.900 |
| Meningioma | 0.928 |
| No tumor | 0.970 |
| Pituitary tumor | 0.986 |

U-Net segmentation (589-slice held-out test split, LGG MRI Segmentation dataset):

| Metric | Score |
|---|---|
| Dice coefficient | 0.886 |
| IoU (Jaccard) | 0.856 |

Training config: AdamW, lr=1e-4, ReduceLROnPlateau (factor 0.5, patience 2). Classification: 15 epochs, batch size 32. Segmentation: 25 epochs, batch size 16, Dice+BCE loss. NVIDIA T4 on Kaggle Notebooks. Best checkpoint kept by validation score, not the last epoch.

These numbers come straight from `notebooks/outputs/metrics/*.json` and `notebooks/outputs_segmentation/metrics/*.json` — same files the frontend's metrics dashboard reads at runtime.

## Comparison with published work

A note on how to read this table: different papers use different train/test splits, augmentation strategies, and fine-tuning depth, so these numbers aren't a strictly controlled comparison the way the three models trained for this project are against each other. They're included to show roughly where this project's numbers sit relative to published results on the same underlying dataset family — not to claim a new state of the art.

| Method | Reported Accuracy | Notes | Source |
|---|---|---|---|
| Custom CNN (this project) | 78.19% | Trained from scratch, no pretraining | — |
| EfficientNet-B0 (this project) | 91.56% | ImageNet pretraining, last 2 blocks + head fine-tuned | — |
| **ViT-B/16 (this project)** | **94.69%** | **ImageNet pretraining, last encoder block + head fine-tuned** | — |
| EfficientNetV2b0, fully fine-tuned | 99.16% | Same dataset family, full fine-tune rather than last-block-only | Hassan & Ghadiri, *Computers in Biology and Medicine*, vol. 185, art. 109542, 2025 |
| EfficientNetV2 + GAM + ECA attention | 99.76% | Custom attention modules added to the backbone, full fine-tune | Pacal, *Cluster Computing*, vol. 27(8), pp. 11187–11212, 2024 |

**What this means in context:** both published results above fully fine-tune their backbone and add custom architectural components on top of it. ViT-B/16 here deliberately only fine-tunes the last encoder block, to keep the comparison between the three architectures in this project fair given equal tuning effort — fully fine-tuning ViT-B/16, or adding attention modules the way Pacal (2024) does for EfficientNetV2, would likely close some of this gap. The point of this project isn't to claim a new top result on this dataset; it's to make the *comparison between architectures under identical, modest fine-tuning conditions* something you can actually trust.

Earlier versions of this table cited two additional sources (`arxiv:2606.18682` and a "Nickparvar, 2021 baseline") — both have been removed. The arXiv ID could not be verified against any real paper, and the Nickparvar citation conflated the dataset's creator with a publication that doesn't appear to exist. Leaving inaccurate citations in to pad out a comparison table would be a worse look than having a shorter, fully-verified one.

## Explainability: Grad-CAM vs. Attention Rollout

Grad-CAM works by taking the gradient of the predicted class score with respect to a convolutional layer's feature maps, global-average-pooling that gradient per channel to get an importance weight, and using those weights to combine the feature maps into a heatmap. That construction needs a spatial convolutional feature map to differentiate through. A CNN has one. A Vision Transformer does not — it has a sequence of patch embeddings and no convolution anywhere near the part of the network you'd want to explain.

Some repos apply Grad-CAM to a ViT anyway, usually by hooking into the last attention block and treating its output like a feature map. It produces a heatmap, but it isn't really Grad-CAM in the sense the original paper means, and there's no strong reason to trust it.

This project uses Attention Rollout instead, for ViT specifically (Abnar & Zuidema, 2020). It works on the model's actual mechanism: take the attention matrix from every encoder layer, add back the identity to account for the residual connection, and multiply the layers together. What's left is, for each input patch, how much the classification token ultimately attended to it across the whole network — which is the thing you actually want to visualize for a transformer.

CNN and EfficientNet-B0 use Grad-CAM (`backend/app/gradcam.py:GradCAM`). ViT-B/16 uses Attention Rollout (`backend/app/gradcam.py:vit_attention_rollout`). The backend picks the right one automatically based on which model served the prediction.

## Pipeline

```
                         ┌─────────────────────────┐
                         │  React + TS frontend     │
                         │  (upload, results UI)    │
                         └────────────┬─────────────┘
                                      │ multipart/form-data
                         ┌────────────▼─────────────┐
                         │   FastAPI backend         │
                         │   MRI plausibility check  │  ← rejects non-grayscale images
                         └────────────┬─────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  ▼                   ▼                   ▼
            ┌──────────┐       ┌─────────────┐      ┌──────────┐
            │ Custom   │       │ EfficientNet │      │ ViT-B/16 │
            │ CNN      │       │ -B0          │      │          │
            │ +GradCAM │       │ +GradCAM     │      │ +Attn    │
            │          │       │              │      │ Rollout  │
            └────┬─────┘       └──────┬───────┘      └────┬─────┘
                 └────────────────────┼───────────────────┘
                                      ▼
                         tumor class predicted?
                              │ yes        │ no
                              ▼            ▼
                       ┌────────────┐   notumor → done
                       │  U-Net     │
                       │  segment   │
                       └────────────┘
                              │
                              ▼
                    JSON response: class, confidence,
                    explainability overlay (base64 PNG),
                    segmentation mask (if applicable)
```

`/api/classify/compare` skips the branching above and just runs all three classifiers, returning each one's result plus an averaged-probability ensemble.

## Project structure

```
neuroscan/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI routes, MRI validation, CORS
│   │   ├── models.py          architecture definitions (single source of truth)
│   │   ├── inference.py       ModelRegistry, classify/segment/analyze logic
│   │   └── gradcam.py         GradCAM + Attention Rollout implementations
│   ├── models/                 .pth checkpoints go here (not committed)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              composes the whole single-page site
│   │   ├── ThemeContext.tsx     dark/light mode, persisted to localStorage
│   │   ├── api.ts               typed client for every backend endpoint
│   │   ├── components/
│   │   │   ├── Navbar.tsx, Hero.tsx, Hero3D.tsx    landing page chrome
│   │   │   ├── HowItWorks.tsx, Features.tsx, About.tsx, FAQ.tsx, PrivacyPolicy.tsx, Footer.tsx
│   │   │   ├── ToolSection.tsx                     the actual working dashboard
│   │   │   ├── ModelStatusBar.tsx, UploadZone.tsx, ResultsPanel.tsx, ComparisonView.tsx
│   │   │   ├── MetricsDashboard.tsx                pulls real numbers from /api/metrics/*
│   │   │   └── ScrollToTop.tsx
│   │   └── hooks/useInView.ts   scroll-triggered fade-ins
│   └── package.json
├── notebooks/
│   ├── classification_notebook.ipynb   CNN vs EfficientNet vs ViT training (Kaggle-ready)
│   ├── segmentation_notebook.ipynb     U-Net training (Kaggle-ready)
│   ├── explainability.py               Grad-CAM + Attention Rollout figure generation
│   └── outputs/, outputs_segmentation/   real metrics JSON + figures from the actual training runs
├── paper/
│   └── paper_outline.md         IEEE-style paper skeleton with the real numbers slotted in
├── docs/
│   └── architecture.svg
├── docker-compose.yml
├── package-lock.json            ← root-level leftover from a one-time npm run; safe to ignore
└── LICENSE
```

## Getting started

You need Python 3.11+ and Node 18+. The model weights are not in this repo — they're trained on Kaggle (free GPU) and copied in locally.

### 1. Train the models

Classification (`notebooks/train_classification.py`) and segmentation (`notebooks/train_segmentation.py`) are written to run on Kaggle Notebooks:

1. New Kaggle Notebook → Settings → Accelerator → GPU T4 x2.
2. First cell:
   ```python
   import kagglehub
   DATA_PATH = kagglehub.dataset_download("masoudnickparvar/brain-tumor-mri-dataset")
   ```
   (segmentation notebook uses `mateuszbuda/lgg-mri-segmentation` instead)
3. Paste the rest of the training script in, set `DATA_ROOT = DATA_PATH`, run all.
4. Classification takes roughly 30–45 minutes; segmentation roughly 20–30.
5. Download `outputs/weights/*.pth` (classification) and `outputs_segmentation/weights/unet_best.pth` (segmentation) from the notebook's Output panel — for files much over 100MB, the Kaggle API (`kaggle kernels output <user>/<notebook> -p out/`) is more reliable than clicking the download icon in the browser.

### 2. Put the weights in place

```
backend/models/
├── cnn_best.pth
├── efficientnet_best.pth
├── vit_best.pth
└── unet_best.pth
```

### 3. Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check `http://localhost:8000/api/models/status` — it tells you which checkpoints actually loaded.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`.

### 5. Or just Docker

```bash
docker-compose up
```

The frontend container runs `npm run dev` (Vite's dev server) — fine for local use, but see [Known Limitations](#known-limitations) if you're thinking about deploying this anywhere real.

## API reference

| Method | Path | Does | Response |
|---|---|---|---|
| GET | `/health` | liveness check | `{"status": "ok"}` |
| GET | `/api/models/status` | which checkpoints are loaded | `{"cnn": true, "efficientnet": true, "vit": true, "unet_segmentation": false}` |
| GET | `/api/metrics/classification` | real training metrics for the 3 classifiers | per-model accuracy/F1/history, read live from `notebooks/outputs/metrics/` |
| GET | `/api/metrics/segmentation` | real U-Net Dice/IoU | read live from `notebooks/outputs_segmentation/metrics/` |
| POST | `/api/classify` | one model's prediction + explainability overlay | `{predicted_class, confidence, class_probabilities, explainability_overlay_png_base64}` |
| POST | `/api/classify/compare` | all 3 models + averaged ensemble | `{per_model: {...}, ensemble: {...}}` |
| POST | `/api/segment` | U-Net mask + overlay | `{tumor_detected, tumor_area_ratio, mask_png_base64, overlay_png_base64}` |
| POST | `/api/analyze` | classify, then segment if a tumor class is predicted | `{classification: {...}, segmentation?: {...}}` |

All `POST` endpoints take a single `multipart/form-data` image file. Uploads are validated before inference — if the mean per-channel difference across R/G/B is under ~18, it's treated as plausibly grayscale (a real MRI slice); otherwise the API returns `422` instead of running a model on a photo of someone's cat.

## Datasets

| Dataset | Source | Used for |
|---|---|---|
| Brain Tumor MRI Dataset | Nickparvar, Kaggle | Classification — 4 classes, 5,600 train / 1,600 test |
| LGG MRI Segmentation | Buda, Saha & Mazurowski, *Computers in Biology and Medicine*, 2019 | Segmentation — 3,929 FLAIR slice/mask pairs |

The classification dataset's documentation notes that the SARTAJ-sourced glioma images have label inconsistencies. That's a property of the public data, not something this repo corrects for — it's mentioned here so nobody mistakes a clean test split for a clean ground truth.

## Known limitations

Worth knowing before you build on this:

1. ~~**GradCAM hooks accumulate on a long-running server.**~~ Fixed — `GradCAM` is now a cached property on `ModelRegistry` (`cnn_gradcam`, `efficientnet_gradcam`), so hooks register once per model and stay registered for the process lifetime instead of accumulating on every `classify()` call.
2. **The MRI validation is a heuristic, not a real input validator.** It checks mean RGB channel difference and rejects anything over ~18. A desaturated color photo would sail right through. It catches the obvious case (someone uploads a random JPEG) and nothing more.
3. **Docker's frontend service runs `npm run dev`.** That's Vite's dev server, meant for local development. Deploying this for real means `npm run build` served through nginx or similar, not the dev server.
4. ~~**`requirements.txt` uses loose version bounds.**~~ Fixed — pinned to exact versions (`torch==2.12.1`, `fastapi==0.138.1`, and so on) rather than lower-bound ranges.
5. ~~**`gradcam.py` calls the deprecated `matplotlib.cm.get_cmap("jet")`.**~~ Fixed — now uses `matplotlib.colormaps["jet"]`.
6. ~~**There are no automated tests.**~~ Fixed — `backend/tests/` now has 17 passing pytest tests covering model output shapes, GradCAM caching, the `WeightsNotFoundError` path, and the MRI channel check. None require `.pth` checkpoints to run.
7. **CORS is wide open** (`allow_origins=["*"]`). Fine for a research tool nobody's deploying publicly with real user data; not fine to copy-paste into something that is.

Beyond the code itself: the ensemble mode (`/api/classify/compare`) is fully implemented and was exercised informally during development, but no aggregate accuracy across the full test set has actually been measured for it. There's no number reported here for ensemble accuracy because one hasn't been computed — see the paper's Future Work section.

## Disclaimer

This is a research and educational project. It has not been clinically validated, has not been reviewed by a radiologist, and was trained on a single publicly available dataset with documented labeling caveats. Do not use it, or anything like it, to make real decisions about real patients.

## Citation

```bibtex
@misc{ahmad2026neuroscan,
  author = {Ahmad, Malik Muhammad},
  title  = {NeuroScan: A Comparative and Explainable Deep Learning Framework for Brain Tumor MRI Classification and Segmentation},
  year   = {2026},
  howpublished = {\url{https://github.com/malikmahmad/neuroscan}}
}
```

## Author

**Malik Muhammad Ahmad**
BS Information Technology — MNS University of Engineering and Technology, Multan

- [LinkedIn](https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/)
- [GitHub](https://github.com/malikmahmad)
- [Instagram](https://www.instagram.com/priv_ahmad007/)
- [X](https://x.com/MalikMuhammox1)

## License

MIT — see [LICENSE](LICENSE). The datasets keep their own original licenses; check each Kaggle dataset page before redistributing.

## Acknowledgements

- Brain Tumor MRI Dataset — Masoud Nickparvar (Kaggle)
- LGG MRI Segmentation — Mateusz Buda, Ashirbani Saha, Maciej A. Mazurowski
- Built by Malik Muhammad Ahmad, BS IT, MNS University of Engineering and Technology, Multan — as a self-directed AI/ML project alongside full-stack development work