const HIGHLIGHTS = [
  { label: "94.7%", desc: "ViT-B/16 test accuracy (best model)" },
  { label: "0.886", desc: "U-Net Dice score on LGG MRI dataset" },
  { label: "3 + 1", desc: "Architectures compared (CNN, EfficientNet, ViT) + U-Net" },
  { label: "100%", desc: "Predictions computed live — no cached results" },
];

const STACK = [
  { name: "PyTorch",      desc: "All four models" },
  { name: "FastAPI",      desc: "Inference backend" },
  { name: "React + TS",   desc: "This interface" },
  { name: "Three.js",     desc: "Hero visualisation" },
  { name: "Grad-CAM",     desc: "CNN explainability" },
  { name: "Attn Rollout", desc: "ViT explainability" },
];

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about__header">
        <span className="section-eyebrow">About the Project</span>
        <h2>A measured comparison, not a claim</h2>
        <p className="about__lead">
          Most public brain-tumor-MRI repositories train a single CNN and report one accuracy number.
          NeuroScan trains three architecturally different models under identical conditions — same
          dataset, same splits, same augmentation — so the comparison is reproducible and the winner
          is determined by numbers, not by choice of architecture.
        </p>
      </div>

      <div className="about__highlights">
        {HIGHLIGHTS.map((h) => (
          <div className="about__stat" key={h.label}>
            <span className="about__stat-val">{h.label}</span>
            <span className="about__stat-desc">{h.desc}</span>
          </div>
        ))}
      </div>

      <div className="about__body">
        <div className="about__text">
          <h3>What makes this different</h3>
          <p>
            Explainability is treated correctly: Grad-CAM is applied only to the convolutional
            models (CNN and EfficientNet), where it is mathematically valid. ViT receives Attention
            Rollout instead — aggregating self-attention weights across all encoder layers — because
            applying Grad-CAM to a pure transformer is a methodological error that several public
            implementations make.
          </p>
          <p>
            The segmentation model (U-Net) goes one step further than classification: it draws the
            tumor boundary directly on the slice, turning an abstract label into a spatial answer.
            Both models are served live through a FastAPI backend with no stored predictions —
            every number shown was computed on the image you uploaded.
          </p>
          <h3>Datasets</h3>
          <p>
            Classification uses the <strong>Brain Tumor MRI Dataset</strong> by Masoud Nickparvar
            (Kaggle) — 7,000+ images across four classes. Segmentation uses the{" "}
            <strong>LGG MRI Segmentation</strong> dataset by Buda et al. (3,929 FLAIR slice pairs).
            Both are public and cited in the paper outline.
          </p>
        </div>

        <div className="about__stack">
          <h3>Tech stack</h3>
          <div className="about__stack-grid">
            {STACK.map((s) => (
              <div className="about__stack-item" key={s.name}>
                <span className="about__stack-name">{s.name}</span>
                <span className="about__stack-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .about { max-width: 1100px; margin: 0 auto; padding: var(--space-8) var(--space-5); }
        .about__header { max-width: 680px; margin-bottom: var(--space-7); }
        .about__header h2 { font-size: 28px; margin: var(--space-3) 0 var(--space-4); color: var(--text-primary); }
        .about__lead { font-size: 15px; line-height: 1.7; color: var(--text-secondary); margin: 0; }

        .about__highlights {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);
          margin-bottom: var(--space-7);
        }
        .about__stat {
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: var(--space-5);
          display: flex; flex-direction: column; gap: var(--space-2);
          transition: border-color 0.2s, transform 0.2s;
        }
        .about__stat:hover { border-color: rgba(var(--accent-teal-rgb), 0.35); transform: translateY(-2px); }
        .about__stat-val { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--accent-teal); }
        .about__stat-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

        .about__body {
          display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-8);
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl); padding: var(--space-7);
        }
        .about__text h3 { font-size: 16px; color: var(--text-primary); margin: 0 0 var(--space-3); }
        .about__text h3 + p { margin-top: 0; }
        .about__text p { font-size: 14px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 var(--space-5); }
        .about__text p:last-child { margin-bottom: 0; }
        .about__text strong { color: var(--text-primary); font-weight: 500; }

        .about__stack h3 { font-size: 16px; color: var(--text-primary); margin: 0 0 var(--space-4); }
        .about__stack-grid { display: flex; flex-direction: column; gap: var(--space-2); }
        .about__stack-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-canvas); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }
        .about__stack-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .about__stack-desc { font-size: 12px; color: var(--text-tertiary); }

        @media (max-width: 860px) {
          .about__highlights { grid-template-columns: 1fr 1fr; }
          .about__body { grid-template-columns: 1fr; padding: var(--space-5); gap: var(--space-6); }
        }
        @media (max-width: 480px) {
          .about__highlights { grid-template-columns: 1fr 1fr; gap: var(--space-3); }
          .about__stat-val { font-size: 22px; }
          .about__header h2 { font-size: 22px; }
        }
      `}</style>
    </section>
  );
}
