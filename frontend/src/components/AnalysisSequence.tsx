import { useEffect, useState } from "react";

const STAGES = ["Original MRI", "Grad-CAM Heatmap", "U-Net Segmentation"];

export default function AnalysisSequence() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % STAGES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="analysis-seq">
      <div className="analysis-card">
        {STAGES.map((label, i) => (
          <div key={label} className={`stage ${i === index ? "active" : ""}`}>
            <div className="stage-image">
              <div className="mri-grid" />
              {i === 0 && <div className="mri-original">MRI_SLICE</div>}
              {i === 1 && <div className="mri-heatmap">HEATMAP</div>}
              {i === 2 && <div className="mri-seg">SEGMENTATION</div>}
            </div>
            <div className="stage-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="analysis-badges">
        <div className="badge">CNN</div>
        <div className="badge">EfficientNet</div>
        <div className="badge">ViT-B/16</div>
        <div className="badge">U-Net</div>
      </div>

      <style>{`
        .analysis-seq { display:flex; gap:18px; align-items:center }
        .analysis-card { width:460px; position:relative }
        .stage { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transform: translateY(8px); transition: opacity 420ms ease, transform 420ms ease; }
        .stage.active { opacity:1; transform: translateY(0); position:relative }
        .stage-image { width:100%; height:360px; border-radius:12px; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#021625,#00131a); box-shadow: 0 10px 30px rgba(2,6,23,0.6); border:1px solid rgba(125,211,252,0.04) }
        .mri-grid { position:absolute; inset:0; background-image: linear-gradient(transparent 49%, rgba(125,211,252,0.02) 50%), linear-gradient(90deg, transparent 49%, rgba(125,211,252,0.02) 50%); background-size: 36px 36px; opacity:0.9 }
        .mri-original, .mri-heatmap, .mri-seg { font-weight:700; color: rgba(255,255,255,0.9); font-size:14px; padding:12px 18px; border-radius:8px; backdrop-filter: blur(6px) }
        .mri-original { background: linear-gradient(90deg, rgba(10,20,30,0.6), rgba(6,12,20,0.35)); }
        .mri-heatmap { background: radial-gradient(circle at 30% 35%, rgba(255,90,110,0.95), rgba(255,90,110,0.4) 12%, transparent 25%), linear-gradient(90deg, rgba(0,0,0,0.2), transparent); color:#fff }
        .mri-seg { background: linear-gradient(90deg,#052a3b,#03313e); color:#bff1ff }
        .stage-label { margin-top:12px; font-size:13px; color:var(--text-secondary) }

        .analysis-badges { display:flex; flex-direction:column; gap:10px }
        .badge { padding:10px 14px; border-radius:10px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color:var(--accent-teal); font-weight:700; box-shadow: 0 6px 18px rgba(2,6,23,0.45); min-width:120px; text-align:center }
        @media (max-width:860px) { .analysis-seq { flex-direction:column } .analysis-badges { flex-direction:row; gap:8px } .analysis-card{width:100%} .stage-image{height:260px} }
      `}</style>
    </div>
  );
}
