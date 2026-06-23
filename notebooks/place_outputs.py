"""
place_outputs.py — Run this after downloading Kaggle outputs.

After training on Kaggle:
  1. Download the entire "outputs" folder from the Classification notebook
  2. Download the entire "outputs_segmentation" folder from the Segmentation notebook
  3. Place both folders inside  brain-tumor-ai-pro/notebooks/
  4. Run:  python notebooks/place_outputs.py

This script verifies all expected files are present and prints a summary.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

expected_classification = [
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

expected_segmentation = [
    "outputs_segmentation/weights/unet_best.pth",
    "outputs_segmentation/metrics/segmentation_test_results.json",
    "outputs_segmentation/metrics/segmentation_history.json",
]

print("\n=== NeuroScan — Output File Checker ===\n")

all_ok = True
for rel in expected_classification + expected_segmentation:
    path = ROOT / rel
    status = "✅" if path.exists() else "❌ MISSING"
    if not path.exists():
        all_ok = False
    print(f"  {status}  {rel}")

print()
if all_ok:
    print("✅ All files present. Metrics dashboard will show full results.")
    print("   Copy weights to backend/models/ if not done already:")
    weights = ["cnn_best.pth", "efficientnet_best.pth", "vit_best.pth", "unet_best.pth"]
    for w in weights:
        src_cls = ROOT / "outputs" / "weights" / w
        src_seg = ROOT / "outputs_segmentation" / "weights" / w
        src = src_cls if src_cls.exists() else src_seg if src_seg.exists() else None
        dst = ROOT.parent / "backend" / "models" / w
        if src and not dst.exists():
            import shutil
            shutil.copy2(src, dst)
            print(f"   Copied {w} → backend/models/")
        elif dst.exists():
            print(f"   {w} already in backend/models/ ✅")
else:
    print("❌ Some files missing. Make sure you downloaded the full outputs/ folder from Kaggle.")
    print("   See README.md Step 1 for instructions.")
