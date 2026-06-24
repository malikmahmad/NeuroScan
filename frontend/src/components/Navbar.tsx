import { useState } from "react";
import { useTheme } from "../ThemeContext";

const LINKS = [
  { href: "#how-it-works", label: "How it Works" },
  { href: "#features",     label: "Features" },
  { href: "#about",        label: "About" },
  { href: "#faq",          label: "FAQ" },
  { href: "#privacy",      label: "Privacy" },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className={`theme-toggle__thumb ${isLight ? "theme-toggle__thumb--light" : ""}`}>
        {isLight ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 9.5A6 6 0 1 1 6.5 2.5a5 5 0 0 0 7 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <style>{`
        .theme-toggle {
          width: 42px; height: 24px; border-radius: 999px;
          background: var(--bg-panel-raised); border: 1px solid var(--border-subtle);
          padding: 2px; display: flex; align-items: center; flex-shrink: 0;
        }
        .theme-toggle__thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--bg-canvas); color: var(--accent-teal);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .theme-toggle__thumb--light { transform: translateX(18px); color: var(--accent-amber); }
      `}</style>
    </button>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a href="#top" className="navbar__brand" onClick={close}>
          <svg className="navbar__logo-icon" width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.25)" strokeWidth="1"/>
            <path d="M32 13C26 13 20 17 18 23C16 27 16 29 17 32C15 34 14 37 16 40C17 43 20 45 23 45C24 47 26 49 29 49C30 49 31 49 32 49L32 13Z" fill="none" stroke="var(--accent-teal)" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M32 13C38 13 44 17 46 23C48 27 48 29 47 32C49 34 50 37 48 40C47 43 44 45 41 45C40 47 38 49 35 49C34 49 33 49 32 49L32 13Z" fill="none" stroke="var(--accent-teal)" strokeWidth="1.4" strokeLinejoin="round"/>
            <line x1="32" y1="13" x2="32" y2="49" stroke="var(--accent-teal)" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5"/>
            <path d="M24 21Q21 25 23 29" stroke="var(--accent-teal)" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
            <path d="M20 30Q19 34 22 37" stroke="var(--accent-teal)" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
            <path d="M40 21Q43 25 41 29" stroke="var(--accent-teal)" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
            <path d="M44 30Q45 34 42 37" stroke="var(--accent-teal)" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
            <line x1="13" y1="31" x2="51" y2="31" stroke="var(--accent-teal)" strokeWidth="1.2" opacity="0.9"/>
            <circle cx="32" cy="31" r="3" fill="#ff4d6d" opacity="0.9"/>
            <circle cx="32" cy="31" r="5.5" fill="none" stroke="#ff4d6d" strokeWidth="0.8" opacity="0.4"/>
          </svg>
          NeuroScan
        </a>
        <nav className="navbar__links navbar__links--desktop" aria-label="Primary">
          {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="navbar__actions navbar__actions--desktop">
          <ThemeToggle />
          <a href="#tool" className="navbar__cta">Run Analysis</a>
        </div>
        <button
          className="navbar__burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="navbar__mobile-menu navbar__mobile-menu--open">
          {LINKS.map((l) => <a key={l.href} href={l.href} onClick={close}>{l.label}</a>)}
          <a href="#tool" className="navbar__cta navbar__cta--mobile" onClick={close}>Run Analysis</a>
          <div className="navbar__mobile-theme">
            <span>Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 100;
          background: var(--header-blur-bg); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .navbar__inner {
          max-width: 1400px; margin: 0 auto; height: var(--nav-height);
          padding: 0 var(--space-5); display: flex; align-items: center;
          justify-content: space-between; gap: var(--space-5);
        }
        .navbar__brand {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-display); font-weight: 600; font-size: 18px;
          color: var(--text-primary); flex-shrink: 0;
        }
        .navbar__logo-icon {
          flex-shrink: 0;
          filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.4));
        }
        .navbar__links--desktop { display: flex; gap: var(--space-6); flex: 1; justify-content: center; }
        .navbar__links--desktop a { font-size: 14px; color: var(--text-secondary); transition: color 0.15s; }
        .navbar__links--desktop a:hover { color: var(--accent-teal); }
        .navbar__actions--desktop { display: flex; align-items: center; gap: var(--space-4); }
        .navbar__cta {
          background: var(--accent-teal); color: var(--bg-canvas);
          font-size: 13.5px; font-weight: 600; padding: 9px 18px;
          border-radius: 999px; white-space: nowrap;
          transition: filter 0.15s, transform 0.15s;
        }
        .navbar__cta:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .navbar__burger {
          display: none; flex-direction: column; justify-content: center;
          gap: 4px; width: 32px; height: 32px; background: transparent; border: none; flex-shrink: 0;
        }
        .navbar__burger span { height: 2px; background: var(--text-primary); border-radius: 1px; }
        .navbar__mobile-menu {
          display: flex; flex-direction: column; gap: var(--space-1);
          padding: var(--space-3) var(--space-5) var(--space-5);
          border-top: 1px solid var(--border-subtle);
        }
        .navbar__mobile-menu--open {
          animation: fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .navbar__mobile-menu a {
          padding: var(--space-3) 0; font-size: 15px;
          color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle);
        }
        .navbar__cta--mobile { text-align: center; margin-top: var(--space-3); border-bottom: none !important; }
        .navbar__mobile-theme { display: flex; align-items: center; justify-content: space-between; margin-top: var(--space-3); font-size: 14px; color: var(--text-secondary); }
        @media (max-width: 800px) {
          .navbar__links--desktop, .navbar__actions--desktop { display: none; }
          .navbar__burger { display: flex; }
          .navbar__inner { padding: 0 var(--space-4); }
        }
      `}</style>
    </header>
  );
}
