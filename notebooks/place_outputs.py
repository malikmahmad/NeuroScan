import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent

CLASSIFICATION_FILES = [
    "outputs/weights/cnn_best.pth",
    "outputs/weights/efficientnet_best.pth",
    "outputs/weights/vit_best.pth",
    "outputs/metrics/cnn_test_results.json",
    "outputs/metrics/efficientnet_test_results.json",
    "outputs/metrics/vit_test_results.json",
    "outputs/metrics/cnn_history.json",
    "outputs/metrics/efficientnet_history.json",
    "outputs/metrics/vit_history.json",
    "outputs/metrics/model_comparison.csv",
]

SEGMENTATION_FILES = [
    "outputs_segmentation/weights/unet_best.pth",
    "outputs_segmentation/metrics/segmentation_test_results.json",
    "outputs_segmentation/metrics/segmentation_history.json",
]

print("\nNeuroScan — output file check\n")

missing = []
for rel in CLASSIFICATION_FILES + SEGMENTATION_FILES:
    path = ROOT / rel
    ok = path.exists()
    print(f"  {'ok' if ok else 'MISSING':8}  {rel}")
    if not ok:
        missing.append(rel)

print()

if missing:
    print(f"Missing {len(missing)} file(s). Download the full outputs/ folders from Kaggle.")
    print("See README.md for step-by-step instructions.")
else:
    print("All files present.")
    models_dir = ROOT.parent / "backend" / "models"
    weight_sources = [
        ROOT / "outputs" / "weights" / "cnn_best.pth",
        ROOT / "outputs" / "weights" / "efficientnet_best.pth",
        ROOT / "outputs" / "weights" / "vit_best.pth",
        ROOT / "outputs_segmentation" / "weights" / "unet_best.pth",
    ]
    for src in weight_sources:
        dst = models_dir / src.name
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)
            print(f"  Copied {src.name} -> backend/models/")
        elif dst.exists():
            print(f"  {src.name} already in backend/models/")
