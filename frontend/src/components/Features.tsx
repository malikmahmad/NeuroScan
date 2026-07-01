import { useInView } from "../hooks/useInView";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v1M12 15v1M8 12H9M15 12h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    title: "3-Model Classification",
    tag: "Core",
    desc: "CNN, EfficientNet-B0, and ViT-B/16 run simultaneously on your scan — same image, three independent predictions, side-by-side comparison.",
    highlight: "94.7% accuracy",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C7 6 4 9.5 4 14a8 8 0 0016 0c0-4.5-3-8-8-12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 11v2l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: "U-Net Segmentation",
    tag: "Localization",
    desc: "A dedicated U-Net model draws the precise tumor boundary on your MRI slice — turning a class label into a spatial, pixel-level answer.",
    highlight: "0.886 Dice score",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Grad-CAM Explainability",
    tag: "XAI",
    desc: "For CNN and EfficientNet, Grad-CAM generates a heatmap overlay showing exactly which regions drove the prediction — mathematically valid, not approximated.",
    highlight: "Per-layer visualization",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Attention Rollout (ViT)",
    tag: "XAI",
    desc: "ViT gets its own correct explainability method — Attention Rollout aggregates self-attention across all 12 encoder layers instead of misapplying Grad-CAM.",
    highlight: "Transformer-native",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l4-8 4 5 3-3 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      </svg>
    ),
    title: "Ensemble Prediction",
    tag: "Analysis",
    desc: "In compare mode, probabilities from all three models are averaged into a single ensemble verdict — more robust than any single architecture alone.",
    highlight: "Averaged logits",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    title: "PDF Report Export",
    tag: "Output",
    desc: "Every analysis can be exported as a structured A4 PDF — includes the verdict, confidence scores, probability bars, segmentation stats, and a disclaimer.",
    highlight: "One-click download",
  },
];

export default function Features() {
  const { ref: headerRef, inView: headerVisible } = useInView<HTMLDivElement>();
  const { ref: gridRef,   inView: gridVisible   } = useInView<HTMLDivElement>({ threshold: 0.08 });

  return (
    <section id="features" className="features">
      <div ref={headerRef} className={`features__header reveal ${headerVisible ? "is-visible" : ""}`}>
        <span className="section-eyebrow">Features</span>
        <h2>Everything in one pipeline</h2>
        <p className="features__lead">
          From raw MRI upload to explained, downloadable report — every step runs live,
          with no cached results and no black-box predictions.
        </p>
      </div>

      <div ref={gridRef} className="features__grid">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`feat-card reveal ${gridVisible ? "is-visible" : ""}`}
            style={{ transitionDelay: gridVisible ? `${i * 0.07}s` : "0s" }}
          >
            <div className="feat-card__top">
              <div className="feat-card__icon">{f.icon}</div>
              <span className="feat-card__tag">{f.tag}</span>
            </div>
            <h3 className="feat-card__title">{f.title}</h3>
            <p className="feat-card__desc">{f.desc}</p>
            <div className="feat-card__highlight">
              <span className="feat-card__dot" />
              {f.highlight}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .features {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-8) var(--space-5);
        }
        .features__header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto var(--space-8);
        }
        .features__header h2 {
          font-size: 30px;
          margin: var(--space-3) 0 var(--space-4);
          color: var(--text-primary);
        }
        .features__lead {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }
        .features__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }
        .feat-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          position: relative;
          overflow: hidden;
          cursor: default;
          transition:
            border-color 0.25s,
            box-shadow 0.25s,
            opacity 0.6s cubic-bezier(0.16,1,0.3,1),
            transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .feat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-teal), var(--accent-blue), var(--accent-teal));
          background-size: 200% auto;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .feat-card::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(var(--accent-teal-rgb),0.06), transparent 65%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .feat-card:hover {
          border-color: rgba(var(--accent-teal-rgb), 0.45);
          box-shadow: 0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(var(--accent-teal-rgb),0.08);
          transform: translateY(-6px) !important;
        }
        .feat-card:hover::before { opacity: 1; animation: shimmer 2s linear infinite; }
        .feat-card:hover::after  { opacity: 1; }
        .feat-card:hover .feat-card__icon {
          background: rgba(var(--accent-teal-rgb), 0.18);
          transform: scale(1.12) rotate(-5deg);
          box-shadow: 0 0 16px rgba(var(--accent-teal-rgb), 0.25);
        }
        .feat-card__top {
          display: flex; align-items: center; justify-content: space-between;
        }
        .feat-card__icon {
          width: 46px; height: 46px; border-radius: var(--radius-md);
          background: var(--accent-teal-bg); color: var(--accent-teal);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
        }
        .feat-card__tag {
          font-size: 10.5px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-tertiary);
          background: var(--bg-canvas); border: 1px solid var(--border-subtle);
          padding: 3px 9px; border-radius: 999px;
        }
        .feat-card__title {
          font-size: 16px; font-weight: 600; color: var(--text-primary);
          margin: 0; font-family: var(--font-display);
        }
        .feat-card__desc {
          font-size: 13.5px; line-height: 1.6; color: var(--text-secondary);
          margin: 0; flex: 1;
        }
        .feat-card__highlight {
          display: flex; align-items: center; gap: var(--space-2);
          font-size: 12px; font-weight: 500; color: var(--accent-teal);
          font-family: var(--font-mono); margin-top: auto;
          padding-top: var(--space-3); border-top: 1px solid var(--border-subtle);
        }
        .feat-card__dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent-teal); flex-shrink: 0;
          box-shadow: 0 0 6px rgba(var(--accent-teal-rgb), 0.7);
          animation: pulseGlow 2s ease-in-out infinite;
        }
        @media (max-width: 1024px) { .features__grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .features__grid { grid-template-columns: 1fr; } .features__header h2 { font-size: 24px; } }
      `}</style>
    </section>
  );
}
