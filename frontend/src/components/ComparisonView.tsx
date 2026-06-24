import type { CompareResult } from "../api";

interface Props {
  result: CompareResult;
}

const MODEL_LABELS: Record<string, string> = {
  cnn:          "Custom CNN",
  efficientnet: "EfficientNet-B0",
  vit:          "ViT-B/16",
};

const CLASS_LABELS: Record<string, string> = {
  glioma:     "Glioma",
  meningioma: "Meningioma",
  pituitary:  "Pituitary tumor",
  notumor:    "No tumor detected",
};

export default function ComparisonView({ result }: Props) {
  const rows        = Object.entries(result.per_model);
  const predictions = rows.map(([, r]) => r.predicted_class);
  const allAgree    = predictions.every((p) => p === predictions[0]);

  return (
    <div className="comparison-view">
      <div className="comparison-view__header">
        <h3>Architecture comparison</h3>
        <span className={`agreement-tag ${allAgree ? "agreement-tag--yes" : "agreement-tag--no"}`}>
          {allAgree ? "Models agree" : "Models disagree"}
        </span>
      </div>

      <div className="comparison-view__scroll">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Prediction</th>
              <th>Confidence</th>
              <th>Explainability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, r]) => (
              <tr
                key={key}
                className={r.predicted_class !== result.ensemble.predicted_class ? "comparison-view__dissent-row" : ""}
              >
                <td>{MODEL_LABELS[key] ?? key}</td>
                <td>{CLASS_LABELS[r.predicted_class] ?? r.predicted_class}</td>
                <td>
                  <span className="confidence-cell">
                    <span className="confidence-cell__track">
                      <span className="confidence-cell__fill" style={{ width: `${r.confidence * 100}%` }} />
                    </span>
                    <span className="mono">{(r.confidence * 100).toFixed(1)}%</span>
                  </span>
                </td>
                <td className="comparison-view__method">{r.explainability_method}</td>
              </tr>
            ))}
            <tr className="comparison-view__ensemble-row">
              <td>Ensemble (averaged)</td>
              <td>{CLASS_LABELS[result.ensemble.predicted_class] ?? result.ensemble.predicted_class}</td>
              <td className="mono">{(result.ensemble.confidence * 100).toFixed(1)}%</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        .comparison-view {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }
        .comparison-view__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }
        .comparison-view h3 { font-size: 15px; color: var(--text-primary); }
        .agreement-tag { font-size: 11.5px; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
        .agreement-tag--yes { background: var(--accent-teal-bg); color: var(--accent-teal); }
        .agreement-tag--no  { background: var(--accent-amber-bg); color: var(--accent-amber); }
        .comparison-view__scroll { overflow-x: auto; margin: 0 calc(-1 * var(--space-2)); }
        table { width: 100%; min-width: 460px; border-collapse: collapse; font-size: 13px; }
        th {
          text-align: left;
          color: var(--text-tertiary);
          font-weight: 500;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.04em;
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
          white-space: nowrap;
        }
        td {
          padding: var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          white-space: nowrap;
        }
        td:first-child { color: var(--text-primary); font-weight: 500; }
        tr:last-child td { border-bottom: none; }
        .comparison-view__dissent-row td:nth-child(2) { color: var(--accent-amber); }
        .confidence-cell { display: flex; align-items: center; gap: var(--space-2); }
        .confidence-cell__track {
          width: 56px;
          height: 4px;
          background: var(--bg-canvas);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .confidence-cell__fill { display: block; height: 100%; background: var(--accent-blue); border-radius: 2px; }
        .comparison-view__method { color: var(--text-tertiary); font-size: 12px; }
        .comparison-view__ensemble-row td {
          color: var(--accent-teal);
          font-weight: 500;
          background: var(--accent-teal-bg);
        }
        .comparison-view__ensemble-row td:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
        .comparison-view__ensemble-row td:last-child  { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
      `}</style>
    </div>
  );
}
