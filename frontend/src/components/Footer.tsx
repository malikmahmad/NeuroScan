const NAV_LINKS = [
  { href: "#how-it-works", label: "How it Works" },
  { href: "#tool",         label: "Try the Tool" },
  { href: "#about",        label: "About" },
  { href: "#faq",          label: "FAQ" },
  { href: "#privacy",      label: "Privacy Policy" },
];

const SOCIALS = [
  { name: "LinkedIn",  href: "https://www.linkedin.com/in/malik-muhammad-ahmad-788b62338/" },
  { name: "GitHub",    href: "https://github.com/malikmahmad" },
  { name: "Instagram", href: "https://www.instagram.com/priv_ahmad007/" },
  { name: "X",         href: "https://x.com/MalikMuhammox1" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">NeuroScan</span>
          <p>Comparative deep learning analysis for brain tumor MRI.</p>
        </div>
        <nav className="site-footer__links" aria-label="Footer navigation">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="site-footer__socials">
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">{s.name}</a>
          ))}
        </div>
      </div>
      <div className="site-footer__disclaimer">
        Research and educational tool only · Not a certified diagnostic device ·
        Built by Malik Muhammad Ahmad
      </div>
      <style>{`
        .site-footer { border-top: 1px solid var(--border-subtle); padding: var(--space-7) var(--space-5) var(--space-5); }
        .site-footer__inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap; padding-bottom: var(--space-5); }
        .site-footer__logo { font-family: var(--font-display); font-weight: 600; font-size: 16px; color: var(--accent-teal); }
        .site-footer__brand p { font-size: 12.5px; color: var(--text-tertiary); margin: var(--space-2) 0 0; max-width: 240px; }
        .site-footer__links, .site-footer__socials { display: flex; flex-direction: column; gap: var(--space-2); }
        .site-footer__links a, .site-footer__socials a { font-size: 13px; color: var(--text-secondary); transition: color 0.15s; }
        .site-footer__links a:hover, .site-footer__socials a:hover { color: var(--accent-teal); }
        .site-footer__disclaimer { max-width: 1100px; margin: 0 auto; padding-top: var(--space-5); border-top: 1px solid var(--border-subtle); font-size: 11.5px; color: var(--text-tertiary); text-align: center; line-height: 1.7; }
        @media (max-width: 600px) { .site-footer__inner { flex-direction: column; gap: var(--space-5); } }
      `}</style>
    </footer>
  );
}
