"""
Download model weights from Hugging Face at startup.
Runs only if .pth files are missing.
"""
import os
from pathlib import Path

REPO_ID = "priv-ahmad/neuroscan-weights"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

WEIGHTS = [
    "cnn_best.pth",
    "efficientnet_best.pth",
    "unet_best.pth",
    "vit_best.pth",
]


def download_weights():
    missing = [w for w in WEIGHTS if not (MODELS_DIR / w).exists()]
    if not missing:
        print("All model weights already present.")
        return

    print(f"Downloading {len(missing)} weight file(s) from {REPO_ID}...")
    try:
        from huggingface_hub import hf_hub_download
        for filename in missing:
            print(f"  Downloading {filename}...")
            path = hf_hub_download(
                repo_id=REPO_ID,
                filename=filename,
                local_dir=str(MODELS_DIR),
            )
            print(f"  Saved to {path}")
    except Exception as e:
        print(f"ERROR downloading weights: {e}")
        raise


if __name__ == "__main__":
    download_weights()
