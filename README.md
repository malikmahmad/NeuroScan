# NeuroScan: A Comparative Deep Learning Framework for Brain Tumor MRI Analysis

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.10+-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![arXiv](https://img.shields.io/badge/arXiv-2026.xxxxx-b31b1b.svg)](https://arxiv.org/)
[![Tests](https://github.com/malikmahmad/NeuroScan/actions/workflows/tests.yml/badge.svg)](https://github.com/malikmahmad/NeuroScan/actions/workflows/tests.yml)

**A rigorous comparative study of deep learning architectures for automated brain tumor classification and segmentation from MRI scans.**

[Paper](#citation) • [Results](#results) • [Installation](#installation) • [Datasets](#datasets) • [Documentation](#documentation)

</div>

---

## Overview

NeuroScan is a comprehensive research framework that evaluates **three fundamentally different neural architectures** under **rigorously controlled conditions** for brain tumor MRI analysis. Unlike most work that reports single-model performance, this project establishes a fair, reproducible comparison across:

- **Custom CNN** (baseline, trained from scratch)
- **EfficientNet-B0** (transfer learning from ImageNet)
- **Vision Transformer (ViT-B/16)** (modern attention-based architecture)

Additionally, we integrate **U-Net segmentation** for tumor localization and implement **architecture-appropriate explainability methods** (Grad-CAM for CNNs, Attention Rollout for transformers).

### Key Contributions

1. **Controlled Architecture Comparison** — Identical data splits, preprocessing, augmentation, and training protocols across all models
2. **Clinical Validation** — Beyond classification: tumor segmentation with clinical-grade Dice coefficient (0.886)
3. **Methodologically Correct Explainability** — Grad-CAM for convolutional models, Attention Rollout for transformers (not Grad-CAM forced onto ViT)
4. **Complete Reproducibility** — All metrics computed from test sets, training curves preserved, model checkpoints shareable
5. **Production-Ready Backend** — FastAPI server with comprehensive error handling, input validation, and 17 passing pytest tests

> **⚠️ Research Use Only**  
> This system has not been clinically validated and is not approved for medical diagnosis. It serves as a research tool for investigating deep learning architectures in medical imaging.

---

## Results

### Classification Performance (1,600-image held-out test set)

| Model | Accuracy | Macro F1 | Weighted F1 | ROC-AUC (OvR) |
|:------|:--------:|:--------:|:-----------:|:-------------:|
| Custom CNN | 78.19% | 0.769 | 0.769 | 0.926 |
| EfficientNet-B0 | 91.56% | 0.913 | 0.913 | 0.985 |
| DenseNet-121 | 94.25% | 0.941 | 0.941 | 0.986 |
| MobileNetV3-Large | 94.25% | 0.941 | 0.941 | 0.991 |
| Swin-T | 94.81% | 0.947 | 0.947 | 0.990 |
| ResNet-50 | 95.25% | 0.951 | 0.951 | 0.991 |
| **ViT-B/16** | **94.69%** | **0.946** | **0.946** | **0.990** |

### Per-Class Performance (ViT-B/16)

| Class | Precision | Recall | F1-Score | Support |
|:------|:---------:|:------:|:--------:|:-------:|
| Glioma | 0.991 | 0.825 | 0.900 | 400 |
| Meningioma | 0.879 | 0.983 | 0.928 | 400 |
| No Tumor | 0.941 | 1.000 | 0.970 | 400 |
| Pituitary | 0.992 | 0.980 | 0.986 | 400 |

### Segmentation Performance (U-Net, 589-slice held-out test set)

| Metric | Score |
|:-------|:-----:|
| **Dice Coefficient** | **0.886** |
| **IoU (Jaccard)** | **0.856** |

**Training Configuration:**
- Optimizer: AdamW (lr=1e-4, weight decay=1e-4)
- Scheduler: ReduceLROnPlateau (factor=0.5, patience=2)
- Classification: 15 epochs, batch size 32, cross-entropy loss
- Segmentation: 25 epochs, batch size 16, Dice + BCE loss
- Hardware: NVIDIA T4 GPU (Kaggle Notebooks)

All results are from held-out test sets never seen during training or hyperparameter selection.

---

## Architecture Details

### Model Comparison

| Model | Total Params | Trainable | Pretraining | Explainability |
|:------|:-----------:|:---------:|:-----------:|:--------------:|
| Custom CNN | 0.42M | 0.42M (100%) | None | Grad-CAM |
| EfficientNet-B0 | 4.01M | 1.13M | ImageNet-1K | Grad-CAM |
| MobileNetV3-Large | 4.21M | 2.99M | ImageNet-1K | Grad-CAM |
| DenseNet-121 | 6.96M | 2.16M | ImageNet-1K | Grad-CAM |
| ResNet-50 | 23.52M | 14.97M | ImageNet-1K | Grad-CAM |
| Swin-T | 27.52M | 15.37M | ImageNet-1K | Attention Rollout |
| ViT-B/16 | 85.8M | 7.09M | ImageNet-1K | Attention Rollout |

All parameter counts computed directly from model definitions in `backend/app/models.py`.

### 1. Custom CNN (Baseline)
```
Input (3×224×224)
├─ Conv2D(3→32) + BN + ReLU + MaxPool
├─ Conv2D(32→64) + BN + ReLU + MaxPool
├─ Conv2D(64→128) + BN + ReLU + MaxPool
├─ Conv2D(128→256) + BN + ReLU + MaxPool
├─ AdaptiveAvgPool2D(1×1)
├─ Flatten
├─ Dropout(0.3) + Linear(256→128) + ReLU
└─ Dropout(0.3) + Linear(128→4)
```
**Parameters:** 0.42M total, 0.42M trainable (100%, trained from scratch)
**Purpose:** Establish baseline performance without transfer learning

### 2. EfficientNet-B0
- **Backbone:** ImageNet-pretrained EfficientNet-B0
- **Fine-tuning:** Last 2 feature blocks + classifier head
- **Modified Head:** Dropout(0.3) → Linear(1280→4)
- **Parameters:** 4.01M total, 1.13M trainable

### 3. MobileNetV3-Large
- **Backbone:** ImageNet-pretrained MobileNetV3-Large
- **Fine-tuning:** Last 3 feature blocks + classifier head
- **Modified Head:** Linear(1280→4)
- **Parameters:** 4.21M total, 2.99M trainable

### 4. DenseNet-121
- **Backbone:** ImageNet-pretrained DenseNet-121
- **Fine-tuning:** DenseBlock4 + norm5 + classifier head
- **Modified Head:** Dropout(0.3) → Linear(1024→4)
- **Parameters:** 6.96M total, 2.16M trainable

### 5. ResNet-50
- **Backbone:** ImageNet-pretrained ResNet-50
- **Fine-tuning:** Layer4 + fc head
- **Modified Head:** Dropout(0.3) → Linear(2048→4)
- **Parameters:** 23.52M total, 14.97M trainable

### 6. Swin Transformer (Swin-T)
- **Backbone:** ImageNet-pretrained Swin-Tiny
- **Fine-tuning:** Last Swin stage + classification head
- **Modified Head:** Linear(768→4)
- **Parameters:** 27.52M total, 15.37M trainable
- **Explainability:** Attention Rollout (transformer-based, no convolutions)

### 7. Vision Transformer (ViT-B/16)
- **Backbone:** ImageNet-pretrained ViT-B/16
- **Fine-tuning:** Last encoder block + classification head
- **Modified Head:** Linear(768→4)
- **Parameters:** 85.8M total, 7.09M trainable
- **Explainability:** Attention Rollout

### 8. U-Net (Segmentation)
```
Encoder: 4 stages (32→64→128→256)
Bottleneck: 512 channels
Decoder: 4 stages with skip connections
Output: Single-channel binary mask
```
**Loss:** Dice + Binary Cross-Entropy
**Purpose:** Tumor localization when classification predicts tumor class

---

## Explainability

### Grad-CAM (CNN & EfficientNet-B0)
**Gradient-weighted Class Activation Mapping**

1. Forward pass → compute predicted class score
2. Backward pass → compute gradients w.r.t. target convolutional layer
3. Global average pooling of gradients → channel importance weights
4. Weighted combination of feature maps → spatial heatmap
5. ReLU + bilinear upsampling + normalization

**Target Layers:**
- Custom CNN: `model[14]` (final BatchNorm before pooling)
- EfficientNet-B0: `model.features[-1]` (last MBConv block)

### Attention Rollout (ViT-B/16)
**Transformer-Specific Visualization** (Abnar & Zuidema, 2020)

1. Extract attention matrices from all 12 encoder layers
2. Add identity matrix to each (accounting for residual connections)
3. Renormalize: `A_norm = A / A.sum(dim=-1, keepdim=True)`
4. Multiply sequentially: `Rollout = A₁₂ @ A₁₁ @ ... @ A₁`
5. Extract CLS token row → reshape to 14×14 patch grid
6. Bilinear upsample to input resolution

**Why Different Methods?**  
Grad-CAM requires spatial convolutional feature maps for gradient computation. ViT has no convolutions — it operates on tokenized patches with self-attention. Attention Rollout directly visualizes what the model actually computed: cumulative attention flow from patches to classification token.

---

## Installation

### Prerequisites
- Python 3.11+
- CUDA-capable GPU (optional, CPU inference supported but slower)
- 8GB+ RAM (16GB recommended for training)

### Clone Repository
```bash
git clone https://github.com/malikmahmad/NeuroScan.git
cd NeuroScan
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Model Weights
Train models using provided Kaggle notebooks (see [Training](#training)) or download pretrained weights:

```bash
# Place .pth files in backend/models/
backend/models/
├── cnn_best.pth
├── efficientnet_best.pth
├── vit_best.pth
├── resnet50_best.pth
├── densenet121_best.pth
├── mobilenetv3_best.pth
├── swin_t_best.pth
└── unet_best.pth
```

### Run Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API documentation available at: `http://localhost:8000/docs`

---

## Training

All training is designed to run on **Kaggle Notebooks** (free GPU T4 tier).

### Classification Training

1. Create new Kaggle Notebook
2. Settings → Accelerator → GPU T4 x2
3. Add code cell:
```python
import kagglehub
DATA_PATH = kagglehub.dataset_download("masoudnickparvar/brain-tumor-mri-dataset")
```
4. Copy contents of `notebooks/train_classification.py`
5. Set `DATA_ROOT = DATA_PATH` in the script
6. Run all cells (~30-45 minutes)

**Outputs:**
- `outputs/weights/*.pth` — model checkpoints
- `outputs/metrics/*.json` — test results & training history
- `outputs/figures/*.png` — confusion matrices, training curves

### Segmentation Training

1. Same Kaggle setup as above
2. Add code cell:
```python
import kagglehub
DATA_PATH = kagglehub.dataset_download("mateuszbuda/lgg-mri-segmentation")
```
3. Copy contents of `notebooks/train_segmentation.py`
4. Run all cells (~20-30 minutes)

**Outputs:**
- `outputs_segmentation/weights/unet_best.pth`
- `outputs_segmentation/metrics/segmentation_test_results.json`

### Download Weights from Kaggle
For files >100MB, use Kaggle API:
```bash
kaggle kernels output <username>/<notebook-name> -p ./outputs
```

---

## API Reference

### Endpoints

#### Health Check
```http
GET /health
```
Returns server status.

#### Model Status
```http
GET /api/models/status
```
Returns which model checkpoints are loaded:
```json
{
  "cnn": true,
  "efficientnet": true,
  "vit": true,
  "unet_segmentation": true
}
```

#### Classification
```http
POST /api/classify?model_name={cnn|efficientnet|vit|resnet50|densenet121|mobilenetv3|swin_t}
Content-Type: multipart/form-data

file: <MRI image>
```

**Response:**
```json
{
  "model": "vit",
  "predicted_class": "glioma",
  "confidence": 0.923,
  "class_probabilities": {
    "glioma": 0.923,
    "meningioma": 0.054,
    "notumor": 0.012,
    "pituitary": 0.011
  },
  "explainability_method": "Attention Rollout",
  "explainability_overlay_png_base64": "iVBORw0KGg..."
}
```

#### Multi-Model Comparison
```http
POST /api/classify/compare
Content-Type: multipart/form-data

file: <MRI image>
```

Returns predictions from all available models + averaged ensemble.

#### Segmentation
```http
POST /api/segment
Content-Type: multipart/form-data

file: <MRI image>
```

**Response:**
```json
{
  "tumor_detected": true,
  "tumor_area_ratio": 0.187,
  "mask_png_base64": "iVBORw0KGg...",
  "overlay_png_base64": "iVBORw0KGg..."
}
```

#### Full Analysis
```http
POST /api/analyze?classifier={cnn|efficientnet|vit}
Content-Type: multipart/form-data

file: <MRI image>
```

Classifies image, then segments if tumor class predicted.

#### Training Metrics
```http
GET /api/metrics/classification
GET /api/metrics/segmentation
```

Returns real training metrics read from `notebooks/outputs/metrics/*.json`.

---

## Datasets

### Classification: Brain Tumor MRI Dataset
**Source:** [Nickparvar, Kaggle](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset)

| Class | Training | Testing | Total |
|:------|:--------:|:-------:|:-----:|
| Glioma | 1,400 | 400 | 1,800 |
| Meningioma | 1,400 | 400 | 1,800 |
| No Tumor | 1,400 | 400 | 1,800 |
| Pituitary | 1,400 | 400 | 1,800 |
| **Total** | **5,600** | **1,600** | **7,200** |

**Modalities:** T1-weighted, T2-weighted, FLAIR (axial slices)  
**Format:** JPEG (224×224 after preprocessing)  
**Augmentation:** Horizontal flip, ±10° rotation, brightness/contrast jitter

**Known Limitation:** SARTAJ-sourced glioma subset has documented label inconsistencies ([dataset notes](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset/discussion)).

### Segmentation: LGG MRI Segmentation Dataset
**Source:** [Buda et al., Kaggle](https://www.kaggle.com/datasets/mateuszbuda/lgg-mri-segmentation)  
**Paper:** Buda, Saha & Mazurowski, *Computers in Biology and Medicine*, 2019

- **Total slices:** 3,929 FLAIR/mask pairs
- **Tumor-positive:** 1,373 slices
- **Tumor-negative:** 2,556 slices
- **Split:** 70% train / 15% val / 15% test (stratified by tumor presence)
- **Format:** TIFF (256×256 after preprocessing)
- **Loss:** Dice + Binary Cross-Entropy (handles class imbalance)

---

## Project Structure

```
NeuroScan/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes & input validation
│   │   ├── models.py         # PyTorch architecture definitions
│   │   ├── inference.py      # ModelRegistry, classify/segment logic
│   │   └── gradcam.py        # Grad-CAM & Attention Rollout
│   ├── models/               # .pth checkpoints (not in git)
│   ├── tests/                # 17 pytest tests
│   ├── requirements.txt      # Pinned dependencies
│   └── Dockerfile
│
├── notebooks/
│   ├── train_classification.py        # CNN/EfficientNet/ViT training
│   ├── train_segmentation.py          # U-Net training
│   ├── classification_notebook.ipynb  # Jupyter version
│   ├── segmentation_notebook.ipynb    # Jupyter version
│   ├── explainability.py              # Generate heatmap figures
│   ├── outputs/                       # Real training results (committed)
│   │   ├── metrics/*.json             # Test results & history
│   │   └── figures/*.png              # Confusion matrices, curves
│   └── outputs_segmentation/
│       ├── metrics/segmentation_test_results.json
│       └── figures/segmentation_qualitative.png
│
├── paper/
│   └── paper_outline.md      # IEEE-style paper structure
│
├── docs/
│   └── architecture.svg      # System architecture diagram
│
├── .github/
│   ├── workflows/
│   │   ├── tests.yml         # Pytest CI
│   │   └── quality.yml       # Linting (black, flake8)
│   └── ISSUE_TEMPLATE/       # Bug report, feature request, model improvement
│
├── README.md                 # This file
├── CONTRIBUTING.md           # Contribution guidelines
├── CHANGELOG.md              # Version history
├── CODE_OF_CONDUCT.md
├── LICENSE                   # MIT
└── .gitignore
```

---

## Comparison with Published Work

| Method | Accuracy | Notes | Reference |
|:-------|:--------:|:------|:----------|
| Custom CNN (this work) | 78.19% | Baseline, no pretraining | — |
| EfficientNet-B0 (this work) | 91.56% | Last 2 blocks fine-tuned | — |
| DenseNet-121 (this work) | 94.25% | DenseBlock4 fine-tuned | — |
| MobileNetV3 (this work) | 94.25% | Last 3 blocks fine-tuned | — |
| Swin-T (this work) | 94.81% | Last stage fine-tuned | — |
| **ViT-B/16 (this work)** | **94.69%** | Last encoder block fine-tuned | — |
| **ResNet-50 (this work)** | **95.25%** | Layer4 fine-tuned | — |
| EfficientNetV2b0 | 99.16% | Full backbone fine-tune | Hassan & Ghadiri, *Comp. Biol. Med.*, 2025 |
| EfficientNetV2 + Attention | 99.76% | Custom attention modules | Pacal, *Cluster Comput.*, 2024 |

**Context:** All 7 models in this work use identical data splits, augmentation, and training protocol — only the architecture changes. Published results use full backbone fine-tuning and/or custom architectural additions.

---

## Limitations

### Dataset
- **2D slices only** — No 3D volumetric context (inter-slice information)
- **Single institution** — LGG segmentation dataset is single-source
- **Label noise** — SARTAJ glioma subset has documented inconsistencies

### Model
- **No ensemble evaluation** — Multi-model comparison implemented but not benchmarked on full test set
- **Fixed input size** — 224×224 classification, 256×256 segmentation
- **No uncertainty quantification** — Single forward pass, no Monte Carlo dropout or ensembling

### Deployment
- **MRI validation heuristic** — RGB channel difference check, not a trained classifier
- **CPU inference slow** — No TensorRT/ONNX optimization
- **No DICOM support** — Accepts JPEG/PNG/TIFF only

### Clinical
- **Not validated by radiologists** — No prospective clinical study
- **No regulatory approval** — Research tool only, not medical device
- **No demographic analysis** — Unknown performance across age/sex/ethnicity

---

## Citation

If you use this work, please cite:

```bibtex
@misc{ahmad2026neuroscan,
  author = {Ahmad, Malik Muhammad},
  title  = {NeuroScan: A Comparative Deep Learning Framework for Brain Tumor MRI Classification and Segmentation},
  year   = {2026},
  url    = {https://github.com/malikmahmad/NeuroScan}
}
```

**Paper:** [arXiv:2026.xxxxx] (Forthcoming)

---

## Key References

1. **Vision Transformers:** Dosovitskiy et al., "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale," *ICLR 2021*
2. **EfficientNet:** Tan & Le, "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks," *ICML 2019*
3. **U-Net:** Ronneberger et al., "U-Net: Convolutional Networks for Biomedical Image Segmentation," *MICCAI 2015*
4. **Grad-CAM:** Selvaraju et al., "Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization," *ICCV 2017*
5. **Attention Rollout:** Abnar & Zuidema, "Quantifying Attention Flow in Transformers," *ACL 2020*
6. **LGG Dataset:** Buda, Saha & Mazurowski, "Association of genomic subtypes of lower-grade gliomas with shape features automatically extracted by a deep learning algorithm," *Computers in Biology and Medicine*, 2019

---

## Contributing

We welcome contributions! Areas where help is most needed:

**Code:**
- Additional architectures (ConvNeXt, MedViT, EfficientNetV2)
- 3D volumetric models
- TensorRT/ONNX optimization for deployment
- Uncertainty quantification (MC Dropout, deep ensembles)

**Research:**
- Cross-dataset validation
- Ensemble accuracy on full 1,600-image test set
- Attention mechanism analysis for ViT
- Multi-task learning (classification + segmentation jointly)

**Documentation:**
- Tutorials for reproducing experiments
- Deployment guides (Docker, AWS, GCP)
- Translation to other languages

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

---

## Contact

**Malik Muhammad Ahmad**  
BS Information Technology  
MNS University of Engineering and Technology, Multan

- **GitHub:** [@malikmahmad](https://github.com/malikmahmad)
- **LinkedIn:** [malik-muhammad-ahmad](https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/)
- **Email:** [malikmahmad@example.com](mailto:malikmahmad@example.com)

---

## Acknowledgments

- **Datasets:** Masoud Nickparvar (Kaggle), Buda et al. (LGG MRI Segmentation)
- **Compute:** Kaggle Notebooks (free GPU tier)
- **Frameworks:** PyTorch, FastAPI, torchvision
- **Inspiration:** Medical AI research community

---

## License

MIT License — see [LICENSE](LICENSE) for details.

**Datasets retain their original licenses:**
- Brain Tumor MRI Dataset: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- LGG MRI Segmentation: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

<div align="center">

**NeuroScan** — Rigorous • Reproducible • Research-Grade

⭐ Star this repository if you find it useful!

[Report Bug](https://github.com/malikmahmad/NeuroScan/issues) • [Request Feature](https://github.com/malikmahmad/NeuroScan/issues) • [Discussions](https://github.com/malikmahmad/NeuroScan/discussions)

</div>
