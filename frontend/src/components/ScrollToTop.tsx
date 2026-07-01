import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      setVisible(scrolled > 400);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const circumference = 2 * Math.PI * 18;

  return (
    <>
      <button
        className={`scroll-top ${visible ? "scroll-top--visible" : ""}`}
        onClick={scrollUp}
        aria-label="Back to top"
        title="Back to top"
      >
        <svg className="scroll-top__ring" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke="var(--accent-teal)" strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.15s ease" }}
          />
        </svg>
        <svg className="scroll-top__arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <style>{`
        .scroll-top {
          position: fixed;
          bottom: var(--space-5);
          right: var(--space-5);
          z-index: 200;
          width: 44px; height: 44px;
          border-radius: 50%;
          background: var(--bg-panel);
          border: none;
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: translateY(16px) scale(0.85);
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.16,1,0.3,1),
                      transform 0.3s cubic-bezier(0.16,1,0.3,1),
                      color 0.15s, background 0.15s;
          box-shadow: var(--shadow-soft);
          padding: 0;
        }
        .scroll-top--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .scroll-top:hover {
          color: var(--accent-teal);
          background: var(--accent-teal-bg);
          transform: translateY(-2px) scale(1.05) !important;
          box-shadow: 0 8px 24px rgba(var(--accent-teal-rgb), 0.25);
        }
        .scroll-top:active { transform: translateY(0) scale(0.96) !important; }
        .scroll-top__ring {
          position: absolute; inset: 0;
          width: 44px; height: 44px;
        }
        .scroll-top__arrow { position: relative; z-index: 1; }
      `}</style>
    </>
  );
}
