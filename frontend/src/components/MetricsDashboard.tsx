import { useEffect, useState } from "react";
import {
  getClassificationMetrics,
  getSegmentationMetrics,
  type ClassificationMetrics,
  type SegmentationMetrics,
} from "../api";

const MODEL_LABELS: Record<string, string> = {
  cnn: "Custom CNN",
  efficientnet: "EfficientNet-B0",
  vit: "ViT-B/16",
};

const CLASS_LABELS: Record<string, string> = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  notumor: "No Tumor",
  pituitary: "Pituitary",
};

function MetricBar({ value, max = 1 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 90 ? "var(--accent-teal)" : pct >= 75 ? "var(--accent-blue)" : "var(--accent-amber)";
  return (
    <div className="metric-bar-track">
      <div className="metric-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function MetricsDashboard() {
  const [classMetrics, setClassMetrics] = useState<ClassificationMetrics | null>(null);
  const [segMetrics, setSegMetrics] = useState<SegmentationMetrics | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || classMetrics) return;
    setLoading(true);
    Promise.all([getClassificationMetrics(), getSegmentationMetrics()])
      .then(([c, s]) => {
        setClassMetrics(c);
        setSegMetrics(s);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const hasClassData = classMetrics?.available && classMetrics.models;
  const hasSegData = segMetrics?.available && segMetrics.test;

  return (
    <div className="metrics-dashboard">
      <button className="metrics-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.75" />
          <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" />
        </svg>
        Training metrics
        <span className="metrics-toggle__chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>

      {open && (
        <div className="metrics-panel">
          {loading && <p className="metrics-empty">Loading metrics…</p>}

          {!loading && !hasClassData && !hasSegData && (
            <p className="metrics-empty">
              No training metrics found. Run the classification and segmentation notebooks on Kaggle,
              then copy the <code>outputs/</code> folders into <code>notebooks/</code>.
            </p>
          )}

          {/* ── Classification Table ─────────────────────────────── */}
          {hasClassData && (
            <section>
              <h4 className="metrics-section-title">Classification — Test Set Results</h4>
              <div className="metrics-table-wrap">
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Accuracy</th>
                      <th>Macro F1</th>
                      <th>Weighted F1</th>
                      <th>ROC-AUC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(classMetrics!.models!).map(([key, data]) => {
                      const t = data.test;
                      if (!t) return null;
                      return (
                        <tr key={key}>
                          <td className="model-name-cell">{MODEL_LABELS[key] ?? key}</td>
                          <td>
                            <div className="metric-cell">
                              <span className="metric-value mono">
                                {(t.test_accuracy * 100).toFixed(1)}%
                              </span>
                              <MetricBar value={t.test_accuracy} />
                            </div>
                          </td>
                          <td>
                            <div className="metric-cell">
                              <span className="metric-value mono">
                                {t.macro_f1.toFixed(3)}
                              </span>
                              <MetricBar value={t.macro_f1} />
                            </div>
                          </td>
                          <td>
                            <div className="metric-cell">
                              <span className="metric-value mono">
                                {t.weighted_f1.toFixed(3)}
                              </span>
                              <MetricBar value={t.weighted_f1} />
                            </div>
                          </td>
                          <td>
                            <span className="metric-value mono">
                              {t.roc_auc_ovr != null ? t.roc_auc_ovr.toFixed(3) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Per-class breakdown for best model */}
              {(() => {
                const entries = Object.entries(classMetrics!.models!).filter(([, d]) => d.test);
                if (!entries.length) return null;
                const best = entries.reduce((a, b) =>
                  (b[1].test!.test_accuracy > a[1].test!.test_accuracy ? b : a)
                );
                const [bestKey, bestData] = best;
                return (
                  <div className="per-class-section">
                    <h5 className="metrics-subsection-title">
                      Per-class F1 — {MODEL_LABELS[bestKey] ?? bestKey} (best model)
                    </h5>
                    <div className="per-class-grid">
                      {Object.entries(bestData.test!.per_class).map(([cls, scores]) => (
                        <div className="per-class-card" key={cls}>
                          <span className="per-class-name">{CLASS_LABELS[cls] ?? cls}</span>
                          <span className="per-class-f1 mono">
                            {(scores["f1-score"] * 100).toFixed(1)}%
                          </span>
                          <MetricBar value={scores["f1-score"]} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

          {/* ── Segmentation Results ─────────────────────────────── */}
          {hasSegData && (
            <section>
              <h4 className="metrics-section-title">Segmentation — U-Net Test Set Results</h4>
              <div className="seg-metrics-row">
                <div className="seg-metric-card">
                  <span className="seg-metric-label">Dice Coefficient</span>
                  <span className="seg-metric-value mono">
                    {segMetrics!.test!.test_dice.toFixed(4)}
                  </span>
                  <MetricBar value={segMetrics!.test!.test_dice} />
                </div>
                <div className="seg-metric-card">
                  <span className="seg-metric-label">IoU Score</span>
                  <span className="seg-metric-value mono">
                    {segMetrics!.test!.test_iou.toFixed(4)}
                  </span>
                  <MetricBar value={segMetrics!.test!.test_iou} />
                </div>
                <div className="seg-metric-card seg-metric-card--note">
                  <span className="seg-metric-label">Benchmark</span>
                  <span className="seg-metric-note">
                    Literature range for U-Net on LGG MRI: 0.85–0.90 Dice
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <style>{`
        .metrics-dashboard {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .metrics-toggle {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: 13px;
          width: fit-content;
          transition: color 0.15s, border-color 0.15s;
        }
        .metrics-toggle:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        .metrics-toggle__chevron {
          font-size: 11px;
          transition: transform 0.2s;
          display: inline-block;
        }
        .metrics-panel {
          margin-top: var(--space-3);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .metrics-empty {
          color: var(--text-tertiary);
          font-size: 13px;
          margin: 0;
        }
        .metrics-section-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 var(--space-4) 0;
        }
        .metrics-subsection-title {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: var(--space-4) 0 var(--space-3) 0;
          font-weight: 500;
        }
        .metrics-table-wrap {
          overflow-x: auto;
        }
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 500px;
        }
        .metrics-table th {
          text-align: left;
          color: var(--text-tertiary);
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
          white-space: nowrap;
        }
        .metrics-table td {
          padding: var(--space-3);
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .metrics-table tbody tr:last-child td {
          border-bottom: none;
        }
        .metrics-table tbody tr:hover td {
          background: var(--bg-panel-raised);
        }
        .model-name-cell {
          color: var(--text-primary);
          font-weight: 500;
          white-space: nowrap;
        }
        .metric-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 80px;
        }
        .metric-value {
          color: var(--text-primary);
          font-size: 13px;
        }
        .metric-bar-track {
          height: 4px;
          background: var(--bg-canvas);
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
        }
        .metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s ease;
        }
        .per-class-section { margin-top: var(--space-2); }
        .per-class-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--space-3);
        }
        .per-class-card {
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-3);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .per-class-name {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .per-class-f1 {
          font-size: 18px;
          color: var(--text-primary);
          font-weight: 600;
        }
        .seg-metrics-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          gap: var(--space-4);
        }
        @media (max-width: 640px) {
          .seg-metrics-row { grid-template-columns: 1fr; }
        }
        .seg-metric-card {
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .seg-metric-card--note {
          border-color: rgba(61, 220, 151, 0.2);
          background: var(--accent-teal-bg);
        }
        .seg-metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
        }
        .seg-metric-value {
          font-size: 28px;
          font-weight: 600;
          color: var(--accent-teal);
        }
        .seg-metric-note {
          font-size: 12px;
          color: var(--accent-teal-dim);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
