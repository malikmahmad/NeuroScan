# %% [markdown]
# # Brain Tumor MRI Classification — Comparative Deep Learning Study
#
# Trains and fairly compares three architecture families on the same
# train/val/test splits:
#   1. Custom CNN (trained from scratch)        -> local-feature baseline
#   2. EfficientNet-B0 (ImageNet transfer learn) -> efficient CNN baseline
#   3. ViT-B/16 (ImageNet transfer learn)         -> global self-attention
#
# Dataset: "Brain Tumor MRI Dataset" by Masoud Nickparvar (Kaggle)
# https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset
# Classes: glioma, meningioma, notumor, pituitary
#
# HOW TO RUN
# -----------
# Option A (recommended) — Kaggle Notebooks:
#   1. Create a new Kaggle Notebook, enable GPU (Settings -> Accelerator -> GPU T4 x2).
#   2. "Add Data" -> search "Brain Tumor MRI Dataset" (masoudnickparvar) -> Add.
#   3. Upload this file or paste its cells, run top to bottom.
#   4. Dataset will be auto-detected at /kaggle/input/brain-tumor-mri-dataset
#
# Option B — Google Colab:
#   1. Runtime -> Change runtime type -> GPU.
#   2. Upload your kaggle.json (API token) and run:
#        !pip install kaggle -q
#        !mkdir -p ~/.kaggle && cp kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json
#        !kaggle datasets download -d masoudnickparvar/brain-tumor-mri-dataset -p data --unzip
#   3. Set DATA_ROOT below to "data".
#
# Option C — Local machine with a GPU:
#   Download the dataset manually from the Kaggle link above, unzip it,
#   and point DATA_ROOT at the folder containing Training/ and Testing/.
#
# This file uses "# %%" cell markers (Jupytext / VS Code / Colab compatible).
# To convert to a real .ipynb:  pip install jupytext && jupytext --to notebook train_classification.py

# %%
import os
import json
import time
import copy
import random
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_fscore_support, accuracy_score
)
import matplotlib.pyplot as plt
import seaborn as sns

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

# %%
# ---------------------------------------------------------------------------
# 1. CONFIG — adjust DATA_ROOT for your environment
# ---------------------------------------------------------------------------
KAGGLE_PATH = "/kaggle/input/brain-tumor-mri-dataset"
DATA_ROOT = KAGGLE_PATH if os.path.exists(KAGGLE_PATH) else "data"

TRAIN_DIR = os.path.join(DATA_ROOT, "Training")
TEST_DIR = os.path.join(DATA_ROOT, "Testing")

IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15
LR = 1e-4
VAL_SPLIT = 0.15  # carved out of the Training set; Testing set stays fully held-out
OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)
(Path(OUTPUT_DIR) / "weights").mkdir(exist_ok=True)
(Path(OUTPUT_DIR) / "figures").mkdir(exist_ok=True)
(Path(OUTPUT_DIR) / "metrics").mkdir(exist_ok=True)

assert os.path.exists(TRAIN_DIR), (
    f"Training folder not found at {TRAIN_DIR}. "
    "Set DATA_ROOT correctly for your environment (see header comment)."
)

# %%
# ---------------------------------------------------------------------------
# 2. DATA — transforms, splits, loaders
#    Same preprocessing/augmentation used for ALL three models -> fair comparison
# ---------------------------------------------------------------------------
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=10),
    transforms.ColorJitter(brightness=0.15, contrast=0.15),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

eval_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])

full_train_ds = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
CLASS_NAMES = full_train_ds.classes
print("Classes:", CLASS_NAMES)

n_val = int(len(full_train_ds) * VAL_SPLIT)
n_train = len(full_train_ds) - n_val
train_ds, val_ds_raw = torch.utils.data.random_split(
    full_train_ds, [n_train, n_val],
    generator=torch.Generator().manual_seed(SEED)
)
# validation should NOT use train-time augmentation -> rebuild with eval_transform
val_ds_eval = datasets.ImageFolder(TRAIN_DIR, transform=eval_transform)
val_ds = torch.utils.data.Subset(val_ds_eval, val_ds_raw.indices)

test_ds = datasets.ImageFolder(TEST_DIR, transform=eval_transform)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

print(f"Train: {len(train_ds)}  Val: {len(val_ds)}  Test: {len(test_ds)}")

# %%
# ---------------------------------------------------------------------------
# 3. CLASS DISTRIBUTION CHECK (goes straight into the paper's EDA section)
# ---------------------------------------------------------------------------
counts = {c: 0 for c in CLASS_NAMES}
for _, label in full_train_ds.samples:
    counts[CLASS_NAMES[label]] += 1

plt.figure(figsize=(6, 4))
plt.bar(counts.keys(), counts.values(), color="#4C72B0")
plt.title("Training Set Class Distribution")
plt.ylabel("Number of images")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "figures" / "class_distribution.png", dpi=150)
plt.show()
print(counts)

# %%
# ---------------------------------------------------------------------------
# 4. MODEL DEFINITIONS
# ---------------------------------------------------------------------------
NUM_CLASSES = len(CLASS_NAMES)


def build_custom_cnn(num_classes=NUM_CLASSES):
    """Lightweight CNN trained from scratch — local-feature baseline."""
    return nn.Sequential(
        nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(), nn.MaxPool2d(2),
        nn.AdaptiveAvgPool2d((1, 1)),
        nn.Flatten(),
        nn.Dropout(0.3),
        nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.3),
        nn.Linear(128, num_classes),
    )


def build_efficientnet(num_classes=NUM_CLASSES):
    """EfficientNet-B0, ImageNet-pretrained, fine-tuned classifier head + last blocks."""
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    for param in model.features.parameters():
        param.requires_grad = False
    # unfreeze last two feature blocks for fine-tuning
    for param in model.features[-2:].parameters():
        param.requires_grad = True
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def build_vit(num_classes=NUM_CLASSES):
    """ViT-B/16, ImageNet-pretrained, fine-tuned head + last encoder block."""
    model = models.vit_b_16(weights=models.ViT_B_16_Weights.IMAGENET1K_V1)
    for param in model.parameters():
        param.requires_grad = False
    for param in model.encoder.layers[-1].parameters():
        param.requires_grad = True
    in_features = model.heads.head.in_features
    model.heads.head = nn.Linear(in_features, num_classes)
    return model


MODEL_BUILDERS = {
    "cnn": build_custom_cnn,
    "efficientnet": build_efficientnet,
    "vit": build_vit,
}

# %%
# ---------------------------------------------------------------------------
# 5. TRAIN / EVAL LOOPS (identical for every model -> fair comparison)
# ---------------------------------------------------------------------------

def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()

    total_loss, all_preds, all_labels = 0.0, [], []
    with torch.set_grad_enabled(is_train):
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)

            if is_train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(loader.dataset)
    acc = accuracy_score(all_labels, all_preds)
    return avg_loss, acc


def train_model(model, name, epochs=EPOCHS, lr=LR):
    model = model.to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_val_acc = 0.0
    best_state = None

    print(f"\n{'='*60}\nTraining: {name}\n{'='*60}")
    for epoch in range(epochs):
        t0 = time.time()
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, optimizer=None)
        scheduler.step(val_loss)

        history["train_loss"].append(tr_loss)
        history["train_acc"].append(tr_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = copy.deepcopy(model.state_dict())

        dt = time.time() - t0
        print(f"Epoch {epoch+1}/{epochs} ({dt:.0f}s) | "
              f"train_loss={tr_loss:.4f} train_acc={tr_acc:.4f} | "
              f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}")

    model.load_state_dict(best_state)
    torch.save(best_state, OUTPUT_DIR / "weights" / f"{name}_best.pth")
    with open(OUTPUT_DIR / "metrics" / f"{name}_history.json", "w") as f:
        json.dump(history, f, indent=2)

    return model, history


@torch.no_grad()
def evaluate_on_test(model, name):
    model.eval()
    all_preds, all_labels, all_probs = [], [], []
    for images, labels in test_loader:
        images = images.to(DEVICE)
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)
        preds = probs.argmax(dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())
        all_probs.extend(probs.cpu().numpy())

    all_preds, all_labels, all_probs = map(np.array, (all_preds, all_labels, all_probs))

    report = classification_report(all_labels, all_preds, target_names=CLASS_NAMES, output_dict=True)
    cm = confusion_matrix(all_labels, all_preds)
    try:
        auc = roc_auc_score(all_labels, all_probs, multi_class="ovr")
    except ValueError:
        auc = None

    # Confusion matrix figure
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES)
    plt.title(f"Confusion Matrix — {name}")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "figures" / f"{name}_confusion_matrix.png", dpi=150)
    plt.show()

    result = {
        "test_accuracy": accuracy_score(all_labels, all_preds),
        "macro_f1": report["macro avg"]["f1-score"],
        "weighted_f1": report["weighted avg"]["f1-score"],
        "roc_auc_ovr": auc,
        "per_class": {c: report[c] for c in CLASS_NAMES},
        "confusion_matrix": cm.tolist(),
    }
    with open(OUTPUT_DIR / "metrics" / f"{name}_test_results.json", "w") as f:
        json.dump(result, f, indent=2)

    print(f"\n[{name}] Test accuracy: {result['test_accuracy']:.4f} | "
          f"Macro F1: {result['macro_f1']:.4f} | ROC-AUC (OvR): {auc}")
    print(classification_report(all_labels, all_preds, target_names=CLASS_NAMES))
    return result

# %%
# ---------------------------------------------------------------------------
# 6. RUN ALL THREE MODELS
# ---------------------------------------------------------------------------
all_results = {}
trained_models = {}

for model_name, builder in MODEL_BUILDERS.items():
    model = builder()
    trained_model, history = train_model(model, model_name)
    test_results = evaluate_on_test(trained_model, model_name)
    trained_models[model_name] = trained_model
    all_results[model_name] = test_results

# %%
# ---------------------------------------------------------------------------
# 7. SIDE-BY-SIDE COMPARISON TABLE  (drop straight into the paper's Results section)
# ---------------------------------------------------------------------------
import pandas as pd

comparison = pd.DataFrame({
    name: {
        "Test Accuracy": res["test_accuracy"],
        "Macro F1": res["macro_f1"],
        "Weighted F1": res["weighted_f1"],
        "ROC-AUC (OvR)": res["roc_auc_ovr"],
    }
    for name, res in all_results.items()
}).T.round(4)

print(comparison)
comparison.to_csv(OUTPUT_DIR / "metrics" / "model_comparison.csv")

plt.figure(figsize=(7, 4))
comparison["Test Accuracy"].plot(kind="bar", color=["#4C72B0", "#DD8452", "#55A868"])
plt.title("Test Accuracy by Architecture")
plt.ylabel("Accuracy")
plt.ylim(0, 1)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "figures" / "model_comparison_accuracy.png", dpi=150)
plt.show()

# %% [markdown]
# Continue to `gradcam_and_attention.py` for explainability visuals (Grad-CAM
# for CNN/EfficientNet, attention-rollout maps for ViT), then
# `train_segmentation.py` for tumor localization.
#
# After this finishes, copy `outputs/weights/*_best.pth` into
# `backend/models/` so the FastAPI service can load real, verified weights.
