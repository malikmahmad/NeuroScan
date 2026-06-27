# Contributing to NeuroScan

Thanks for considering it. This started as a self-directed comparison of three architectures on one MRI dataset and grew into a full-stack thing with a backend, a frontend, and a paper draft — there's plenty here that could use another pair of eyes, especially in the places listed under "what's needed most" below.

## Before you file anything

Check the [Known Limitations](README.md#known-limitations) section first. A handful of things — the missing tests, the loose dependency pinning, the dev-mode Docker frontend — are already known and already written down. If you've found one of those, you don't need to file an issue for it; a PR fixing it is more useful than a report confirming it exists.

## Reporting a bug

Use the bug report template under `.github/ISSUE_TEMPLATE/`. The two things that actually speed up a fix: exact steps to reproduce, and whether you're running on GPU or CPU. A surprising number of "it doesn't work" reports turn out to be CUDA/CPU device mismatches between a checkpoint and the machine loading it.

## Proposing a feature

Use the feature request template. Say what problem it solves before you say what you want built — sometimes there's a simpler fix for the underlying problem than the feature being proposed.

If your proposal is specifically about model performance (a different architecture, a different loss function, a fine-tuning strategy), use the model improvement template instead — it asks for the kind of detail (expected accuracy/speed/memory tradeoff, supporting papers or experiments) that a pure feature request doesn't.

## Development setup

```bash
git clone https://github.com/malikmahmad/neuroscan.git
cd neuroscan

# backend
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt

# frontend, separate terminal
cd frontend
npm install
```

You'll need trained model weights to actually run inference locally — see the README's [Getting Started](README.md#getting-started) for the Kaggle training steps. If you're only working on the frontend UI or backend routing logic and don't need real predictions, the API will still respond to `/health` and `/api/models/status` without any weights in place.

## Code standards

**Python**

- PEP 8. `black` and `flake8` run in CI (`.github/workflows/quality.yml`) and will flag anything that doesn't conform.
- Type hints on function signatures — the existing code in `backend/app/` does this consistently, match it.
- Docstrings should explain a decision, not restate the function name. `"""Loads the checkpoint, raising WeightsNotFoundError if it's missing."""` is more useful than `"""Loads the model."""` because the reader already knows it loads something; what they don't know is what happens when it can't.

**TypeScript**

- Named exports, not default-export-everything.
- No `any`. If you genuinely don't know the shape of something, define an interface for it rather than reaching for `any` to make the compiler stop complaining.
- Keep components focused on one thing. `ToolSection.tsx` got fairly large because it owns the whole interactive dashboard's state — if you're adding a new component, it's a sign you should probably split rather than append.

## Commit messages

Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Keep the first line under about 72 characters and explain the "why" in the body if it's not obvious from the diff alone.

## Pull requests

Use the PR template. It asks what the change does, what kind of change it is, what testing you actually did (manual is fine — just say so), and whether anything breaks. A PR that touches `backend/app/models.py` needs to mention whether existing checkpoints still load with the new architecture definitions, since a mismatch there fails silently as a `state_dict` key error rather than something obvious.

Review is informal right now — this is a small project, not a project with a maintainer team. Expect a response, not necessarily a fast one.

## What's needed most right now

In rough priority order:

1. **Tests.** There are none. Even a handful of `pytest` cases for `backend/app/inference.py` covering the "weights missing" path and a basic classify call against a known checkpoint would be a real improvement over the current zero.
2. **The GradCAM hook leak.** `inference.py` builds a new `GradCAM` per request instead of caching one per model. Fixing this properly means deciding where the cached instance lives — probably `ModelRegistry` — and making sure hooks get cleaned up if a model is ever reloaded.
3. **A production Docker setup for the frontend.** Currently `docker-compose.yml` runs Vite's dev server. An nginx-based multi-stage build serving the `npm run build` output would be the right fix.
4. **Notebook polish.** `train_classification.py` and `train_segmentation.py` work, but they were written to be pasted into a Kaggle cell rather than maintained as a package — turning shared logic (the model definitions, especially) into an importable module instead of duplicating it between the notebooks and `backend/app/models.py` would remove a real risk of the two silently drifting apart.
5. **A more principled MRI input check.** The current channel-difference heuristic is a tripwire, not a validator. Something that actually checks for DICOM/NIfTI-like intensity distributions, or at minimum a basic classifier trained to distinguish MRI slices from arbitrary photos, would be a meaningful upgrade.
6. **Frontend things:** the segmentation overlay rendering could use a toggle for opacity, and the comparison view's mobile layout is functional but cramped on small screens.

If you want to take on something not on this list, open an issue first describing what you're thinking — saves both of us the situation where a PR shows up for something that turns out to conflict with a direction already in mind.
