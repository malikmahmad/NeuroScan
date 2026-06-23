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
  const [modelsStatus, setModelsStatus]   = useState<ModelsStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [mode, setMode]                   = useState<Mode>("single");
  const [selectedModel, setSelectedModel] = useState<ModelName>("efficientnet");
  const [imageUrl, setImageUrl]           = useState<string | null>(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const [singleResult, setSingleResult] = useState<{
    classification: ClassifyResult;
    segmentation?: SegmentResult | SegmentNote;
  } | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  useEffect(() => {
    getModelsStatus()
      .then(setModelsStatus)
      .catch(() => setError("Could not reach the backend. Is the server running on port 8000?"))
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
        setError(`Model not available: ${e.message}`);
      } else {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const noModels =
    modelsStatus !== null &&
    !modelsStatus.cnn &&
    !modelsStatus.efficientnet &&
    !modelsStatus.vit;

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>NeuroScan</h1>
          <p className="app__tagline">Comparative deep learning for brain tumor MRI analysis</p>
        </div>
      </header>

      <main className="app__main">
        <ModelStatusBar status={modelsStatus} loading={statusLoading} />

        {noModels && (
          <div className="banner banner--warn">
            No model weights found. Train the models using the notebooks and place the{" "}
            <code>.pth</code> files in <code>backend/models/</code>.
          </div>
        )}

        <MetricsDashboard />

        <div className="mode-row">
          <div className="mode-toggle" role="tablist" aria-label="Analysis mode">
            {(["single", "compare"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
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

        {error && <div className="banner banner--error">{error}</div>}

        {analyzing && (
          <div className="analyzing-state">
            <div className="analyzing-spinner" aria-hidden="true" />
            <p className="status-text">Analyzing scan…</p>
          </div>
        )}

        {!analyzing && mode === "single" && singleResult && imageUrl && (
          <ResultsPanel
            originalImageUrl={imageUrl}
            result={singleResult.classification}
            segmentation={singleResult.segmentation}
          />
        )}

        {!analyzing && mode === "compare" && compareResult && (
          <ComparisonView result={compareResult} />
        )}
      </main>

      <footer className="app__footer">
        Research and educational use only — not a certified medical device.
        Do not use for clinical decision-making.
      </footer>

      <style>{`
        .app {
          max-width: 920px;
          margin: 0 auto;
          padding: var(--space-6) var(--space-5) var(--space-8);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          min-height: 100vh;
        }
        .app__header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
        }
        .app__header h1 { font-size: 24px; color: var(--accent-teal); }
        .app__tagline {
          margin: var(--space-1) 0 0;
          color: var(--text-tertiary);
          font-size: 13px;
        }
        .app__main {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          flex: 1;
        }
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
        }
        .mode-toggle__btn--active {
          background: var(--accent-teal-bg);
          color: var(--accent-teal);
        }
        .model-select { display: inline-flex; gap: var(--space-2); }
        .model-select__btn {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          font-size: 13px;
        }
        .model-select__btn--active {
          border-color: var(--accent-blue);
          color: var(--accent-blue);
        }
        .model-select__btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .banner {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-size: 13px;
          line-height: 1.5;
        }
        .banner--warn {
          background: var(--accent-amber-bg);
          color: var(--accent-amber);
          border: 1px solid rgba(240, 168, 87, 0.3);
        }
        .banner--error {
          background: rgba(227, 100, 100, 0.1);
          color: var(--danger);
          border: 1px solid rgba(227, 100, 100, 0.3);
        }
        .analyzing-state {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .analyzing-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-strong);
          border-top-color: var(--accent-teal);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .status-text { color: var(--text-secondary); font-size: 14px; }
        .app__footer {
          margin-top: auto;
          padding-top: var(--space-5);
          border-top: 1px solid var(--border-subtle);
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
