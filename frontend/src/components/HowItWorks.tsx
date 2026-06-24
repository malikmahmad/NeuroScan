import { useInView } from "../hooks/useInView";

const STEPS = [
  {
    n: "01", title: "Upload a scan",
    desc: "Drop in an axial T1, T2, or FLAIR MRI slice — PNG, JPEG, or TIFF.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M7 9l5-5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    n: "02", title: "Three models classify it",
    desc: "A custom CNN, EfficientNet-B0, and ViT-B/16 each independently predict the tumor type.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" /><rect x="9.5" y="9.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" /><rect x="16" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" /><path d="M9 6h7M6 9v6m13-9v6" stroke="currentColor" strokeWidth="1.2" opacity="0.5" /></svg>),
  },
  {
    n: "03", title: "See the reasoning",
    desc: "Grad-CAM for CNNs, Attention Rollout for ViT — the correct explainability method for each architecture.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>),
  },
  {
    n: "04", title: "Tumor gets localized",
    desc: "If a tumor is detected, a U-Net segmentation model outlines exactly where it sits in the slice.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C7 6 4 9.5 4 14a8 8 0 0016 0c0-4.5-3-8-8-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.4" /></svg>),
  },
];

export default function HowItWorks() {
  const { ref: headerRef, inView: headerVisible } = useInView<HTMLDivElement>();
  const { ref: gridRef,   inView: gridVisible   } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="how">
      <div ref={headerRef} className={`how__header reveal ${headerVisible ? "is-visible" : ""}`}>
        <span className="section-eyebrow">How it Works</span>
        <h2>From upload to explained result, in four steps</h2>
      </div>

      <div ref={gridRef} className="how__grid">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className={`how__card reveal ${gridVisible ? "is-visible" : ""}`}
            style={{ transitionDelay: gridVisible ? `${i * 0.08}s` : "0s" }}
          >
            <span className="how__num">{s.n}</span>
            <div className="how__icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <style>{`
        .how { max-width: 1400px; margin: 0 auto; padding: var(--space-8) var(--space-5); }
        .how__header { text-align: center; max-width: 680px; margin: 0 auto var(--space-7); }
        .how__header h2 { font-size: 26px; margin-top: var(--space-3); color: var(--text-primary); }
        .how__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
        .how__card {
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: var(--space-5); position: relative;
          transition:
            border-color 0.25s, transform 0.35s cubic-bezier(0.16,1,0.3,1),
            box-shadow 0.25s,
            opacity 0.6s cubic-bezier(0.16,1,0.3,1),
            translate 0.6s cubic-bezier(0.16,1,0.3,1);
          cursor: default;
        }
        .how__card:hover {
          border-color: rgba(var(--accent-teal-rgb), 0.45);
          transform: translateY(-6px) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(var(--accent-teal-rgb),0.1);
        }
        .how__card:hover .how__icon {
          background: rgba(var(--accent-teal-rgb), 0.18);
          transform: scale(1.1) rotate(-4deg);
        }
        .how__num {
          position: absolute; top: var(--space-4); right: var(--space-4);
          font-family: var(--font-mono); font-size: 12px; color: var(--text-tertiary);
        }
        .how__icon {
          width: 42px; height: 42px; border-radius: var(--radius-md);
          background: var(--accent-teal-bg); color: var(--accent-teal);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: var(--space-4);
          transition: background 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .how__card h3 { font-size: 15.5px; color: var(--text-primary); margin-bottom: var(--space-2); }
        .how__card p  { font-size: 13.5px; line-height: 1.55; color: var(--text-secondary); margin: 0; }
        @media (max-width: 900px) { .how__grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 540px) { .how__grid { grid-template-columns: 1fr; } .how__header h2 { font-size: 22px; } }
      `}</style>
    </section>
  );
}
