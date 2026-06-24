import { useEffect, useState } from "react";
import {
  getModelsStatus,
  classifyCompare,
  analyze,
  ApiError,
  type ModelsStatus,
  type ModelName,
  type ClassifyResult,
  type CompareResult,
  type SegmentResult,
  type SegmentNote,
} from "./api";
import ModelStatusBar from "./components/ModelStatusBar";
import UploadZone from "./components/UploadZone";
import ResultsPanel from "./components/ResultsPanel";
import ComparisonView from "./components/ComparisonView";
import MetricsDashboard from "./components/MetricsDashboard";

type Mode = "single" | "compare";

export default function App() {
  const [modelsStatus, setModelsStatus]     = useState<ModelsStatus | null>(null);
  const [statusLoading, setStatusLoading]   = useState(true);
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
  const [mode, setMode]                     = useState<Mode>("single");
  const [selectedModel, setSelectedModel]   = useState<ModelName>("efficientnet");
  const [imageUrl, setImageUrl]             = useState<string | null>(null);
  const [analyzing, setAnalyzing]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const [singleResult, setSingleResult] = useState<{
    classification: ClassifyResult;
    segmentation?: SegmentResult | SegmentNote;
  } | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  useEffect(() => {
    getModelsStatus()
      .then((s) => {
        setModelsStatus(s);
        setBackendReachable(true);
      })
      .catch(() => {
        setBackendReachable(false);
        setError("Could not reach the backend. Is the API server running on port 8000?");
      })
      .finally(() => setStatusLoading(false));
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    setSingleResult(null);
    setCompareResult(null);
    setImageUrl(URL.createObjectURL(file));
    setAnalyzing(true);

    try {
      if (mode === "single") {
        setSingleResult(await analyze(file, selectedModel));
      } else {
        setCompareResult(await classifyCompare(file));
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        setError(`That model isn't trained yet: ${e.message}`);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong during analysis.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const noModelsAvailable =
    modelsStatus !== null &&
    !modelsStatus.cnn &&
    !modelsStatus.efficientnet &&
    !modelsStatus.vit;

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1>NeuroScan</h1>
          <p className="app__tagline">Comparative deep learning analysis for brain tumor MRI</p>
        </div>
        <div className={`app__live-badge ${backendReachable ? "app__live-badge--on" : backendReachable === false ? "app__live-badge--off" : ""}`}>
          <span className="app__live-dot" />
          {backendReachable === null ? "Connecting…" : backendReachable ? "API connected" : "API offline"}
        </div>
      </header>

      <main className="app__main">
        <ModelStatusBar status={modelsStatus} loading={statusLoading} />

        {noModelsAvailable && (
          <div className="banner banner--warn fade-in-up">
            No trained model checkpoints found. Train at least one model using the notebooks in{" "}
            <code className="mono">notebooks/</code> and place the weights in{" "}
            <code className="mono">backend/models/</code>, then restart the API.
          </div>
        )}

        <MetricsDashboard />

        <div className="mode-row">
          <div className="mode-toggle" role="tablist" aria-label="Analysis mode">
            <button
              role="tab"
              aria-selected={mode === "single"}
              className={mode === "single" ? "mode-toggle__btn mode-toggle__btn--active" : "mode-toggle__btn"}
              onClick={() => setMode("single")}
            >
              Single model
            </button>
            <button
              role="tab"
              aria-selected={mode === "compare"}
              className={mode === "compare" ? "mode-toggle__btn mode-toggle__btn--active" : "mode-toggle__btn"}
              onClick={() => setMode("compare")}
            >
              Compare all 3
            </button>
          </div>

          {mode === "single" && (
            <div className="model-select">
              {(["cnn", "efficientnet", "vit"] as ModelName[]).map((m) => (
                <button
                  key={m}
                  className={selectedModel === m ? "model-select__btn model-select__btn--active" : "model-select__btn"}
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
                {mode === "compare" ? "Scoring with all three architectures" : `Scoring with ${selectedModel}`}
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
      </main>

      <footer className="app__footer">
        <span>Research and educational tool only.</span>
        <span className="app__footer-sep">·</span>
        <span>Not a certified diagnostic device — predictions must not be used for clinical decision-making.</span>
      </footer>

      <style>{`
        .app {
          max-width: 920px;
          margin: 0 auto;
          padding: var(--space-5) var(--space-5) var(--space-8);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          min-height: 100vh;
        }
        .app__header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) 0;
          margin: 0 calc(-1 * var(--space-5));
          padding-left: var(--space-5);
          padding-right: var(--space-5);
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(10, 14, 19, 0.85);
          backdrop-filter: blur(8px);
        }
        .app__brand h1 { font-size: 22px; color: var(--accent-teal); line-height: 1.1; }
        .app__tagline { margin: 2px 0 0; color: var(--text-tertiary); font-size: 12.5px; }
        .app__live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--text-tertiary);
          border: 1px solid var(--border-subtle);
          padding: 5px 10px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .app__live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
        .app__live-badge--on  { color: var(--accent-teal); border-color: rgba(61, 220, 151, 0.3); }
        .app__live-badge--on  .app__live-dot { background: var(--accent-teal); box-shadow: 0 0 6px rgba(61, 220, 151, 0.6); }
        .app__live-badge--off { color: var(--danger); border-color: rgba(227, 100, 100, 0.3); }
        .app__live-badge--off .app__live-dot { background: var(--danger); }
        .app__main { display: flex; flex-direction: column; gap: var(--space-5); flex: 1; }
        .mode-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-3);
        }
        .mode-toggle {
          display: inline-flex;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 3px;
        }
        .mode-toggle__btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: background 0.15s, color 0.15s;
        }
        .mode-toggle__btn--active { background: var(--accent-teal-bg); color: var(--accent-teal); }
        .model-select { display: inline-flex; gap: var(--space-2); flex-wrap: wrap; }
        .model-select__btn {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: border-color 0.15s, color 0.15s;
        }
        .model-select__btn--active { border-color: var(--accent-blue); color: var(--accent-blue); }
        .model-select__btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .banner {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: 13px;
          line-height: 1.5;
        }
        .banner--warn { background: var(--accent-amber-bg); color: var(--accent-amber); border: 1px solid rgba(240, 168, 87, 0.3); }
        .banner--error { background: rgba(227, 100, 100, 0.1); color: var(--danger); border: 1px solid rgba(227, 100, 100, 0.3); }
        .loading-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .loading-card .spinner { width: 20px; height: 20px; border-width: 2.5px; }
        .loading-card__title { margin: 0; font-size: 13.5px; color: var(--text-primary); font-weight: 500; }
        .loading-card__subtitle { margin: 2px 0 0; font-size: 12px; color: var(--text-tertiary); }
        .app__footer {
          margin-top: auto;
          padding-top: var(--space-5);
          border-top: 1px solid var(--border-subtle);
          font-size: 11.5px;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.6;
        }
        .app__footer-sep { margin: 0 6px; opacity: 0.5; }
        @media (max-width: 640px) {
          .app { padding-left: var(--space-3); padding-right: var(--space-3); }
          .app__header { margin: 0 calc(-1 * var(--space-3)); padding-left: var(--space-3); padding-right: var(--space-3); }
          .app__tagline { display: none; }
          .mode-row { flex-direction: column; align-items: stretch; }
          .mode-toggle, .model-select { width: 100%; }
          .mode-toggle__btn, .model-select__btn { flex: 1; }
          .app__footer-sep { display: block; margin: 4px 0 0; }
        }
      `}</style>
    </div>
  );
}
