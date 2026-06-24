import type { ModelsStatus } from "../api";

interface Props {
  status: ModelsStatus | null;
  loading: boolean;
}

const ITEMS: { key: keyof ModelsStatus; label: string; icon: JSX.Element }[] = [
  {
    key: "cnn",
    label: "CNN",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6.5" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="12" y="5" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    key: "efficientnet",
    label: "EfficientNet",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M2 14V8.5L8 2l6 6.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M5.5 14v-4h5v4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "vit",
    label: "ViT",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1.5 6h13M1.5 10.5h13M6 1.5v13M10.5 1.5v13" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      </svg>
    ),
  },
  {
    key: "unet_segmentation",
    label: "U-Net Seg.",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 4.5a3.5 3.5 0 1 0 3.5 3.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

export default function ModelStatusBar({ status, loading }: Props) {
  return (
    <div className="status-bar">
      <span className="status-bar__label">Models</span>
      <div className="status-bar__dots">
        {ITEMS.map(({ key, label, icon }) => {
          const available = status?.[key] ?? false;
          const state = loading ? "loading" : available ? "ready" : "missing";
          return (
            <div
              className={`status-pill status-pill--${state}`}
              key={key}
              title={available ? `${label} — ready` : `${label} — not loaded`}
            >
              <span className="status-pill__icon">{icon}</span>
              <span className="status-pill__label">{label}</span>
              <span className="status-pill__dot" />
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
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-tertiary);
          white-space: nowrap;
        }
        .status-bar__dots { display: flex; gap: var(--space-2); flex-wrap: wrap; flex: 1; }
        .status-pill {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 5px var(--space-3) 5px var(--space-2);
          border-radius: 999px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-panel-raised);
          transition: border-color 0.2s;
        }
        .status-pill--ready { border-color: rgba(61, 220, 151, 0.25); }
        .status-pill__icon { display: flex; color: var(--text-tertiary); }
        .status-pill--ready .status-pill__icon { color: var(--accent-teal); }
        .status-pill__label { font-size: 12.5px; color: var(--text-secondary); white-space: nowrap; }
        .status-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-strong); margin-left: 2px; }
        .status-pill--ready .status-pill__dot { background: var(--accent-teal); box-shadow: 0 0 6px rgba(61, 220, 151, 0.6); }
        .status-pill--loading .status-pill__dot { background: var(--text-tertiary); animation: spin 1s linear infinite; }
        @media (max-width: 600px) {
          .status-bar { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
        }
      `}</style>
    </div>
  );
}
