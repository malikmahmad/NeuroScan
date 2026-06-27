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
    <div className="cv">
      <div className="cv__header">
        <h3 className="cv__title">Architecture comparison</h3>
        <span className={`cv__tag ${allAgree ? "cv__tag--yes" : "cv__tag--no"}`}>
          {allAgree ? "All models agree" : "Models disagree"}
        </span>
      </div>

      <div className="cv__scroll">
        <table className="cv__table">
          <caption className="cv__caption">
            Per-model classification results with averaged ensemble
          </caption>
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Prediction</th>
              <th scope="col">Confidence</th>
              <th scope="col">Explainability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, r]) => {
              const isDisagreement = r.predicted_class !== result.ensemble.predicted_class;
              return (
                <tr key={key} className={isDisagreement ? "cv__dissent" : ""}>
                  <td className="cv__model-cell">{MODEL_LABELS[key] ?? key}</td>
                  <td className={isDisagreement ? "cv__pred-dissent" : "cv__pred"}>
                    {CLASS_LABELS[r.predicted_class] ?? r.predicted_class}
                  </td>
                  <td>
                    <span className="cv__conf">
                      <span className="cv__conf-track">
                        <span
                          className="cv__conf-fill"
                          style={{ width: `${r.confidence * 100}%` }}
                        />
                      </span>
                      <span className="mono">{(r.confidence * 100).toFixed(1)}%</span>
                    </span>
                  </td>
                  <td className="cv__method">{r.explainability_method}</td>
                </tr>
              );
            })}
            <tr className="cv__ensemble">
              <td>Ensemble (averaged)</td>
              <td>{CLASS_LABELS[result.ensemble.predicted_class] ?? result.ensemble.predicted_class}</td>
              <td className="mono">{(result.ensemble.confidence * 100).toFixed(1)}%</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        .cv {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }
        .cv__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }
        .cv__title { font-size: 15px; color: var(--text-primary); }
        .cv__tag {
          font-size: 11.5px;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .cv__tag--yes { background: var(--accent-teal-bg); color: var(--accent-teal); }
        .cv__tag--no  { background: var(--accent-amber-bg); color: var(--accent-amber); }
        .cv__scroll { overflow-x: auto; }
        .cv__caption {
          caption-side: top;
          font-size: 0;
          height: 0;
          overflow: hidden;
        }
        .cv__table {
          width: 100%;
          min-width: 460px;
          border-collapse: collapse;
          font-size: 13px;
        }
        .cv__table th {
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
        .cv__table td {
          padding: var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .cv__table tbody tr:last-child td { border-bottom: none; }
        .cv__model-cell  { color: var(--text-primary); font-weight: 500; }
        .cv__pred        { color: var(--text-secondary); }
        .cv__pred-dissent { color: var(--accent-amber); }
        .cv__method { color: var(--text-tertiary); font-size: 12px; }
        .cv__conf {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .cv__conf-track {
          width: 56px;
          height: 4px;
          background: var(--bg-canvas);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .cv__conf-fill {
          display: block;
          height: 100%;
          background: var(--accent-blue);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cv__ensemble td {
          color: var(--accent-teal);
          font-weight: 500;
          background: var(--accent-teal-bg);
        }
        .cv__ensemble td:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
        .cv__ensemble td:last-child  { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
      `}</style>
    </div>
  );
}
