<div align="center">

# 🧠 NeuroScan WebApp

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-000000?style=flat&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**React + TypeScript frontend for the NeuroScan brain tumor MRI analysis system.**

*Upload a brain MRI scan. Get a classification, a segmentation mask, and an explainability heatmap — all in one interface.*

[🔬 Research Repo](https://github.com/malikmahmad/NeuroScan) • [📖 API Docs](https://github.com/malikmahmad/NeuroScan#api-reference) • [🚀 Quick Start](#-quick-start)

</div>

---

## 🧠 What Is This?

NeuroScan WebApp is the frontend for the [NeuroScan research framework](https://github.com/malikmahmad/NeuroScan) — a comparative deep learning system that classifies brain tumors from MRI scans using **seven independently trained architectures** (CNN, EfficientNet-B0, ResNet-50, DenseNet-121, MobileNetV3, Swin-T, ViT-B/16) and segments tumor regions using U-Net.

This interface lets you interact with the full pipeline without touching the command line.

---

## ✨ Features

- **🩻 MRI Upload** — Drag-and-drop or click to upload axial brain MRI slices
- **🤖 Single Model Mode** — Choose from 7 architectures, each with architecture-correct explainability overlay
- **⚖️ Comparison Mode** — All 7 models side-by-side with averaged ensemble prediction
- **🗺️ Segmentation View** — U-Net tumor mask and probability overlay when tumor is detected
- **📊 Live Metrics Dashboard** — Real accuracy, F1, ROC-AUC pulled from training JSON files at runtime
- **🌐 3D Network Visualization** — Interactive Three.js animated model network in the hero section
- **📄 PDF Export** — Client-side report generation for a single prediction result
- **🌙 Dark / Light Theme** — Persisted across sessions via `localStorage`
- **📱 Responsive** — Works on desktop and tablet

---

## 📊 Model Results (held-out test set, 1,600 images)

| Model | Accuracy | Macro F1 | ROC-AUC | Explainability |
|:------|:--------:|:--------:|:-------:|:--------------:|
| Custom CNN | 78.2% | 0.769 | 0.926 | Grad-CAM |
| EfficientNet-B0 | 91.6% | 0.913 | 0.985 | Grad-CAM |
| DenseNet-121 | 94.3% | 0.941 | 0.986 | Grad-CAM |
| MobileNetV3 | 94.3% | 0.941 | 0.991 | Grad-CAM |
| Swin-T | 94.8% | 0.947 | 0.990 | Attention Rollout |
| ViT-B/16 | 94.7% | 0.946 | 0.990 | Attention Rollout |
| **ResNet-50** | **95.3%** | **0.951** | **0.991** | Grad-CAM |

U-Net Segmentation: **Dice 0.886 · IoU 0.856** (589-slice held-out test set)

> All 7 models trained under identical conditions — same data splits, same augmentation, same optimizer. Architecture is the only variable.

---

## 🖥️ Tech Stack

| Layer | Technology |
|:------|:----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| 3D rendering | Three.js + React Three Fiber + Drei |
| Visual effects | `@react-three/postprocessing` |
| PDF generation | jsPDF |
| API client | Native `fetch` with typed wrappers (`src/api.ts`) |
| Styling | Custom CSS (no framework) |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/malikmahmad/NeuroScan-WebApp.git
cd NeuroScan-WebApp
npm install
```

### 2. Set backend URL

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Start backend

This frontend needs the [NeuroScan backend](https://github.com/malikmahmad/NeuroScan) running:

```bash
git clone https://github.com/malikmahmad/NeuroScan.git
cd NeuroScan/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> Model weights must be trained separately — see the [training guide](https://github.com/malikmahmad/NeuroScan#training).

### 4. Run frontend

```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## 🗂️ Project Structure

```
src/
├── App.tsx                          # Root — full single-page layout
├── ThemeContext.tsx                  # Dark/light mode, persisted to localStorage
├── api.ts                           # Typed fetch client for all backend endpoints
├── main.tsx                         # Entry point
│
├── components/
│   ├── Navbar.tsx                   # Top nav with theme toggle
│   ├── Hero.tsx                     # Landing hero section
│   ├── Hero3D.tsx                   # Three.js animated 3D model network
│   ├── HowItWorks.tsx               # Pipeline explainer
│   ├── Features.tsx                 # Feature highlights
│   ├── ToolSection.tsx              # 🔧 Main working dashboard
│   ├── UploadZone.tsx               # Drag-and-drop MRI upload
│   ├── ModelStatusBar.tsx           # Shows which of the 8 weights are loaded
│   ├── ResultsPanel.tsx             # Classification + explainability overlay
│   ├── ComparisonView.tsx           # Multi-model + ensemble results
│   ├── PremiumAnalysisPanel.tsx     # Full classify → segment pipeline
│   ├── AnalysisSequence.tsx         # Pipeline step animation
│   ├── ComparativeNetworkPanel.tsx  # 7-model network visualization
│   ├── MetricsDashboard.tsx         # Live metrics from /api/metrics/*
│   ├── About.tsx, FAQ.tsx, PrivacyPolicy.tsx
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

## 🔌 API Integration

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

## 📦 Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server on `:5173` |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |

---

## 🌍 Deploying Live

> The frontend is a static SPA — easy to deploy anywhere. The backend requires a Python server with PyTorch.

### Frontend Only (Vercel / Netlify)

```bash
npm run build
# Deploy the dist/ folder
```

Set `VITE_API_URL` as an environment variable pointing to your live backend.

### Full Stack

| Service | What to deploy |
|:--------|:--------------|
| Vercel / Netlify | `dist/` folder (frontend static build) |
| Render / Railway / Fly.io | FastAPI backend (`backend/`) |
| Docker | `docker-compose up` (local or VPS) |

**Backend note:** Model weights (`.pth` files) must be trained on Kaggle and placed in `backend/models/`. See [training guide](https://github.com/malikmahmad/NeuroScan#training).

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## 🔬 Related

- **[NeuroScan](https://github.com/malikmahmad/NeuroScan)** — Research repo: FastAPI backend, 7 PyTorch classifiers, U-Net segmentation, training notebooks, paper outline

---

## 👤 Author

**Malik Muhammad Ahmad**  
BS Information Technology — MNS University of Engineering and Technology, Multan

[![GitHub](https://img.shields.io/badge/GitHub-malikmahmad-181717?style=flat&logo=github)](https://github.com/malikmahmad)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-malik--muhammad--ahmad-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/)

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**🧠 NeuroScan WebApp** — Clean · Fast · Research-Connected

⭐ Star this repo if you find it useful!

[🐛 Report Bug](https://github.com/malikmahmad/NeuroScan-WebApp/issues) • [💡 Request Feature](https://github.com/malikmahmad/NeuroScan-WebApp/issues)

</div>
