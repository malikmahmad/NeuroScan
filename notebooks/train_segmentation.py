import os
import glob
import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, random_split
import torchvision.transforms.functional as TF
from PIL import Image
import matplotlib.pyplot as plt

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SEED   = 42
torch.manual_seed(SEED)
np.random.seed(SEED)

KAGGLE_PATH = "/kaggle/input/lgg-mri-segmentation/kaggle_3m"
DATA_ROOT   = KAGGLE_PATH if os.path.exists(KAGGLE_PATH) else "data/lgg-mri-segmentation"

IMAGE_SIZE = 256
BATCH_SIZE = 16
EPOCHS     = 25
LR         = 1e-4

OUTPUT_DIR = Path("outputs_segmentation")
for sub in ["weights", "figures", "metrics"]:
    (OUTPUT_DIR / sub).mkdir(parents=True, exist_ok=True)

assert os.path.exists(DATA_ROOT), f"Dataset not found at {DATA_ROOT}"

# -----------------------------------------------------------------------
# Build (image, mask) pairs
# -----------------------------------------------------------------------
all_images = sorted(glob.glob(os.path.join(DATA_ROOT, "*", "*.tif")))
image_mask_pairs = [
    (p, p.replace(".tif", "_mask.tif"))
    for p in all_images
    if "_mask" not in p and os.path.exists(p.replace(".tif", "_mask.tif"))
]
print(f"Slice pairs: {len(image_mask_pairs)}")

positive, negative = 0, 0
for _, mask_path in image_mask_pairs:
    if np.array(Image.open(mask_path)).max() > 0:
        positive += 1
    else:
        negative += 1
print(f"Tumor-positive: {positive}  Tumor-negative: {negative}")

# -----------------------------------------------------------------------
# Dataset
# -----------------------------------------------------------------------
class BrainMRISegDataset(Dataset):
    def __init__(self, pairs, image_size=IMAGE_SIZE, augment=False):
        self.pairs      = pairs
        self.image_size = image_size
        self.augment    = augment

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        img_path, mask_path = self.pairs[idx]
        image = Image.open(img_path).convert("RGB").resize((self.image_size, self.image_size))
        mask  = Image.open(mask_path).convert("L").resize((self.image_size, self.image_size))

        if self.augment and np.random.rand() > 0.5:
            image, mask = TF.hflip(image), TF.hflip(mask)
        if self.augment and np.random.rand() > 0.5:
            angle = np.random.uniform(-10, 10)
            image, mask = TF.rotate(image, angle), TF.rotate(mask, angle)

        image_t = TF.normalize(TF.to_tensor(image), [0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        mask_t  = (TF.to_tensor(mask) > 0.5).float()
        return image_t, mask_t


full_ds = BrainMRISegDataset(image_mask_pairs, augment=True)
n_total = len(full_ds)
n_val   = int(n_total * 0.15)
n_test  = int(n_total * 0.15)
n_train = n_total - n_val - n_test

train_ds, val_ds, test_ds = random_split(
    full_ds, [n_train, n_val, n_test],
    generator=torch.Generator().manual_seed(SEED)
)

val_ds.dataset  = BrainMRISegDataset(image_mask_pairs, augment=False)
test_ds.dataset = BrainMRISegDataset(image_mask_pairs, augment=False)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
print(f"Train: {n_train}  Val: {n_val}  Test: {n_test}")

# -----------------------------------------------------------------------
# U-Net
# -----------------------------------------------------------------------
class DoubleConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1), nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1), nn.BatchNorm2d(out_ch), nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class UNet(nn.Module):
    def __init__(self, in_channels=3, out_channels=1, base=32):
        super().__init__()
        self.enc1 = DoubleConv(in_channels, base)
        self.enc2 = DoubleConv(base,        base * 2)
        self.enc3 = DoubleConv(base * 2,    base * 4)
        self.enc4 = DoubleConv(base * 4,    base * 8)
        self.pool = nn.MaxPool2d(2)

        self.bottleneck = DoubleConv(base * 8, base * 16)

        self.up4  = nn.ConvTranspose2d(base * 16, base * 8, 2, stride=2)
        self.dec4 = DoubleConv(base * 16, base * 8)
        self.up3  = nn.ConvTranspose2d(base * 8,  base * 4, 2, stride=2)
        self.dec3 = DoubleConv(base * 8,  base * 4)
        self.up2  = nn.ConvTranspose2d(base * 4,  base * 2, 2, stride=2)
        self.dec2 = DoubleConv(base * 4,  base * 2)
        self.up1  = nn.ConvTranspose2d(base * 2,  base,     2, stride=2)
        self.dec1 = DoubleConv(base * 2,  base)

        self.out_conv = nn.Conv2d(base, out_channels, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        b  = self.bottleneck(self.pool(e4))

        d4 = self.dec4(torch.cat([self.up4(b),  e4], dim=1))
        d3 = self.dec3(torch.cat([self.up3(d4), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.out_conv(d1)

# -----------------------------------------------------------------------
# Loss and metrics
# -----------------------------------------------------------------------
def dice_coefficient(pred, target, smooth=1e-6):
    pred = (torch.sigmoid(pred) > 0.5).float()
    inter = (pred * target).sum(dim=(1, 2, 3))
    union = pred.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3))
    return ((2 * inter + smooth) / (union + smooth)).mean().item()


def iou_score(pred, target, smooth=1e-6):
    pred  = (torch.sigmoid(pred) > 0.5).float()
    inter = (pred * target).sum(dim=(1, 2, 3))
    union = pred.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3)) - inter
    return ((inter + smooth) / (union + smooth)).mean().item()


class DiceBCELoss(nn.Module):
    def __init__(self):
        super().__init__()
        self.bce = nn.BCEWithLogitsLoss()

    def forward(self, pred, target, smooth=1e-6):
        bce_loss  = self.bce(pred, target)
        pred_sig  = torch.sigmoid(pred)
        inter     = (pred_sig * target).sum(dim=(1, 2, 3))
        union     = pred_sig.sum(dim=(1, 2, 3)) + target.sum(dim=(1, 2, 3))
        dice_loss = 1 - ((2 * inter + smooth) / (union + smooth)).mean()
        return bce_loss + dice_loss

# -----------------------------------------------------------------------
# Training
# -----------------------------------------------------------------------
model     = UNet().to(DEVICE)
criterion = DiceBCELoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=LR)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=3)

history   = {"train_loss": [], "val_dice": [], "val_iou": []}
best_dice = 0.0

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0.0
    for images, masks in train_loader:
        images, masks = images.to(DEVICE), masks.to(DEVICE)
        optimizer.zero_grad()
        loss = criterion(model(images), masks)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)

    train_loss = total_loss / n_train

    model.eval()
    dice_scores, iou_scores = [], []
    with torch.no_grad():
        for images, masks in val_loader:
            images, masks = images.to(DEVICE), masks.to(DEVICE)
            preds = model(images)
            dice_scores.append(dice_coefficient(preds, masks))
            iou_scores.append(iou_score(preds, masks))

    val_dice = float(np.mean(dice_scores))
    val_iou  = float(np.mean(iou_scores))
    scheduler.step(val_dice)

    history["train_loss"].append(train_loss)
    history["val_dice"].append(val_dice)
    history["val_iou"].append(val_iou)

    if val_dice > best_dice:
        best_dice = val_dice
        torch.save(model.state_dict(), OUTPUT_DIR / "weights" / "unet_best.pth")

    print(f"Epoch {epoch+1}/{EPOCHS} | loss={train_loss:.4f} | dice={val_dice:.4f} | iou={val_iou:.4f}")

with open(OUTPUT_DIR / "metrics" / "segmentation_history.json", "w") as f:
    json.dump(history, f, indent=2)

# -----------------------------------------------------------------------
# Test evaluation
# -----------------------------------------------------------------------
model.load_state_dict(torch.load(OUTPUT_DIR / "weights" / "unet_best.pth"))
model.eval()

test_dice_scores, test_iou_scores = [], []
with torch.no_grad():
    for images, masks in test_loader:
        images, masks = images.to(DEVICE), masks.to(DEVICE)
        preds = model(images)
        test_dice_scores.append(dice_coefficient(preds, masks))
        test_iou_scores.append(iou_score(preds, masks))

results = {
    "test_dice": float(np.mean(test_dice_scores)),
    "test_iou":  float(np.mean(test_iou_scores)),
}
print(f"\nTest — Dice: {results['test_dice']:.4f}  IoU: {results['test_iou']:.4f}")

with open(OUTPUT_DIR / "metrics" / "segmentation_test_results.json", "w") as f:
    json.dump(results, f, indent=2)

# -----------------------------------------------------------------------
# Qualitative figure
# -----------------------------------------------------------------------
def visualize_predictions(n=4):
    model.eval()
    images, masks = next(iter(test_loader))
    images, masks = images[:n].to(DEVICE), masks[:n].to(DEVICE)
    with torch.no_grad():
        preds = torch.sigmoid(model(images)) > 0.5

    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1).to(DEVICE)
    std  = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1).to(DEVICE)

    fig, axes = plt.subplots(n, 3, figsize=(9, 3 * n))
    for i in range(n):
        img = (images[i] * std + mean).clamp(0, 1).permute(1, 2, 0).cpu().numpy()

        axes[i, 0].imshow(img);                                    axes[i, 0].set_title("MRI Slice");        axes[i, 0].axis("off")
        axes[i, 1].imshow(masks[i, 0].cpu().numpy(), cmap="gray"); axes[i, 1].set_title("Ground Truth");    axes[i, 1].axis("off")
        axes[i, 2].imshow(img)
        axes[i, 2].imshow(preds[i, 0].cpu().numpy(), cmap="Reds", alpha=0.5)
        axes[i, 2].set_title("Predicted Overlay"); axes[i, 2].axis("off")

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "figures" / "segmentation_qualitative.png", dpi=150)
    plt.show()


visualize_predictions()
