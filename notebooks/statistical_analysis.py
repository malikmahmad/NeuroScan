"""
Statistical Analysis — NeuroScan
Computes 95% CI (Wilson) and McNemar's test for all 7 classifiers.
Run from: c:\Users\mahma\Downloads\NeuroScan\backend
Command:  ..\venv311\Scripts\python.exe ..\notebooks\statistical_analysis.py
"""

import sys, json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader

# ── paths ──────────────────────────────────────────────────────────────────────
BACKEND   = Path(__file__).resolve().parent.parent / "backend"
MODELS_DIR = BACKEND / "models"
sys.path.insert(0, str(BACKEND))

from app.models import (
    build_custom_cnn, build_efficientnet, build_vit,
    build_resnet50, build_densenet121, build_mobilenetv3, build_swin_t,
    CLASS_NAMES,
)

# ── dataset ────────────────────────────────────────────────────────────────────
# Update this path to wherever the Testing folder is on your machine
TEST_DIR = Path(r"C:\Users\mahma\Downloads\brain-tumor-mri-dataset\Testing")

if not TEST_DIR.exists():
    # Try common kaggle cache location
    import os
    home = Path.home()
    candidates = list(home.glob("**/brain-tumor-mri-dataset/Testing"))
    if candidates:
        TEST_DIR = candidates[0]
        print(f"Found test data at: {TEST_DIR}")
    else:
        print("ERROR: Cannot find test dataset. Set TEST_DIR manually in this script.")
        sys.exit(1)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {DEVICE}")

eval_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
test_ds     = datasets.ImageFolder(str(TEST_DIR), transform=eval_tf)
test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)
print(f"Test images: {len(test_ds)}")

# ── model registry ──────────────────────────────────────────────────────────────
MODELS = {
    "cnn":         (build_custom_cnn,    "cnn_best.pth"),
    "efficientnet":(build_efficientnet,  "efficientnet_best.pth"),
    "resnet50":    (build_resnet50,      "resnet50_best.pth"),
    "densenet121": (build_densenet121,   "densenet121_best.pth"),
    "mobilenetv3": (build_mobilenetv3,   "mobilenetv3_best.pth"),
    "swin_t":      (build_swin_t,        "swin_t_best.pth"),
    "vit":         (build_vit,           "vit_best.pth"),
}

# ── get predictions ─────────────────────────────────────────────────────────────
all_preds = {}
labels_true = None

for name, (builder, pth_name) in MODELS.items():
    pth = MODELS_DIR / pth_name
    if not pth.exists():
        print(f"SKIP {name} — {pth} not found"); continue
    model = builder().to(DEVICE).eval()
    model.load_state_dict(torch.load(pth, map_location=DEVICE))
    preds, labs = [], []
    with torch.no_grad():
        for imgs, lbs in test_loader:
            out = model(imgs.to(DEVICE))
            preds.extend(out.argmax(dim=1).cpu().numpy())
            labs.extend(lbs.numpy())
    all_preds[name] = np.array(preds)
    if labels_true is None:
        labels_true = np.array(labs)
    acc = np.mean(all_preds[name] == labels_true)
    print(f"{name:12s}: acc={acc:.4f}")

if not all_preds:
    print("No models loaded. Check MODELS_DIR path."); sys.exit(1)

# ── 95% CI (Wilson) ─────────────────────────────────────────────────────────────
print("\n=== 95% Confidence Intervals (Wilson) ===")
try:
    from statsmodels.stats.proportion import proportion_confint
except ImportError:
    print("Install statsmodels: pip install statsmodels"); sys.exit(1)

ci_results = {}
for name, preds in all_preds.items():
    n_correct = int(np.sum(preds == labels_true))
    n_total   = len(labels_true)
    lo, hi    = proportion_confint(n_correct, n_total, alpha=0.05, method="wilson")
    acc       = n_correct / n_total
    ci_results[name] = {"accuracy": round(acc, 4), "ci_low": round(lo, 4), "ci_high": round(hi, 4)}
    print(f"{name:12s}: {acc:.4f}  95% CI [{lo:.4f}, {hi:.4f}]")

# ── McNemar's test (all pairs vs ResNet-50) ─────────────────────────────────────
print("\n=== McNemar's Test: ResNet-50 vs others ===")
from statsmodels.stats.contingency_tables import mcnemar

mcnemar_results = {}
best = "resnet50"

if best not in all_preds:
    print(f"ERROR: {best} predictions not available."); sys.exit(1)

best_correct = (all_preds[best] == labels_true)

for name, preds in all_preds.items():
    if name == best:
        continue
    other_correct = (preds == labels_true)
    b = int(np.sum( best_correct & ~other_correct))
    c = int(np.sum(~best_correct &  other_correct))
    result = mcnemar([[0, b], [c, 0]], exact=True)
    sig = "SIGNIFICANT (p<0.05)" if result.pvalue < 0.05 else "not significant"
    mcnemar_results[name] = {
        "b": b, "c": c,
        "pvalue": round(result.pvalue, 6),
        "significant": result.pvalue < 0.05
    }
    print(f"ResNet-50 vs {name:12s}: b={b:3d} c={c:3d}  p={result.pvalue:.4f}  [{sig}]")

# ── Save results ─────────────────────────────────────────────────────────────────
OUT = Path(__file__).parent / "outputs" / "metrics"
OUT.mkdir(parents=True, exist_ok=True)

with open(OUT / "ci_results.json", "w") as f:
    json.dump(ci_results, f, indent=2)
with open(OUT / "mcnemar_results.json", "w") as f:
    json.dump(mcnemar_results, f, indent=2)

print(f"\nSaved to {OUT}")
print("Done.")
