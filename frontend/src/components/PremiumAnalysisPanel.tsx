import { useEffect, useState } from "react";

const STAGES = [
  { key: "original", label: "Original MRI" },
  { key: "gradcam", label: "Grad-CAM Explainability" },
  { key: "seg", label: "U-Net Segmentation" },
];

export default function PremiumAnalysisPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % STAGES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="premium-panel" aria-hidden>
      <div className="panel-wrap">
        <div className="glass-card">
          <div className="card-content">
            <div className="visual-area">
              {STAGES.map((s, i) => (
                <figure key={s.key} className={`stage ${i === index ? "active" : ""}`}>
                  <div className="image-shell">
                    <svg className="mri-svg" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#bfc9cf" stopOpacity="1" />
                          <stop offset="100%" stopColor="#7a8489" stopOpacity="1" />
                        </linearGradient>
                        <radialGradient id={`heat-${s.key}`} cx="60%" cy="40%" r="40%">
                          <stop offset="0%" stopColor="#ff6a6a" stopOpacity="0.95" />
                          <stop offset="40%" stopColor="#ff8a4d" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#ff8a4d" stopOpacity="0" />
                        </radialGradient>
                        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="8" />
                        </filter>
                      </defs>

                      {/* base grayscale MRI look using rects and subtle noise shapes */}
                      <rect x="0" y="0" width="100%" height="100%" fill={`url(#g-${s.key})`} />
                      <g opacity="0.06">
                        <rect x="20" y="20" width="360" height="280" fill="#000" />
                      </g>

                      {/* synthetic anatomical-like shapes (subtle) */}
                      <g fill="#0b1620" opacity="0.12">
                        <ellipse cx="200" cy="170" rx="120" ry="86" />
                        <ellipse cx="180" cy="150" rx="68" ry="42" />
                        <ellipse cx="235" cy="190" rx="36" ry="22" />
                      </g>

                      {/* scan lines overlay */}
                      <g className="scan-lines" opacity="0.06">
                        {[...Array(30)].map((_, j) => (
                          <rect key={j} x="0" y={8 + j * 10} width="400" height="2" fill="#fff" />
                        ))}
                      </g>

                      {/* Grad-CAM heatmap overlay */}
                      {s.key === "gradcam" && (
                        <g className="heatmap" style={{ mixBlendMode: "screen" }}>
                          <rect x="0" y="0" width="100%" height="100%" fill={`url(#heat-${s.key})`} filter="url(#soft)" opacity="0.85" />
                        </g>
                      )}

                      {/* segmentation mask */}
                      {s.key === "seg" && (
                        <g className="segmentation">
                          <path d="M120,160 C140,110 220,110 260,150 C300,190 260,240 200,238 C140,236 100,210 120,160 Z" fill="#00d1ff" opacity="0.12" />
                          <path d="M120,160 C140,110 220,110 260,150 C300,190 260,240 200,238 C140,236 100,210 120,160 Z" fill="none" stroke="#00d1ff" strokeWidth="2" strokeOpacity="0.9" />
                        </g>
                      )}

                    </svg>
                  </div>
                  <figcaption className="stage-title">{s.label}</figcaption>
                </figure>
              ))}
            </div>

            <div className="pipeline">
              {STAGES.map((s, i) => (
                <div key={s.key} className={`pipe-item ${i === index ? "active" : ""}`}>
                  <span className="dot" />
                  <span className="pipe-label">{s.label.split(" ")[0]}</span>
                  {i < STAGES.length - 1 && <span className="arrow">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* floating badges */}
        <div className="badges">
          <div className="badge b1">CNN</div>
          <div className="badge b2">EfficientNet-B0</div>
          <div className="badge b3">ViT-B/16</div>
          <div className="badge b4">U-Net</div>
        </div>
      </div>

      <style>{`
        .premium-panel { display:flex; justify-content:center; align-items:center; width:100%; }
        .panel-wrap { position:relative; width:100%; max-width:760px; }
        .glass-card { border-radius:18px; padding:22px; backdrop-filter: blur(10px) saturate(120%); background: linear-gradient(180deg, rgba(8,14,20,0.56), rgba(5,10,14,0.4)); border: 1px solid rgba(125,211,252,0.06); box-shadow: 0 20px 60px rgba(2,6,23,0.55); }
        .card-content { display:flex; gap:18px; align-items:flex-start; }
        .visual-area { position:relative; width:460px; }
        .stage { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:12px; opacity:0; transform: translateY(12px) scale(0.995); transition: opacity 480ms cubic-bezier(.2,.9,.3,1), transform 480ms cubic-bezier(.2,.9,.3,1); }
        .stage.active { opacity:1; transform: translateY(0) scale(1); position:relative }
        .image-shell { width:100%; height:320px; border-radius:12px; overflow:hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02), 0 20px 40px rgba(2,6,23,0.6); border: 1px solid rgba(255,255,255,0.03); }
        .mri-svg { width:100%; height:100%; display:block }
        .scan-lines { animation: scan 3.6s linear infinite; }
        @keyframes scan { 0% { transform: translateY(0) } 100% { transform: translateY(-40px) } }

        /* heatmap pulse */
        .heatmap { animation: heatPulse 2.6s ease-in-out infinite; }
        @keyframes heatPulse { 0% { opacity:0.6 } 50% { opacity:0.9 } 100% { opacity:0.6 } }

        /* segmentation contour subtle glow */
        .segmentation path { filter: drop-shadow(0 6px 14px rgba(0,209,255,0.06)); }

        .stage-title { margin-top:10px; font-size:14px; color:var(--text-secondary) }

        .pipeline { display:flex; gap:12px; align-items:center; margin-top:14px }
        .pipe-item { display:flex; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px; opacity:0.8 }
        .pipe-item .dot { width:10px; height:10px; border-radius:50%; background:rgba(125,211,252,0.12); box-shadow: 0 0 12px rgba(125,211,252,0.04); }
        .pipe-item.active { color:var(--accent-teal); }
        .pipe-item.active .dot { background:linear-gradient(90deg,var(--accent-teal),var(--accent-blue)); box-shadow: 0 6px 24px rgba(13,148,136,0.18); }
        .pipe-item .arrow { margin-left:6px; opacity:0.6 }

        .badges { position:absolute; inset:0; pointer-events:none }
        .badge { position:absolute; padding:8px 12px; border-radius:999px; background: linear-gradient(180deg, rgba(10,20,30,0.6), rgba(6,10,14,0.4)); color:var(--accent-teal); font-weight:700; font-size:13px; border:1px solid rgba(125,211,252,0.06); box-shadow: 0 8px 26px rgba(2,6,23,0.55); opacity:0.95 }
        .b1 { left:-28px; top:18px; transform: translateY(0); animation: float1 6s ease-in-out infinite; }
        .b2 { right:-12px; top:36px; transform: translateY(0); animation: float2 5.5s ease-in-out infinite; }
        .b3 { left: -10px; bottom:34px; transform: translateY(0); animation: float3 7s ease-in-out infinite; }
        .b4 { right: -30px; bottom:18px; transform: translateY(0); animation: float4 5.8s ease-in-out infinite; }

        @keyframes float1 { 0%{ transform: translateY(0) }50%{ transform: translateY(-10px) }100%{ transform: translateY(0) } }
        @keyframes float2 { 0%{ transform: translateY(0) }50%{ transform: translateY(8px) }100%{ transform: translateY(0) } }
        @keyframes float3 { 0%{ transform: translateY(0) }50%{ transform: translateY(-6px) }100%{ transform: translateY(0) } }
        @keyframes float4 { 0%{ transform: translateY(0) }50%{ transform: translateY(10px) }100%{ transform: translateY(0) } }

        /* responsiveness */
        @media (max-width: 860px) {
          .panel-wrap { max-width:100%; padding:0 6px }
          .card-content { flex-direction:column; align-items:center }
          .visual-area { width:100% }
          .badges { display:flex; position:static; gap:8px; margin-top:14px }
          .badge { position:static }
        }
      `}</style>
    </div>
  );
}
