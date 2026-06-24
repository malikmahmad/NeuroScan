import { Suspense, lazy } from "react";

const Hero3D = lazy(() => import("./Hero3D"));

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__text">
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
          <a href="#tool" className="hero__btn hero__btn--primary">Try the Tool</a>
          <a href="#how-it-works" className="hero__btn hero__btn--secondary">How it Works</a>
        </div>
      </div>

      <Suspense fallback={<div className="hero-3d hero-3d--loading" />}>
        <Hero3D />
      </Suspense>

      <style>{`
        .hero {
          max-width: 1100px; margin: 0 auto;
          padding: var(--space-9) var(--space-5) var(--space-7);
          display: grid; grid-template-columns: 1.1fr 0.9fr;
          align-items: center; gap: var(--space-6);
        }
        .hero__eyebrow {
          display: inline-block; font-size: 12px; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--accent-teal);
          background: var(--accent-teal-bg); padding: 5px 12px;
          border-radius: 999px; margin-bottom: var(--space-4);
        }
        .hero h1 { font-size: 38px; line-height: 1.15; color: var(--text-primary); }
        .hero__accent { color: var(--accent-teal); }
        .hero__subhead {
          margin: var(--space-4) 0 0; font-size: 15.5px; line-height: 1.6;
          color: var(--text-secondary); max-width: 480px;
        }
        .hero__actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap; }
        .hero__btn {
          padding: 12px 24px; border-radius: 999px; font-size: 14.5px; font-weight: 600;
          transition: transform 0.15s, filter 0.15s, border-color 0.15s;
        }
        .hero__btn--primary { background: var(--accent-teal); color: var(--bg-canvas); }
        .hero__btn--primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .hero__btn--secondary { border: 1px solid var(--border-strong); color: var(--text-primary); }
        .hero__btn--secondary:hover { border-color: var(--accent-teal); color: var(--accent-teal); transform: translateY(-2px); }
        .hero-3d { width: 100%; height: 360px; }
        .hero-3d--loading { border-radius: var(--radius-lg); background: radial-gradient(circle, var(--accent-teal-bg), transparent 70%); }
        @media (max-width: 860px) {
          .hero { grid-template-columns: 1fr; padding-top: var(--space-7); }
          .hero h1 { font-size: 30px; }
          .hero-3d { height: 280px; order: -1; }
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
