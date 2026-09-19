"""
generate_figures.py — NeuroScan
Generates all research figures from saved metrics and prediction arrays.
Run from repo root:
    .\\backend\\venv311\\Scripts\\python.exe notebooks\\generate_figures.py
"""

import json
import sys
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import confusion_matrix, f1_score

matplotlib.use("Agg")

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent
METRICS_DIR = ROOT / "outputs" / "metrics"
STATS_DIR = METRICS_DIR / "stats"
FIG_DIR = ROOT / "outputs" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_LABELS = ["Glioma", "Meningioma", "No Tumor", "Pituitary"]

MODEL_ORDER = ["cnn", "efficientnet", "densenet121", "mobilenetv3", "swin_t", "vit", "resnet50"]
MODEL_LABELS = {
    "cnn": "CNN",
    "efficientnet": "EfficientNet-B0",
    "densenet121": "DenseNet-121",
    "mobilenetv3": "MobileNetV3",
    "swin_t": "Swin-T",
    "vit": "ViT-B/16",
    "resnet50": "ResNet-50",
}
COLORS = {
    "cnn": "#4facfe",
    "efficientnet": "#00d4ff",
    "densenet121": "#fbbf24",
    "mobilenetv3": "#c084fc",
    "swin_t": "#a78bfa",
    "vit": "#f472b6",
    "resnet50": "#34d399",
}

# ── Load test results ──────────────────────────────────────────────────────────
results = {}
for m in MODEL_ORDER:
    f = METRICS_DIR / f"{m}_test_results.json"
    if f.exists():
        with open(f) as fh:
            results[m] = json.load(fh)

print(f"Loaded results for: {list(results.keys())}")

# ── Load prediction arrays (for confusion matrices + per-class F1) ────────────
preds = {}
labels_true = None

npy_labels = STATS_DIR / "labels_true.npy"
if npy_labels.exists():
    labels_true = np.load(npy_labels)
    print(f"Loaded labels_true: {len(labels_true)} samples")

for m in MODEL_ORDER:
    npy_f = STATS_DIR / f"preds_{m}.npy"
    if npy_f.exists():
        preds[m] = np.load(npy_f)

print(f"Loaded prediction arrays for: {list(preds.keys())}")


# ═══════════════════════════════════════════════════════════════════════════════
# FIGURE 1 — Model accuracy comparison bar chart
# ═══════════════════════════════════════════════════════════════════════════════
def plot_accuracy_comparison():
    models_avail = [m for m in MODEL_ORDER if m in results]
    accs = [results[m]["test_accuracy"] * 100 for m in models_avail]
    colors = [COLORS[m] for m in models_avail]
    labels = [MODEL_LABELS[m] for m in models_avail]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(labels, accs, color=colors, width=0.6, edgecolor="white", linewidth=0.8)

    # Annotate bars
    for bar, acc in zip(bars, accs):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.3,
            f"{acc:.2f}%",
            ha="center",
            va="bottom",
            fontsize=9,
            fontweight="bold",
        )

    ax.set_ylim(70, 100)
    ax.set_ylabel("Test Accuracy (%)", fontsize=12)
    ax.set_title("Classification Accuracy — Held-Out Test Set (1,600 images)", fontsize=13, pad=12)
    ax.axhline(y=90, color="gray", linestyle="--", linewidth=0.7, alpha=0.6, label="90% reference")
    ax.tick_params(axis="x", labelsize=10)
    ax.tick_params(axis="y", labelsize=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    plt.tight_layout()

    out = FIG_DIR / "model_comparison_accuracy.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# FIGURE 2 — Confusion matrices for all 7 models
# ═══════════════════════════════════════════════════════════════════════════════
def plot_confusion_matrices():
    if labels_true is None or not preds:
        print("SKIP confusion matrices — no .npy files found")
        return

    for m in MODEL_ORDER:
        if m not in preds:
            print(f"  SKIP {m} — no preds_{m}.npy")
            continue

        out = FIG_DIR / f"{m}_confusion_matrix.png"
        if out.exists():
            # Only regenerate if we don't have it yet (to avoid overwriting Kaggle-generated ones)
            pass

        from sklearn.metrics import confusion_matrix

        cm = confusion_matrix(labels_true, preds[m])
        acc = np.mean(preds[m] == labels_true) * 100

        fig, ax = plt.subplots(figsize=(6, 5))
        im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
        plt.colorbar(im, ax=ax)
        tick_marks = np.arange(len(CLASS_LABELS))
        ax.set_xticks(tick_marks)
        ax.set_xticklabels(CLASS_LABELS, fontsize=10, rotation=15)
        ax.set_yticks(tick_marks)
        ax.set_yticklabels(CLASS_LABELS, fontsize=10)
        thresh = cm.max() / 2.0
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "black", fontsize=11)
        ax.set_title(f"{MODEL_LABELS[m]} — Confusion Matrix\nTest Accuracy: {acc:.2f}%", fontsize=12)
        ax.set_xlabel("Predicted", fontsize=11)
        ax.set_ylabel("True", fontsize=11)
        plt.tight_layout()
        plt.savefig(out, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"Saved: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# FIGURE 3 — Training curves (loss + accuracy) for all 7 models
# ═══════════════════════════════════════════════════════════════════════════════
def plot_training_curves():
    fig, axes = plt.subplots(2, 1, figsize=(12, 8))

    for m in MODEL_ORDER:
        hist_f = METRICS_DIR / f"{m}_history.json"
        if not hist_f.exists():
            continue
        with open(hist_f) as fh:
            h = json.load(fh)

        label = MODEL_LABELS[m]
        color = COLORS[m]
        lw = 2.5 if m == "resnet50" else 1.5
        epochs = range(1, len(h["val_acc"]) + 1)

        axes[0].plot(epochs, [v * 100 for v in h["val_acc"]], label=label, color=color, linewidth=lw)
        axes[1].plot(epochs, h["val_loss"], label=label, color=color, linewidth=lw)

    axes[0].set_ylabel("Validation Accuracy (%)", fontsize=11)
    axes[0].set_title("Training History — Validation Accuracy", fontsize=12)
    axes[0].legend(fontsize=9, loc="lower right", ncol=2)
    axes[0].set_ylim(60, 100)
    axes[0].axhline(y=95.44, color=COLORS["resnet50"], linestyle=":", linewidth=1.0, alpha=0.7)
    axes[0].spines["top"].set_visible(False)
    axes[0].spines["right"].set_visible(False)

    axes[1].set_ylabel("Validation Loss", fontsize=11)
    axes[1].set_xlabel("Epoch", fontsize=11)
    axes[1].set_title("Training History — Validation Loss", fontsize=12)
    axes[1].legend(fontsize=9, loc="upper right", ncol=2)
    axes[1].spines["top"].set_visible(False)
    axes[1].spines["right"].set_visible(False)

    plt.tight_layout()
    out = FIG_DIR / "training_curves_all_models.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# FIGURE 4 — Per-class F1 heatmap (all 7 models × 4 classes)
# ═══════════════════════════════════════════════════════════════════════════════
def plot_per_class_f1():
    if labels_true is None or not preds:
        print("SKIP per-class F1 — no .npy files found")
        return

    from sklearn.metrics import f1_score

    f1_matrix = []
    row_labels = []

    for m in MODEL_ORDER:
        if m not in preds:
            continue
        f1_per_class = f1_score(labels_true, preds[m], average=None, labels=[0, 1, 2, 3])
        f1_matrix.append(f1_per_class)
        row_labels.append(MODEL_LABELS[m])

    f1_matrix = np.array(f1_matrix)

    fig, ax = plt.subplots(figsize=(8, 5))
    im = ax.imshow(f1_matrix, cmap="YlGn", vmin=0.7, vmax=1.0, aspect="auto")

    ax.set_xticks(range(4))
    ax.set_xticklabels(CLASS_LABELS, fontsize=11)
    ax.set_yticks(range(len(row_labels)))
    ax.set_yticklabels(row_labels, fontsize=11)

    for i in range(len(row_labels)):
        for j in range(4):
            val = f1_matrix[i, j]
            text_color = "black" if val > 0.85 else "white"
            ax.text(j, i, f"{val:.3f}", ha="center", va="center", fontsize=10, color=text_color)

    plt.colorbar(im, ax=ax, label="F1-Score", shrink=0.8)
    ax.set_title("Per-Class F1-Score — All 7 Models (Held-Out Test Set)", fontsize=12, pad=10)
    plt.tight_layout()

    out = FIG_DIR / "per_class_f1_heatmap.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out}")

    # Also save per-class F1 to JSON for paper accuracy
    per_class_data = {}
    for i, m in enumerate([m for m in MODEL_ORDER if m in preds]):
        per_class_data[m] = {
            CLASS_NAMES[j]: round(float(f1_matrix[i, j]), 4) for j in range(4)
        }
    out_json = METRICS_DIR / "per_class_f1.json"
    with open(out_json, "w") as fh:
        json.dump(per_class_data, fh, indent=2)
    print(f"Saved: {out_json}")
    return per_class_data


# ═══════════════════════════════════════════════════════════════════════════════
# FIGURE 5 — Macro F1 + ROC-AUC grouped bar chart
# ═══════════════════════════════════════════════════════════════════════════════
def plot_metrics_comparison():
    models_avail = [m for m in MODEL_ORDER if m in results]
    labels = [MODEL_LABELS[m] for m in models_avail]
    f1_vals = [results[m]["macro_f1"] for m in models_avail]
    auc_vals = [results[m]["roc_auc_ovr"] for m in models_avail]

    x = np.arange(len(labels))
    width = 0.35

    fig, ax = plt.subplots(figsize=(11, 5))
    bars1 = ax.bar(x - width / 2, f1_vals, width, label="Macro F1", color="#4facfe", alpha=0.85)
    bars2 = ax.bar(x + width / 2, auc_vals, width, label="ROC-AUC (OvR)", color="#34d399", alpha=0.85)

    ax.set_ylim(0.7, 1.02)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=10)
    ax.set_ylabel("Score", fontsize=11)
    ax.set_title("Macro F1 and ROC-AUC — All 7 Models (Held-Out Test Set)", fontsize=12)
    ax.legend(fontsize=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    for bar in [*bars1, *bars2]:
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.003,
            f"{bar.get_height():.3f}",
            ha="center",
            va="bottom",
            fontsize=8,
        )

    plt.tight_layout()
    out = FIG_DIR / "metrics_comparison_f1_auc.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {out}")


# ═══════════════════════════════════════════════════════════════════════════════
# Run all
# ═══════════════════════════════════════════════════════════════════════════════
print("\n=== Generating research figures ===\n")

plot_accuracy_comparison()
plot_confusion_matrices()
plot_training_curves()
per_class_data = plot_per_class_f1()
plot_metrics_comparison()

print("\n=== Per-class F1 (ResNet-50) ===")
if per_class_data and "resnet50" in per_class_data:
    for cls, f1 in per_class_data["resnet50"].items():
        print(f"  {cls}: {f1:.4f}")

print("\nDone. All figures in:", FIG_DIR)
