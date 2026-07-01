import { useEffect, useRef } from "react";

interface Particle {
  progress: number;
  speed: number;
  lineIndex: number;
  size: number;
  opacity: number;
}

const LINES = [
  { x1: 150, y1: 120, x2: 320, y2: 240, color: "#4facfe" },
  { x1: 320, y1: 80,  x2: 320, y2: 240, color: "#00d4ff" },
  { x1: 490, y1: 120, x2: 320, y2: 240, color: "#a78bfa" },
];

const NODES = [
  { cx: 150, cy: 120, label: "CNN", sub: "78.2%", color: "#4facfe", r: 34 },
  { cx: 320, cy: 80,  label: "EfficientNet", sub: "91.6%", color: "#00d4ff", r: 34 },
  { cx: 490, cy: 120, label: "ViT-B/16", sub: "94.7%", color: "#a78bfa", r: 34 },
  { cx: 320, cy: 240, label: "AI Consensus", sub: "94.7%", color: "#00d4ff", r: 48 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ComparativeNetworkPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    for (let line = 0; line < 3; line++) {
      for (let step = 0; step < 6; step++) {
        particles.push({
          progress: Math.random(),
          speed: 0.0018 + Math.random() * 0.0014,
          lineIndex: line,
          size: 1.4 + Math.random() * 1.4,
          opacity: 0.45 + Math.random() * 0.45,
        });
      }
    }

    const W = 640;
    const H = 360;
    canvas.width = W * 2;
    canvas.height = H * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    const COLORS = ["#4facfe", "#00d4ff", "#a78bfa"];

    const tick = () => {
      tRef.current += 0.008;
      const t = tRef.current;

      ctx.clearRect(0, 0, W, H);

      LINES.forEach((line, lineIndex) => {
        const gradient = ctx.createLinearGradient(line.x1, line.y1, line.x2, line.y2);
        gradient.addColorStop(0, `${COLORS[lineIndex]}55`);
        gradient.addColorStop(0.5, `${COLORS[lineIndex]}aa`);
        gradient.addColorStop(1, "#00d4ff88");

        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = COLORS[lineIndex];
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      particles.forEach((particle) => {
        particle.progress += particle.speed;
        if (particle.progress > 1) particle.progress = 0;

        const line = LINES[particle.lineIndex];
        const px = lerp(line.x1, line.x2, particle.progress);
        const py = lerp(line.y1, line.y2, particle.progress);
        const fade = Math.sin(particle.progress * Math.PI);

        const glow = ctx.createRadialGradient(px, py, 0, px, py, particle.size * 3);
        glow.addColorStop(0, `${COLORS[particle.lineIndex]}ff`);
        glow.addColorStop(1, `${COLORS[particle.lineIndex]}00`);

        ctx.beginPath();
        ctx.arc(px, py, particle.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.globalAlpha = fade * particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      NODES.forEach((node) => {
        const pulse = 1 + 0.05 * Math.sin(t * 1.5 + node.cx * 0.01);
        const radius = node.r * pulse;

        ctx.save();

        const outerGlow = ctx.createRadialGradient(node.cx, node.cy, radius * 0.25, node.cx, node.cy, radius * 2.2);
        outerGlow.addColorStop(0, `${node.color}22`);
        outerGlow.addColorStop(1, `${node.color}00`);
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        const fill = ctx.createRadialGradient(node.cx - radius * 0.3, node.cy - radius * 0.3, radius * 0.08, node.cx, node.cy, radius);
        fill.addColorStop(0, `${node.color}34`);
        fill.addColorStop(0.7, `${node.color}10`);
        fill.addColorStop(1, `${node.color}05`);
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${node.color}cc`;
        ctx.lineWidth = node.r === 48 ? 1.8 : 1.2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = node.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (node.r === 48) {
          const ringPulse = 1 + 0.08 * Math.sin(t * 1.8);
          ctx.beginPath();
          ctx.arc(node.cx, node.cy, radius * 1.24 * ringPulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}44`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.cx, node.cy, radius * 1.5 * ringPulse, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}22`;
          ctx.lineWidth = 0.5;
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

        <svg className="cnp-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
          {NODES.map((node) => (
            <g key={node.label}>
              <text
                x={node.cx}
                y={node.cy - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`cnp-label ${node.r === 48 ? "cnp-label--center" : ""}`}
              >
                {node.label}
              </text>
              <text
                x={node.cx}
                y={node.cy + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`cnp-sub ${node.r === 48 ? "cnp-sub--center" : ""}`}
              >
                {node.sub}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <style>{`
        .cnp-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0 8px;
        }
        .cnp-inner {
          position: relative;
          width: min(100%, 560px);
          aspect-ratio: 640 / 360;
          margin-inline: auto;
          border-radius: 24px;
          background: transparent;
          border: 0;
          box-shadow: none;
          overflow: hidden;
        }
        .cnp-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .cnp-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        .cnp-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          fill: #e0f4ff;
          letter-spacing: 0.04em;
        }
        .cnp-label--center {
          font-size: 11px;
          fill: #ffffff;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cnp-sub {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 500;
          fill: rgba(0, 212, 255, 0.84);
        }
        .cnp-sub--center {
          font-size: 12px;
          font-weight: 700;
          fill: #00d4ff;
        }
        @media (max-width: 860px) {
          .cnp-wrap { padding: 0; }
          .cnp-inner { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
