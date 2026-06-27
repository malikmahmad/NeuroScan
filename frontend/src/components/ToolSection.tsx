import { useEffect, useState } from "react";
import {
  getModelsStatus, classifyCompare, analyze, ApiError,
  type ModelsStatus, type ModelName, type ClassifyResult,
  type CompareResult, type SegmentResult, type SegmentNote,
} from "../api";
import { useInView } from "../hooks/useInView";
import ModelStatusBar from "./ModelStatusBar";
import UploadZone from "./UploadZone";
import ResultsPanel from "./ResultsPanel";
import ComparisonView from "./ComparisonView";
import MetricsDashboard from "./MetricsDashboard";

type Mode = "single" | "compare";

export default function ToolSection() {
  const [modelsStatus, setModelsStatus]         = useState<ModelsStatus | null>(null);
  const [statusLoading, setStatusLoading]       = useState(true);
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
  const [mode, setMode]                         = useState<Mode>("single");
  const [selectedModel, setSelectedModel]       = useState<ModelName>("efficientnet");
  const [imageUrl, setImageUrl]                 = useState<string | null>(null);
  const [analyzing, setAnalyzing]               = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const [singleResult, setSingleResult] = useState<{
    classification: ClassifyResult;
    segmentation?: SegmentResult | SegmentNote;
  } | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  const { ref: headerRef, inView: headerVisible } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: panelRef,  inView: panelVisible  } = useInView<HTMLDivElement>({ threshold: 0.05 });

  useEffect(() => {
    getModelsStatus()
      .then((s) => { setModelsStatus(s); setBackendReachable(true); })
      .catch(() => { setBackendReachable(false); setError("Could not reach the backend. Is the API server running on port 8000?"); })
      .finally(() => setStatusLoading(false));
  }, []);

  const handleFile = async (file: File) => {
    setError(null); setSingleResult(null); setCompareResult(null);
    setImageUrl(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      if (mode === "single") setSingleResult(await analyze(file, selectedModel));
      else setCompareResult(await classifyCompare(file));
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) setError(`Model not available: ${e.message}`);
      else if (e instanceof ApiError && e.status === 422) setError(e.message);
      else setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const noModels = modelsStatus !== null && !modelsStatus.cnn && !modelsStatus.efficientnet && !modelsStatus.vit;

  return (
    <section id="tool" className="tool">
      <div
        ref={headerRef}
        className={`tool__header reveal ${headerVisible ? "is-visible" : ""}`}
      >
        <div>
          <span className="section-eyebrow">Try the Tool</span>
          <h2>Upload a scan, get a real prediction</h2>
        </div>
        <div className={`tool__live-badge ${backendReachable ? "tool__live-badge--on" : backendReachable === false ? "tool__live-badge--off" : ""}`}>
          <span className="tool__live-dot" />
          {backendReachable === null ? "Connecting…" : backendReachable ? "API connected" : "API offline"}
        </div>
      </div>

      <div
        ref={panelRef}
        className={`tool__panel reveal ${panelVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: "0.1s" }}
      >
        <ModelStatusBar status={modelsStatus} loading={statusLoading} />

        {noModels && (
          <div className="banner banner--warn fade-in-up">
            No model weights found. Place trained <code>.pth</code> files in{" "}
            <code>backend/models/</code> and restart the API.
          </div>
        )}

        <MetricsDashboard />

        <div className="mode-row">
          <div className="mode-toggle" role="tablist" aria-label="Analysis mode">
            {(["single", "compare"] as Mode[]).map((m) => (
              <button
                key={m} role="tab" aria-selected={mode === m}
                className={`mode-toggle__btn${mode === m ? " mode-toggle__btn--active" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "single" ? "Single model" : "Compare all 3"}
              </button>
            ))}
          </div>
          {mode === "single" && (
            <div className="model-select">
              {(["cnn", "efficientnet", "vit"] as ModelName[]).map((m) => (
                <button
                  key={m}
                  className={`model-select__btn${selectedModel === m ? " model-select__btn--active" : ""}`}
                  onClick={() => setSelectedModel(m)}
                  disabled={modelsStatus ? !modelsStatus[m] : false}
                >
                  {m === "cnn" ? "CNN" : m === "efficientnet" ? "EfficientNet" : "ViT"}
                </button>
              ))}
            </div>
          )}
        </div>

        <UploadZone onFileSelected={handleFile} disabled={analyzing} />

        {error && <div className="banner banner--error fade-in-up">{error}</div>}

        {analyzing && (
          <div className="loading-card fade-in-up">
            <div className="spinner" />
            <div>
              <p className="loading-card__title">Running inference…</p>
              <p className="loading-card__subtitle">
                {mode === "compare"
                  ? "Scoring with all three architectures"
                  : `Scoring with ${selectedModel}`}
              </p>
            </div>
          </div>
        )}

        {!analyzing && mode === "single" && singleResult && imageUrl && (
          <div className="fade-in-up">
            <ResultsPanel
              originalImageUrl={imageUrl}
              result={singleResult.classification}
              segmentation={singleResult.segmentation}
            />
          </div>
        )}
        {!analyzing && mode === "compare" && compareResult && (
          <div className="fade-in-up">
            <ComparisonView result={compareResult} />
          </div>
        )}
      </div>

      <style>{`
        .tool { max-width: 1400px; margin: 0 auto; padding: var(--space-8) var(--space-5); }

        .tool__header {
          display: flex; justify-content: space-between; align-items: flex-end;
          gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-5);
        }
        .tool__header h2 { font-size: 26px; margin-top: var(--space-3); color: var(--text-primary); }

        /* Live badge */
        .tool__live-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; color: var(--text-tertiary);
          border: 1px solid var(--border-subtle);
          padding: 6px 12px; border-radius: 999px; white-space: nowrap;
          transition: border-color 0.3s, color 0.3s;
        }
        .tool__live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); transition: background 0.3s, box-shadow 0.3s; }
        .tool__live-badge--on  { color: var(--accent-teal); border-color: rgba(var(--accent-teal-rgb), 0.35); }
        .tool__live-badge--on  .tool__live-dot { background: var(--accent-teal); animation: pulseGlow 2s ease-in-out infinite; box-shadow: 0 0 6px rgba(var(--accent-teal-rgb), 0.7); }
        .tool__live-badge--off { color: var(--danger); border-color: rgba(var(--danger-rgb), 0.3); }
        .tool__live-badge--off .tool__live-dot { background: var(--danger); }

        /* Panel */
        .tool__panel { display: flex; flex-direction: column; gap: var(--space-5); }

        /* Mode toggle */
        .mode-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); }
        .mode-toggle {
          display: inline-flex; background: var(--bg-panel);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 3px;
        }
        .mode-toggle__btn {
          background: transparent; border: none; color: var(--text-secondary);
          padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm);
          font-size: 13px; transition: background 0.2s, color 0.2s, transform 0.15s;
        }
        .mode-toggle__btn:hover { color: var(--text-primary); }
        .mode-toggle__btn--active {
          background: var(--accent-teal-bg); color: var(--accent-teal);
          box-shadow: 0 1px 6px rgba(var(--accent-teal-rgb), 0.2);
        }

        /* Model select */
        .model-select { display: inline-flex; gap: var(--space-2); flex-wrap: wrap; }
        .model-select__btn {
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          color: var(--text-secondary); padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm); font-size: 13px;
          transition: border-color 0.2s, color 0.2s, transform 0.15s, background 0.2s;
        }
        .model-select__btn:hover:not(:disabled) {
          border-color: var(--accent-blue); color: var(--accent-blue);
          transform: translateY(-1px);
        }
        .model-select__btn--active {
          border-color: var(--accent-blue); color: var(--accent-blue);
          background: rgba(var(--accent-blue-rgb), 0.08);
        }
        .model-select__btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Banners */
        .banner { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: 13px; line-height: 1.5; }
        .banner--warn  { background: var(--accent-amber-bg); color: var(--accent-amber); border: 1px solid rgba(var(--accent-amber-rgb), 0.3); }
        .banner--error { background: rgba(var(--danger-rgb), 0.1); color: var(--danger); border: 1px solid rgba(var(--danger-rgb), 0.3); }

        /* Loading card */
        .loading-card {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          animation: borderPulse 2s ease-in-out infinite;
        }
        .loading-card .spinner { width: 20px; height: 20px; border-width: 2.5px; }
        .loading-card__title   { margin: 0; font-size: 13.5px; color: var(--text-primary); font-weight: 500; }
        .loading-card__subtitle { margin: 2px 0 0; font-size: 12px; color: var(--text-tertiary); }

        @media (max-width: 640px) {
          .mode-row { flex-direction: column; align-items: stretch; }
          .mode-toggle, .model-select { width: 100%; }
          .mode-toggle__btn, .model-select__btn { flex: 1; }
        }
      `}</style>
    </section>
  );
}
