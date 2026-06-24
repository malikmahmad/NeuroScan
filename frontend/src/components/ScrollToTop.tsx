import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <button
        className={`scroll-top ${visible ? "scroll-top--visible" : ""}`}
        onClick={scrollUp}
        aria-label="Back to top"
        title="Back to top"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <style>{`
        .scroll-top {
          position: fixed;
          bottom: var(--space-5);
          right: var(--space-5);
          z-index: 200;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--bg-panel);
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transform: translateY(12px);
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease,
                      border-color 0.15s ease, color 0.15s ease,
                      background 0.15s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .scroll-top--visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .scroll-top:hover {
          border-color: var(--accent-teal);
          color: var(--accent-teal);
          background: var(--accent-teal-bg);
        }
        .scroll-top:active {
          transform: translateY(2px);
        }
      `}</style>
    </>
  );
}
