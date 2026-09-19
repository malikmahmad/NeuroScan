import { useEffect, useRef } from "react";

interface Particle {
  progress: number;
  speed: number;
  lineIndex: number;
  size: number;
  opacity: number;
}

// 7 model nodes arranged in a circle around center
const CX = 320, CY = 200, R = 155;
const MODEL_NODES = [
  { label: "CNN",          sub: "78.12%", color: "#4facfe" },
  { label: "EfficientNet", sub: "91.56%", color: "#00d4ff" },
  { label: "ResNet-50",    sub: "95.44%", color: "#34d399" },
  { label: "DenseNet",     sub: "93.87%", color: "#fbbf24" },
  { label: "MobileNet",    sub: "94.13%", color: "#c084fc" },
  { label: "Swin-T",       sub: "93.94%", color: "#a78bfa" },
  { label: "ViT-B/16",     sub: "93.87%", color: "#f472b6" },
];

const OUTER_NODES = MODEL_NODES.map((m, i) => {
  const angle = (i / MODEL_NODES.length) * Math.PI * 2 - Math.PI / 2;
  return { ...m, cx: CX + R * Math.cos(angle), cy: CY + R * Math.sin(angle), r: 30 };
});

const CENTER_NODE = { cx: CX, cy: CY, label: "AI CONSENSUS", sub: "95.44%", color: "#00d4ff", r: 44 };

const ALL_NODES = [...OUTER_NODES, CENTER_NODE];

const LINES = OUTER_NODES.map((n) => ({
  x1: n.cx, y1: n.cy, x2: CX, y2: CY, color: n.color,
}));

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ComparativeNetworkPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    for (let line = 0; line < LINES.length; line++) {
      for (let step = 0; step < 5; step++) {
        particles.push({
          progress:  Math.random(),
          speed:     0.0016 + Math.random() * 0.0012,
          lineIndex: line,
          size:      1.2 + Math.random() * 1.2,
          opacity:   0.45 + Math.random() * 0.45,
        });
      }
    }

    const W = 640, H = 430;
    canvas.width  = W * 2;
    canvas.height = H * 2;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    const tick = () => {
      tRef.current += 0.008;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Draw beams
      LINES.forEach((line, li) => {
        const grad = ctx.createLinearGradient(line.x1, line.y1, line.x2, line.y2);
        grad.addColorStop(0,   `${line.color}55`);
        grad.addColorStop(0.5, `${line.color}99`);
        grad.addColorStop(1,   `${CENTER_NODE.color}88`);
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.0;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = line.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        void li;
      });

      // Draw particles
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const line = LINES[p.lineIndex];
        const px   = lerp(line.x1, line.x2, p.progress);
        const py   = lerp(line.y1, line.y2, p.progress);
        const fade = Math.sin(p.progress * Math.PI);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
        glow.addColorStop(0, `${line.color}ff`);
        glow.addColorStop(1, `${line.color}00`);
        ctx.beginPath();
        ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle   = glow;
        ctx.globalAlpha = fade * p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      ALL_NODES.forEach((node) => {
        const isCenter = node.r > 40;
        const pulse    = 1 + (isCenter ? 0.04 : 0.06) * Math.sin(t * 1.5 + node.cx * 0.01);
        const radius   = node.r * pulse;
        ctx.save();

        // Outer glow
        const outerGlow = ctx.createRadialGradient(node.cx, node.cy, radius * 0.2, node.cx, node.cy, radius * 2.0);
        outerGlow.addColorStop(0, `${node.color}20`);
        outerGlow.addColorStop(1, `${node.color}00`);
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Fill
        const fill = ctx.createRadialGradient(node.cx - radius * 0.3, node.cy - radius * 0.3, radius * 0.08, node.cx, node.cy, radius);
        fill.addColorStop(0, `${node.color}30`);
        fill.addColorStop(1, `${node.color}05`);
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        // Ring
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${node.color}cc`;
        ctx.lineWidth   = isCenter ? 1.8 : 1.1;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = node.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (isCenter) {
          const rp = 1 + 0.08 * Math.sin(t * 1.8);
          ctx.beginPath();
          ctx.arc(node.cx, node.cy, radius * 1.22 * rp, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}44`;
          ctx.lineWidth   = 0.7;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(node.cx, node.cy, radius * 1.5 * rp, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}22`;
          ctx.lineWidth   = 0.4;
          ctx.stroke();
        }
        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="cnp-wrap" aria-hidden="true">
      <div className="cnp-inner">
        <canvas ref={canvasRef} className="cnp-canvas" />
        <svg className="cnp-svg" viewBox="0 0 640 430" preserveAspectRatio="xMidYMid meet">
          {ALL_NODES.map((node) => {
            const isCenter = node.r > 40;
            return (
              <g key={node.label}>
                <text x={node.cx} y={node.cy - 5} textAnchor="middle" dominantBaseline="middle"
                  className={`cnp-label ${isCenter ? "cnp-label--center" : ""}`}>
                  {node.label}
                </text>
                <text x={node.cx} y={node.cy + 11} textAnchor="middle" dominantBaseline="middle"
                  className={`cnp-sub ${isCenter ? "cnp-sub--center" : ""}`}>
                  {node.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <style>{`
        .cnp-wrap { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:12px 0 8px; }
        .cnp-inner { position:relative; width:min(100%,580px); aspect-ratio:640/430; margin-inline:auto; border-radius:24px; background:transparent; overflow:hidden; }
        .cnp-canvas { position:absolute; inset:0; width:100%; height:100%; }
        .cnp-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
        .cnp-label { font-family:var(--font-display); font-size:9.5px; font-weight:600; fill:#e0f4ff; letter-spacing:0.04em; }
        .cnp-label--center { font-size:10px; fill:#ffffff; letter-spacing:0.08em; text-transform:uppercase; }
        .cnp-sub { font-family:var(--font-mono); font-size:9px; font-weight:500; fill:rgba(0,212,255,0.84); }
        .cnp-sub--center { font-size:11px; font-weight:700; fill:#00d4ff; }
        [data-theme="light"] .cnp-label { fill:#0d1a26; }
        [data-theme="light"] .cnp-label--center { fill:#0d1a26; }
        [data-theme="light"] .cnp-sub { fill:rgba(0,130,160,0.9); }
        [data-theme="light"] .cnp-sub--center { fill:#0099bb; }
        @media (max-width:860px) { .cnp-wrap { padding:0; } .cnp-inner { max-width:100%; } }
      `}</style>
    </div>
  );
}

