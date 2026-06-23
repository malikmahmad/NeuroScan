const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type ModelName = "cnn" | "efficientnet" | "vit";

export interface ModelsStatus {
  cnn: boolean;
  efficientnet: boolean;
  vit: boolean;
  unet_segmentation: boolean;
}

export interface ClassifyResult {
  model: ModelName;
  predicted_class: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  explainability_method: "Grad-CAM" | "Attention Rollout";
  explainability_overlay_png_base64?: string;
}

export interface CompareResult {
  per_model: Record<string, ClassifyResult>;
  ensemble: {
    predicted_class: string;
    confidence: number;
    class_probabilities: Record<string, number>;
  };
}

export interface SegmentResult {
  tumor_detected: boolean;
  tumor_area_ratio: number;
  mask_png_base64: string;
  overlay_png_base64: string;
}

export interface SegmentNote {
  note: string;
}

export interface AnalyzeResult {
  classification: ClassifyResult;
  segmentation?: SegmentResult | SegmentNote;
}

export interface ModelTestResult {
  test_accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  roc_auc_ovr: number | null;
  per_class: Record<string, { precision: number; recall: number; "f1-score": number; support: number }>;
  confusion_matrix: number[][];
}

export interface ModelHistory {
  train_loss: number[];
  train_acc: number[];
  val_loss: number[];
  val_acc: number[];
}

export interface ClassificationMetrics {
  available: boolean;
  message?: string;
  models?: Record<string, { test: ModelTestResult | null; history: ModelHistory | null }>;
}

export interface SegmentationMetrics {
  available: boolean;
  message?: string;
  test?: { test_dice: number; test_iou: number };
  history?: { train_loss: number[]; val_dice: number[]; val_iou: number[] };
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON — keep statusText */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export async function getModelsStatus(): Promise<ModelsStatus> {
  return request<ModelsStatus>("/api/models/status", { method: "GET" });
}

export async function getClassificationMetrics(): Promise<ClassificationMetrics> {
  return request<ClassificationMetrics>("/api/metrics/classification", { method: "GET" });
}

export async function getSegmentationMetrics(): Promise<SegmentationMetrics> {
  return request<SegmentationMetrics>("/api/metrics/segmentation", { method: "GET" });
}

export async function classify(file: File, modelName: ModelName): Promise<ClassifyResult> {
  const form = new FormData();
  form.append("file", file);
  return request<ClassifyResult>(`/api/classify?model_name=${modelName}`, {
    method: "POST",
    body: form,
  });
}

export async function classifyCompare(file: File): Promise<CompareResult> {
  const form = new FormData();
  form.append("file", file);
  return request<CompareResult>("/api/classify/compare", { method: "POST", body: form });
}

export async function segment(file: File): Promise<SegmentResult> {
  const form = new FormData();
  form.append("file", file);
  return request<SegmentResult>("/api/segment", { method: "POST", body: form });
}

export async function analyze(file: File, classifier: ModelName): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append("file", file);
  return request<AnalyzeResult>(`/api/analyze?classifier=${classifier}`, {
    method: "POST",
    body: form,
  });
}

export { ApiError };
