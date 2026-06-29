import io
import json
import logging
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from . import inference
from .inference import WeightsNotFoundError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neuroscan")

app = FastAPI(
    title="NeuroScan API",
    description="Brain tumor MRI classification, segmentation, and explainability. Research use only.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

CLASSIFICATION_METRICS_DIR = next(
    (
        p
        for p in [
            _PROJECT_ROOT / "notebooks" / "outputs" / "metrics",
            _PROJECT_ROOT / "outputs" / "metrics",
        ]
        if p.exists()
    ),
    None,
)

SEGMENTATION_METRICS_DIR = next(
    (
        p
        for p in [
            _PROJECT_ROOT / "notebooks" / "outputs_segmentation" / "metrics",
            _PROJECT_ROOT / "outputs_segmentation" / "metrics",
        ]
        if p.exists()
    ),
    None,
)


def _read_image(upload: UploadFile) -> Image.Image:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="Expected an image file (PNG, JPEG, or TIFF)."
        )
    try:
        data = upload.file.read()
        img = Image.open(io.BytesIO(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not open image: {exc}")

    # Basic MRI plausibility: real scans are near-grayscale. High channel variance
    # (>18.0 mean absolute diff) suggests a color photo — reject it.
    rgb = img.convert("RGB")
    arr = np.array(rgb, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    channel_diff = (
        np.abs(r - g).mean() + np.abs(r - b).mean() + np.abs(g - b).mean()
    ) / 3.0
    if channel_diff > 18.0:
        raise HTTPException(
            status_code=422,
            detail=(
                "This does not look like an MRI scan. "
                "Please upload a grayscale brain MRI slice (axial T1/T2/FLAIR)."
            ),
        )

    return img


def _load_json(path: Path) -> dict | None:
    if not path or not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/models/status")
def models_status():
    return inference.registry.status()


@app.get("/api/metrics/classification")
def classification_metrics():
    if not CLASSIFICATION_METRICS_DIR:
        return JSONResponse(
            {
                "available": False,
                "message": (
                    "No metrics found. Run the classification notebook "
                    "and place the outputs/ folder under notebooks/."
                ),
            }
        )
    models = ["cnn", "efficientnet", "vit"]
    data = {}
    for m in models:
        test = _load_json(CLASSIFICATION_METRICS_DIR / f"{m}_test_results.json")
        history = _load_json(CLASSIFICATION_METRICS_DIR / f"{m}_history.json")
        if test or history:
            data[m] = {"test": test, "history": history}
    if not data:
        return JSONResponse(
            {
                "available": False,
                "message": "Metrics folder found but files are missing.",
            }
        )
    return JSONResponse({"available": True, "models": data})


@app.get("/api/metrics/segmentation")
def segmentation_metrics():
    if not SEGMENTATION_METRICS_DIR:
        return JSONResponse(
            {
                "available": False,
                "message": "No segmentation metrics found. Run the segmentation notebook first.",
            }
        )
    test = _load_json(SEGMENTATION_METRICS_DIR / "segmentation_test_results.json")
    history = _load_json(SEGMENTATION_METRICS_DIR / "segmentation_history.json")
    if not test and not history:
        return JSONResponse(
            {
                "available": False,
                "message": "Segmentation metrics folder found but files are missing.",
            }
        )
    return JSONResponse({"available": True, "test": test, "history": history})


@app.post("/api/classify")
def classify_endpoint(
    file: UploadFile = File(...),
    model_name: str = Query("efficientnet", enum=["cnn", "efficientnet", "vit"]),
):
    image = _read_image(file)
    try:
        return JSONResponse(
            inference.classify(image, model_name=model_name, explain=True)
        )
    except WeightsNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/api/classify/compare")
def classify_compare_endpoint(file: UploadFile = File(...)):
    image = _read_image(file)
    try:
        return JSONResponse(inference.classify_ensemble(image))
    except WeightsNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/api/segment")
def segment_endpoint(file: UploadFile = File(...)):
    image = _read_image(file)
    try:
        return JSONResponse(inference.segment(image))
    except WeightsNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/api/analyze")
def analyze_endpoint(
    file: UploadFile = File(...),
    classifier: str = Query("efficientnet", enum=["cnn", "efficientnet", "vit"]),
):
    image = _read_image(file)
    try:
        return JSONResponse(inference.full_analysis(image, classifier=classifier))
    except WeightsNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
