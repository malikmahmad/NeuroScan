import { Suspense, lazy } from "react";
import { useInView } from "../hooks/useInView";

const Hero3D = lazy(() => import("./Hero3D"));

export default function Hero() {
  const { ref: textRef, inView: textVisible } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const { ref: visualRef, inView: visualVisible } = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="top" className="hero">
      <div
        ref={textRef}
        className={`hero__text reveal-left ${textVisible ? "is-visible" : ""}`}
      >
        <span className="hero__eyebrow">Comparative Deep Learning · Medical Imaging</span>
        <h1>
          See what three different<br />
          neural architectures<br />
          <span className="hero__accent">see in a brain scan.</span>
        </h1>
        <p className="hero__subhead">
          NeuroScan classifies brain tumor MRI scans with a CNN, EfficientNet-B0, and ViT-B/16
          side by side, segments the tumor with U-Net, and explains its reasoning with
          Grad-CAM and Attention Rollout.
        </p>
        <div className="hero__actions">
          <a href="#tool" className="hero__btn hero__btn--primary">Run Analysis</a>
          <a href="#how-it-works" className="hero__btn hero__btn--secondary">How it Works</a>
        </div>
      </div>

      <div
        ref={visualRef}
        className={`reveal-right ${visualVisible ? "is-visible" : ""}`}
        style={{ transitionDelay: "0.15s" }}
      >
        <Suspense fallback={<div className="hero-3d hero-3d--loading" />}>
          <Hero3D />
        </Suspense>
      </div>

      <style>{`
        .hero {
          max-width: 1400px; margin: 0 auto;
          padding: var(--space-6) var(--space-5) var(--space-7);
          display: grid; grid-template-columns: 1.1fr 0.9fr;
          align-items: center; gap: var(--space-6);
        }
        .hero__eyebrow {
          display: inline-block; font-size: 12px; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--accent-teal);
          background: var(--accent-teal-bg); padding: 5px 12px;
          border-radius: 999px; margin-bottom: var(--space-4);
          animation: borderPulse 3s ease-in-out infinite;
        }
        .hero h1 { font-size: 38px; line-height: 1.15; color: var(--text-primary); }
        .hero__accent {
          color: var(--accent-teal);
          background: linear-gradient(90deg, var(--accent-teal), var(--accent-blue), var(--accent-teal));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .hero__subhead {
          margin: var(--space-4) 0 0; font-size: 15.5px; line-height: 1.6;
          color: var(--text-secondary); max-width: 580px;
        }
        .hero__actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap; }
        .hero__btn {
          padding: 12px 28px; border-radius: 999px; font-size: 14.5px; font-weight: 600;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.15s, box-shadow 0.2s, border-color 0.15s;
          position: relative; overflow: hidden;
        }
        .hero__btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.2s;
          border-radius: inherit;
        }
        .hero__btn:hover::after { opacity: 1; }
        .hero__btn--primary {
          background: var(--accent-teal); color: var(--bg-canvas);
          box-shadow: 0 4px 18px rgba(var(--accent-teal-rgb), 0.35);
          animation: pulseGlow 2.5s ease-in-out infinite;
        }
        .hero__btn--primary:hover {
          filter: brightness(1.1);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 28px rgba(var(--accent-teal-rgb), 0.5);
        }
        .hero__btn--secondary { border: 1px solid var(--border-strong); color: var(--text-primary); }
        .hero__btn--secondary:hover {
          border-color: var(--accent-teal); color: var(--accent-teal);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 6px 20px rgba(var(--accent-teal-rgb), 0.2);
        }
        .hero-3d { width: 100%; height: 460px; }
        .hero-3d--loading { border-radius: var(--radius-lg); background: radial-gradient(circle, var(--accent-teal-bg), transparent 70%); }
        @media (max-width: 860px) {
          .hero { grid-template-columns: 1fr; padding-top: var(--space-7); }
          .hero h1 { font-size: 30px; }
          .hero-3d { height: 320px; order: -1; }
          .hero__subhead { max-width: 100%; }
        }
        @media (max-width: 420px) {
          .hero h1 { font-size: 25px; }
          .hero__btn { flex: 1; text-align: center; }
        }
      `}</style>
    </section>
  );
}
