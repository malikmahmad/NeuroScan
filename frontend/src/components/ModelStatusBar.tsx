import type { ModelsStatus } from "../api";

interface Props {
  status: ModelsStatus | null;
  loading: boolean;
}

const LABELS: { key: keyof ModelsStatus; label: string }[] = [
  { key: "cnn", label: "CNN" },
  { key: "efficientnet", label: "EfficientNet" },
  { key: "vit", label: "ViT" },
  { key: "unet_segmentation", label: "U-Net Segmentation" },
];

export default function ModelStatusBar({ status, loading }: Props) {
  return (
    <div className="status-bar">
      <span className="status-bar__label">Model availability</span>
      <div className="status-bar__dots">
        {LABELS.map(({ key, label }) => {
          const available = status?.[key] ?? false;
          return (
            <div className="status-dot" key={key} title={available ? `${label} — checkpoint loaded` : `${label} — not trained yet`}>
              <span
                className="status-dot__indicator"
                style={{
                  background: loading ? "var(--text-tertiary)" : available ? "var(--accent-teal)" : "transparent",
                  borderColor: loading ? "var(--text-tertiary)" : available ? "var(--accent-teal)" : "var(--border-strong)",
                }}
              />
              <span className="status-dot__label">{label}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .status-bar {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          flex-wrap: wrap;
          padding: var(--space-3) var(--space-5);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        .status-bar__label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          white-space: nowrap;
        }
        .status-bar__dots {
          display: flex;
          gap: var(--space-5);
          flex-wrap: wrap;
        }
        .status-dot {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .status-dot__indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1.5px solid;
          flex-shrink: 0;
        }
        .status-dot__label {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
