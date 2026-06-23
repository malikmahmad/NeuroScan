import type { CompareResult } from "../api";

interface Props {
  result: CompareResult;
}

const MODEL_LABELS: Record<string, string> = {
  cnn: "Custom CNN",
  efficientnet: "EfficientNet-B0",
  vit: "ViT-B/16",
};

const CLASS_LABELS: Record<string, string> = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary",
  notumor: "No Tumor",
};

const METHOD_COLORS: Record<string, string> = {
  "Grad-CAM": "var(--accent-blue)",
  "Attention Rollout": "var(--accent-amber)",
};

export default function ComparisonView({ result }: Props) {
  const rows = Object.entries(result.per_model);
  const allAgree =
    new Set(rows.map(([, r]) => r.predicted_class)).size === 1;
  const ensemblePred = result.ensemble.predicted_class;
  const isTumor = ensemblePred !== "notumor";

  return (
    <div className="comparison-view">
      {/* ── Ensemble summary ──────────────────────────── */}
      <div className="ensemble-summary">
        <div>
          <div className="ensemble-label">Ensemble consensus</div>
          <div
            className="ensemble-verdict"
            style={{ color: isTumor ? "var(--accent-amber)" : "var(--accent-teal)" }}
          >
            {isTumor ? "⚠ " : "✓ "}
            {CLASS_LABELS[ensemblePred] ?? ensemblePred}
          </div>
        </div>
        <div className="ensemble-right">
          <span className="ensemble-conf mono">
            {(result.ensemble.confidence * 100).toFixed(1)}%
          </span>
          <span className="ensemble-sublabel">avg confidence</span>
          <span
            className="ensemble-agreement"
            style={{ color: allAgree ? "var(--accent-teal)" : "var(--accent-amber)" }}
          >
            {allAgree ? "All models agree" : "Models disagree"}
          </span>
        </div>
      </div>

      {/* ── Ensemble probability bars ──────────────────── */}
      <div className="ensemble-probs">
        {Object.entries(result.ensemble.class_probabilities)
          .sort((a, b) => b[1] - a[1])
          .map(([cls, prob]) => (
            <div className="ens-prob-row" key={cls}>
              <span className="ens-prob-label">{CLASS_LABELS[cls] ?? cls}</span>
              <div className="ens-prob-track">
                <div
                  className="ens-prob-fill"
                  style={{
                    width: `${prob * 100}%`,
                    background:
                      cls === ensemblePred
                        ? isTumor
                          ? "var(--accent-amber)"
                          : "var(--accent-teal)"
                        : "var(--accent-blue)",
                  }}
                />
              </div>
              <span className="ens-prob-value mono">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
      </div>

      {/* ── Per-model table ────────────────────────────── */}
      <div>
        <div className="section-label">Per-architecture breakdown</div>
        <div className="model-cards">
          {rows.map(([key, r]) => {
            const agree = r.predicted_class === ensemblePred;
            const preds = Object.entries(r.class_probabilities).sort((a, b) => b[1] - a[1]);
            return (
              <div className="model-card" key={key}>
                <div className="model-card__header">
                  <span className="model-card__name">{MODEL_LABELS[key] ?? key}</span>
                  <span
                    className="model-card__agree"
                    style={{ color: agree ? "var(--accent-teal)" : "var(--accent-amber)" }}
                  >
                    {agree ? "✓ agrees" : "≠ differs"}
                  </span>
                </div>
                <div
                  className="model-card__pred"
                  style={{ color: r.predicted_class !== "notumor" ? "var(--accent-amber)" : "var(--accent-teal)" }}
                >
                  {CLASS_LABELS[r.predicted_class] ?? r.predicted_class}
                </div>
                <div className="model-card__conf mono">
                  {(r.confidence * 100).toFixed(1)}% confidence
                </div>
                <div
                  className="model-card__method"
                  style={{ color: METHOD_COLORS[r.explainability_method] ?? "var(--text-tertiary)" }}
                >
                  {r.explainability_method}
                </div>
                {/* mini prob bars */}
                <div className="model-card__probs">
                  {preds.map(([cls, prob]) => (
                    <div className="mini-bar" key={cls}>
                      <span className="mini-bar__label">{CLASS_LABELS[cls] ?? cls}</span>
                      <div className="mini-bar__track">
                        <div
                          className="mini-bar__fill"
                          style={{
                            width: `${prob * 100}%`,
                            opacity: cls === r.predicted_class ? 1 : 0.4,
                          }}
                        />
                      </div>
                      <span className="mini-bar__value mono">{(prob * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .comparison-view {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .ensemble-summary {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        .ensemble-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          margin-bottom: var(--space-1);
        }
        .ensemble-verdict {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
        }
        .ensemble-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .ensemble-conf {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ensemble-sublabel {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .ensemble-agreement {
          font-size: 12px;
          font-weight: 500;
          margin-top: 4px;
        }
        .ensemble-probs {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .ens-prob-row {
          display: grid;
          grid-template-columns: 120px 1fr 52px;
          align-items: center;
          gap: var(--space-3);
        }
        .ens-prob-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .ens-prob-track {
          height: 8px;
          background: var(--bg-canvas);
          border-radius: 4px;
          overflow: hidden;
        }
        .ens-prob-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .ens-prob-value {
          font-size: 13px;
          color: var(--text-tertiary);
          text-align: right;
        }
        .section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          margin-bottom: var(--space-3);
        }
        .model-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-3);
        }
        .model-card {
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .model-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .model-card__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .model-card__agree {
          font-size: 11px;
          font-weight: 500;
        }
        .model-card__pred {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
        }
        .model-card__conf {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .model-card__method {
          font-size: 11px;
        }
        .model-card__probs {
          margin-top: var(--space-2);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .mini-bar {
          display: grid;
          grid-template-columns: 90px 1fr 32px;
          align-items: center;
          gap: var(--space-2);
        }
        .mini-bar__label {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .mini-bar__track {
          height: 4px;
          background: var(--bg-panel);
          border-radius: 2px;
          overflow: hidden;
        }
        .mini-bar__fill {
          height: 100%;
          background: var(--accent-blue);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .mini-bar__value {
          font-size: 10px;
          color: var(--text-tertiary);
          text-align: right;
        }
      `}</style>
    </div>
  );
}
