<div align="center">

# 🧠 NeuroScan — Frontend

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)

**React + TypeScript frontend for the NeuroScan brain tumor MRI analysis system.**

*Upload a brain MRI scan. Get a classification, a segmentation mask, and an explainability heatmap — all in one interface.*

[🔬 Research Repo](https://github.com/malikmahmad/NeuroScan) • [📖 API Docs](https://github.com/malikmahmad/NeuroScan#api-reference) • [🚀 Quick Start](#-quick-start)

</div>

---

## What Is This?

This is the frontend component of the [NeuroScan research framework](https://github.com/malikmahmad/NeuroScan) — a comparative deep learning system that classifies brain tumors from MRI scans using **seven independently trained architectures** (CNN, EfficientNet-B0, ResNet-50, DenseNet-121, MobileNetV3, Swin-T, ViT-B/16) and segments tumor regions using U-Net.

---

## Features

- **MRI Upload** — Drag-and-drop or click to upload axial brain MRI slices
- **Single Model Mode** — Choose from 7 architectures, each with architecture-correct explainability overlay
- **Comparison Mode** — All 7 models side-by-side with averaged ensemble prediction
- **Segmentation View** — U-Net tumor mask and probability overlay when tumor is detected
- **Live Metrics Dashboard** — Real accuracy, F1, ROC-AUC pulled from training JSON files at runtime
- **Network Visualization** — Animated HTML5 Canvas model network panel
- **PDF Export** — Client-side report generation via jsPDF
- **Dark / Light Theme** — Persisted across sessions via `localStorage`
- **Responsive** — Works on desktop and tablet

---

## Model Results (held-out test set, 1,600 images)

| Model | Accuracy | Macro F1 | ROC-AUC | Explainability |
|:------|:--------:|:--------:|:-------:|:--------------:|
| Custom CNN | 78.12% | 0.769 | 0.926 | Grad-CAM |
| EfficientNet-B0 | 91.56% | 0.913 | 0.985 | Grad-CAM |
| DenseNet-121 | 93.87% | 0.937 | 0.989 | Grad-CAM |
| MobileNetV3 | 94.13% | 0.940 | 0.988 | Grad-CAM |
| Swin-T | 93.94% | 0.938 | 0.987 | Attention Rollout |
| ViT-B/16 | 93.87% | 0.937 | 0.991 | Attention Rollout |
| **ResNet-50** | **95.44%** | **0.954** | **0.990** | **Grad-CAM** |

U-Net Segmentation: **Dice 0.886 · IoU 0.856** (589-slice held-out test set)

> All 7 models trained under identical conditions — same data splits, same augmentation, same optimizer. Architecture is the only variable.

---

## Tech Stack

| Layer | Technology |
|:------|:----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Visualization | HTML5 Canvas API |
| PDF generation | jsPDF 4 |
| API client | Native `fetch` with typed wrappers (`src/api.ts`) |
| Styling | Custom CSS (no framework) |

---

## Quick Start

### 1. Install

```bash
cd frontend
npm install
```

### 2. Configure backend URL

```bash
cp .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:8000
```

### 3. Start the backend (from repo root)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> Model weights must be placed in `backend/models/` — see [training guide](https://github.com/malikmahmad/NeuroScan#training).

### 4. Run frontend

```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
│
└── src/
    ├── App.tsx                          # Root — full single-page layout
    ├── ThemeContext.tsx                  # Dark/light mode, persisted to localStorage
    ├── api.ts                           # Typed fetch client for all backend endpoints
    ├── main.tsx                         # Entry point
    │
    ├── components/
    │   ├── Navbar.tsx                   # Top nav with theme toggle
    │   ├── Hero.tsx                     # Landing hero section
    │   ├── HowItWorks.tsx               # Pipeline explainer
    │   ├── Features.tsx                 # Feature highlights
    │   ├── ToolSection.tsx              # Main working dashboard
    │   ├── UploadZone.tsx               # Drag-and-drop MRI upload
    │   ├── ModelStatusBar.tsx           # Shows which of the 8 weights are loaded
    │   ├── ResultsPanel.tsx             # Classification + explainability overlay
    │   ├── ComparisonView.tsx           # Multi-model + ensemble results
    │   ├── PremiumAnalysisPanel.tsx     # Full classify → segment pipeline
    │   ├── AnalysisSequence.tsx         # Pipeline step animation
    │   ├── ComparativeNetworkPanel.tsx  # 7-model network visualization (Canvas)
    │   ├── MetricsDashboard.tsx         # Live metrics from /api/metrics/*
    │   ├── About.tsx
    │   ├── FAQ.tsx
    │   ├── PrivacyPolicy.tsx
    │   ├── Footer.tsx
    │   └── ScrollToTop.tsx
    │
    ├── hooks/
    │   └── useInView.ts                 # Scroll-triggered fade-in
    │
    └── styles/
        └── global.css
```

---

## API Integration

All backend communication is in `src/api.ts` — fully typed:

```typescript
import { classify, segment, analyze, classifyCompare } from "./api";

// Single model (any of 7) — returns prediction + explainability overlay
const result = await classify(file, "resnet50");
console.log(result.predicted_class, result.confidence);
// result.explainability_method → "Grad-CAM" or "Attention Rollout"

// All 7 models + averaged ensemble
const comparison = await classifyCompare(file);

// Tumor segmentation mask + overlay (U-Net)
const mask = await segment(file);

// Full pipeline: classify → segment if tumor predicted
const analysis = await analyze(file, "vit");
```

**Supported model names:** `"cnn"` · `"efficientnet"` · `"resnet50"` · `"densenet121"` · `"mobilenetv3"` · `"swin_t"` · `"vit"`

---

## Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server on `:5173` |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |

---

## Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## Author

**Malik Muhammad Ahmad**  
BS Information Technology — MNS University of Engineering and Technology, Multan

[![GitHub](https://img.shields.io/badge/GitHub-malikmahmad-181717?style=flat&logo=github)](https://github.com/malikmahmad)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-malik--muhammad--ahmad-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/)

---

## License

MIT — see [LICENSE](../LICENSE) for details.

