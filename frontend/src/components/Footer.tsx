const NAV_LINKS = [
  { href: "#how-it-works", label: "How it Works" },
  { href: "#tool",         label: "Try the Tool" },
  { href: "#about",        label: "About" },
  { href: "#faq",          label: "FAQ" },
  { href: "#privacy",      label: "Privacy Policy" },
];

const SOCIALS = [
  {
    name: "LinkedIn", href: "https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" /></svg>),
  },
  {
    name: "GitHub", href: "https://github.com/malikmahmad",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.94.83.09-.65.34-1.08.62-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.35 4.69-4.58 4.93.36.31.67.91.67 1.85v2.74c0 .26.18.58.69.48A10 10 0 0012 2z" /></svg>),
  },
  {
    name: "Instagram", href: "https://www.instagram.com/priv_ahmad007/",
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" /></svg>),
  },
  {
    name: "X", href: "https://x.com/MalikMuhammox1",
    icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-7-6.2 7H1.3l8.1-9.3L1 2h7l4.9 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" /></svg>),
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">

        {/* Brand */}
        <div className="site-footer__brand">
          <span className="site-footer__logo">NeuroScan</span>
          <p>Comparative deep learning for brain tumor MRI — classification, segmentation, and explainability.</p>
        </div>

        {/* Nav */}
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <span className="site-footer__col-title">Pages</span>
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>

        {/* Author */}
        <div className="site-footer__author">
          <span className="site-footer__col-title">Built by</span>
          <span className="site-footer__name">Malik Muhammad Ahmad</span>
          <p className="site-footer__role">Full-Stack Developer &amp; AI/ML Engineer</p>
          <div className="site-footer__socials">
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                 className="site-footer__social-link" aria-label={s.name} title={s.name}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Malik Muhammad Ahmad</span>
        <span className="site-footer__sep">·</span>
        <span>Research and educational tool only</span>
        <span className="site-footer__sep">·</span>
        <span>Not a certified diagnostic device</span>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border-subtle);
          padding: var(--space-8) var(--space-5) var(--space-5);
        }
        .site-footer__inner {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1.2fr;
          gap: var(--space-8); padding-bottom: var(--space-7);
        }
        .site-footer__logo {
          font-family: var(--font-display); font-weight: 700;
          font-size: 18px; color: var(--accent-teal);
          display: block; margin-bottom: var(--space-3);
        }
        .site-footer__brand p {
          font-size: 13px; color: var(--text-tertiary);
          line-height: 1.6; margin: 0; max-width: 280px;
        }
        .site-footer__col-title {
          display: block; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-tertiary);
          margin-bottom: var(--space-4);
        }
        .site-footer__nav { display: flex; flex-direction: column; gap: var(--space-2); }
        .site-footer__nav a {
          font-size: 13.5px; color: var(--text-secondary);
          transition: color 0.15s;
        }
        .site-footer__nav a:hover { color: var(--accent-teal); }
        .site-footer__name {
          font-family: var(--font-display); font-size: 16px;
          font-weight: 600; color: var(--text-primary); display: block;
          margin-bottom: 4px;
        }
        .site-footer__role {
          font-size: 12.5px; color: var(--text-tertiary);
          margin: 0 0 var(--space-4);
        }
        .site-footer__socials { display: flex; gap: var(--space-2); }
        .site-footer__social-link {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--bg-panel-raised); border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .site-footer__social-link:hover {
          color: var(--accent-teal); border-color: rgba(var(--accent-teal-rgb), 0.4);
          background: var(--accent-teal-bg);
        }
        .site-footer__bottom {
          max-width: 1100px; margin: 0 auto;
          padding-top: var(--space-5); border-top: 1px solid var(--border-subtle);
          font-size: 12px; color: var(--text-tertiary);
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        }
        .site-footer__sep { opacity: 0.4; }
        @media (max-width: 760px) {
          .site-footer__inner { grid-template-columns: 1fr 1fr; gap: var(--space-6); }
          .site-footer__brand { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .site-footer__inner { grid-template-columns: 1fr; }
          .site-footer__bottom { justify-content: center; text-align: center; }
        }
      `}</style>
    </footer>
  );
}
