# Changelog

All notable changes to NeuroScan are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-06-28

First complete, working version. Everything below is actually implemented and verified against real training runs, not aspirational.

### Added

- Three classification architectures trained under identical conditions: a custom CNN from scratch, EfficientNet-B0 (ImageNet transfer learning, last two feature blocks + head fine-tuned), and ViT-B/16 (ImageNet transfer learning, last encoder block + head fine-tuned).
- U-Net segmentation model, trained separately on the LGG MRI Segmentation dataset, triggered automatically whenever a tumor class is predicted.
- Grad-CAM explainability for the CNN and EfficientNet-B0.
- Attention Rollout explainability for ViT-B/16 — implemented as a distinct method rather than reusing Grad-CAM, since Grad-CAM's gradient-through-feature-map assumption doesn't hold for a transformer.
- FastAPI backend with 8 endpoints covering health checks, model status, live training metrics, single-model classification, multi-model comparison with an averaged ensemble, standalone segmentation, and the combined classify-then-segment pipeline.
- MRI plausibility check on every upload (rejects non-grayscale images before they reach a model).
- `ModelRegistry` with lazy loading — checkpoints load on first request, not at server startup.
- No-fabrication guarantee: if a checkpoint file is missing, the relevant endpoint raises a clear error instead of returning a placeholder prediction.
- React + TypeScript frontend: landing page (hero, how-it-works, features, FAQ, privacy policy) plus the actual working tool (upload, single-model and comparison modes, results panel with probability bars and explainability overlay, segmentation overlay).
- Dark/light theme, persisted across sessions.
- Metrics dashboard that reads real numbers from the training scripts' output JSON at request time, rather than hardcoding them into the frontend.
- Client-side PDF export of a single prediction result.
- Docker Compose setup for running backend and frontend together.
- Training notebooks for both classification and segmentation, written to run on Kaggle's free GPU tier via `kagglehub`.
- IEEE-format paper draft (`paper/`) with the architecture, methodology, and results sections filled in using the actual numbers from the training runs.

### Known issues at this release

See [README — Known Limitations](README.md#known-limitations) for the full list. Short version: no automated tests, a GradCAM hook leak on long-running servers, a dev-mode-only Docker frontend, loose dependency pinning, one deprecated matplotlib call, an MRI validator that's a heuristic rather than a real classifier, and CORS open to all origins.

## [1.0.1] - 2026-06-28

Fixes for the known issues documented at v1.0.0 release.

### Fixed

- **GradCAM hook leak** — `GradCAM` is now a cached property on `ModelRegistry` (`cnn_gradcam`, `efficientnet_gradcam`). Hooks register once when the model first loads and stay registered for the process lifetime. Previously a new `GradCAM` object (and new hooks) was constructed on every `classify()` call.
- **No tests** — `backend/tests/` now has 17 passing pytest tests: model output shapes for all four architectures, GradCAM caching (regression for the hook leak), `WeightsNotFoundError` path, `blend_cam_overlay` output, and the MRI RGB channel check. All pass without requiring `.pth` checkpoints.
- **Deprecated matplotlib call** — `cm.get_cmap("jet")` replaced with `matplotlib.colormaps["jet"]`.
- **Loose dependency pinning** — `requirements.txt` now uses exact versions (`torch==2.12.1`, `fastapi==0.138.1`, etc.) rather than lower-bound ranges.

## [1.1.0] - planned

Remaining maintenance items:

- nginx-based production Docker build for the frontend, replacing the current dev-server setup.
- A more principled MRI input check — the current channel-difference heuristic is a tripwire, not a real validator.
- Restrict CORS from `allow_origins=["*"]` to an explicit origin list for anyone deploying this beyond localhost.

## [2.0.0] - planned

Larger changes that need new training runs or new infrastructure, not just code cleanup:

- 3D volumetric segmentation instead of per-slice 2D, so the model can use inter-slice context.
- Systematic ensemble evaluation across the full test set — `/api/classify/compare` already computes an averaged ensemble per-request, but no aggregate accuracy number for it has actually been measured yet.
- External validation on a dataset distinct from the one used for training, to check whether the reported accuracy holds up outside this specific data source (which has its own documented labeling caveats).
- Grad-CAM++ as an additional explainability option for the CNN-based models.
