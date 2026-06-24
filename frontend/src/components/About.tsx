import { useRef, type MouseEvent } from "react";

interface Social { name: string; href: string; color: string; icon: JSX.Element; }

const SOCIALS: Social[] = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/", color: "#0A66C2",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" /></svg>) },
  { name: "GitHub", href: "https://github.com/malikmahmad", color: "#8b6fc9",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.94.83.09-.65.34-1.08.62-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.35 4.69-4.58 4.93.36.31.67.91.67 1.85v2.74c0 .26.18.58.69.48A10 10 0 0012 2z" /></svg>) },
  { name: "Instagram", href: "https://www.instagram.com/priv_ahmad007/", color: "#d6409f",
    icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" /></svg>) },
  { name: "X", href: "https://x.com/MalikMuhammox1", color: "#6b7785",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.3l8.1-9.3L1 2h7l4.9 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" /></svg>) },
];

function SocialIcon({ social }: { social: Social }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px) scale(1.12)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = "translate(0,0) scale(1)"; };

  return (
    <a ref={ref} href={social.href} target="_blank" rel="noopener noreferrer"
       aria-label={social.name} className="social-icon"
       style={{ "--hover-color": social.color } as React.CSSProperties}
       onMouseMove={onMove} onMouseLeave={onLeave}>
      {social.icon}
    </a>
  );
}

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about__card">
        <div className="about__avatar">MA</div>
        <div className="about__info">
          <span className="section-eyebrow">About the Builder</span>
          <h2>Malik Muhammad Ahmad</h2>
          <p className="about__role">Full-Stack Developer &amp; AI/ML Engineer</p>
          <p className="about__bio">
            I built NeuroScan to find out, with real numbers rather than assumptions, how a
            from-scratch CNN, a transfer-learned EfficientNet-B0, and a Vision Transformer actually
            compare on the same brain tumor MRI dataset — and to make every prediction explainable
            instead of a black box. The classification and segmentation pipelines, the FastAPI
            backend, and this React/TypeScript interface are all part of one end-to-end system,
            written up as an IEEE-format comparative study.
          </p>
          <div className="about__socials">
            {SOCIALS.map((s) => <SocialIcon social={s} key={s.name} />)}
          </div>
        </div>
      </div>
      <style>{`
        .about { max-width: 1100px; margin: 0 auto; padding: var(--space-8) var(--space-5); }
        .about__card {
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl); padding: var(--space-7);
          display: flex; gap: var(--space-6); align-items: flex-start;
        }
        .about__avatar {
          width: 76px; height: 76px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-teal), var(--accent-blue));
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 700; font-size: 24px;
          color: var(--bg-canvas); flex-shrink: 0;
        }
        .about__info h2 { font-size: 24px; margin: var(--space-2) 0 2px; color: var(--text-primary); }
        .about__role { font-size: 13.5px; color: var(--accent-teal); margin: 0 0 var(--space-4); font-weight: 500; }
        .about__bio { font-size: 14.5px; line-height: 1.65; color: var(--text-secondary); margin: 0 0 var(--space-5); max-width: 640px; }
        .about__socials { display: flex; gap: var(--space-3); }
        .social-icon {
          width: 42px; height: 42px; border-radius: 50%;
          background: var(--bg-panel-raised); border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center; color: var(--text-secondary);
          transition: transform 0.12s ease-out, color 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .social-icon:hover { color: var(--hover-color); border-color: var(--hover-color); box-shadow: 0 0 18px -4px var(--hover-color); }
        @media (max-width: 640px) { .about__card { flex-direction: column; padding: var(--space-5); } }
      `}</style>
    </section>
  );
}
