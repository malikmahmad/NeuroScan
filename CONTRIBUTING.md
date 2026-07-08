# Contributing to NeuroScan

Thanks for your interest. NeuroScan is a research framework comparing seven neural architectures for brain tumor MRI classification and segmentation. Contributions that strengthen the scientific rigor, extend reproducibility, or improve code quality are most welcome.

## Before You Open an Issue

Check [Known Limitations](README.md#limitations) first. Some things — the heuristic MRI validator, lack of ensemble accuracy on the full test set, no DICOM support — are documented and known. A PR addressing these is more useful than a new issue confirming they exist.

## Reporting a Bug

Use the **bug report** template under `.github/ISSUE_TEMPLATE/`. The two things that reliably speed up diagnosis:

1. Exact steps to reproduce
2. Whether you're running on CPU or GPU (CUDA/CPU device mismatches between a saved checkpoint and the inference machine cause silent `state_dict` key errors that look like many things)

## Proposing a Feature

Use the **feature request** template. Describe the problem you're solving before describing what you want built — sometimes the underlying need has a simpler fix.

For architecture changes (new model, different loss, fine-tuning strategy), use the **model improvement** template — it asks for the kind of detail (expected accuracy/speed/memory tradeoffs, supporting citations) that a general feature request doesn't.

## Development Setup

```bash
git clone https://github.com/malikmahmad/NeuroScan-Research.git
cd NeuroScan-Research

# Backend
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

You need trained weights in `backend/models/` to run inference locally. See [Training](README.md#training) for Kaggle-based steps. The API still responds to `/health` and `/api/models/status` without weights in place — useful if you're working on routing or validation logic only.

## Running Tests

```bash
cd backend
pytest tests/ -v
```

All 17 tests pass without requiring `.pth` checkpoint files. Tests cover:

- Output shapes for all four architectures (CNN, EfficientNet, ViT, U-Net)
- GradCAM hook caching (regression for the hook-accumulation bug)
- `WeightsNotFoundError` path
- `blend_cam_overlay` output
- MRI plausibility check (RGB channel difference heuristic)

## Code Standards

**Python**

- PEP 8 throughout. `black` and `flake8` run in CI (`.github/workflows/quality.yml`) and will reject anything non-conforming.
- Type hints on all function signatures — match the style in `backend/app/`.
- Docstrings should explain a decision, not restate the function name:
  - Bad: `"""Loads the model."""`
  - Good: `"""Loads checkpoint, raising WeightsNotFoundError if the path is missing."""`

**Architecture Definitions**

If you modify `backend/app/models.py` (architecture change, new layer, different head), you must verify that existing checkpoints still load correctly. A mismatched `state_dict` fails with a key error that isn't obvious — mention checkpoint compatibility explicitly in your PR.

**Notebooks**

`notebooks/train_classification.py` and `notebooks/train_segmentation.py` are written to run in Kaggle cells. Model architecture logic is intentionally kept consistent with `backend/app/models.py`. If you change an architecture, update both.

## Commit Messages

Conventional commits format:

```
feat:     new functionality
fix:      bug fix
docs:     documentation only
refactor: code change with no functional change
test:     adding or updating tests
chore:    tooling, CI, dependencies
```

Keep the summary under 72 characters. Put the "why" in the commit body when it isn't obvious from the diff.

## Pull Requests

Use the PR template. It asks:

- What the change does
- What kind of change it is (bug fix, new feature, refactor, etc.)
- What testing was done (manual is fine — just describe it)
- Whether anything breaks or requires migration

## What's Needed Most

Roughly in priority order:

1. **Ensemble evaluation** — `/api/classify/compare` runs a per-image averaged ensemble but no aggregate accuracy has been measured on the full 1,600-image test set yet.

2. **Cross-dataset validation** — Testing performance on a dataset outside the Nickparvar collection would show whether the reported numbers are specific to this data distribution.

3. **Additional architectures** — MedViT, ConvNeXt, or other transformer variants — following the same controlled-comparison protocol (identical splits, identical augmentation).

4. **Uncertainty quantification** — MC Dropout or deep ensembles; single-pass softmax confidence is not calibrated uncertainty.

5. **3D volumetric analysis** — Current models process individual 2D axial slices. Multi-slice or volumetric input (MedicalNet, 3D U-Net) is a meaningful extension.

6. **MRI input validation** — The current RGB channel-difference heuristic is a tripwire, not a real validator. A dedicated lightweight binary classifier distinguishing MRI slices from natural images would be a real improvement.

7. **Notebook refactor** — Shared logic (especially model architecture definitions) is duplicated between `notebooks/train_*.py` and `backend/app/models.py`. Making the notebooks import from the backend package would eliminate the risk of silent drift.

If you want to take on something not on this list, open an issue first describing your intent — avoids the situation where a substantial PR conflicts with a direction already planned.
