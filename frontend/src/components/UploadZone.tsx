import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelected, disabled }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const select = useCallback(
    (file: File) => { setFileName(file.name); onFileSelected(file); },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) select(file);
    },
    [select]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) select(file);
  };

  return (
    <div
      className={`upload-zone ${isDragOver ? "upload-zone--drag" : ""} ${disabled ? "upload-zone--disabled" : ""} ${fileName && !disabled ? "upload-zone--loaded" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={disabled ? undefined : handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button" tabIndex={0} aria-label="Upload an MRI scan"
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click(); }}
    >
      <div className="upload-zone__sweep" aria-hidden="true" />
      <div className="upload-zone__glow"  aria-hidden="true" />
      <div className="upload-zone__content">
        {disabled ? (
          <div className="upload-zone__spinner-wrap">
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : (
          <div className={`upload-zone__icon-wrap ${isDragOver ? "upload-zone__icon-wrap--drag" : ""}`}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 14h28M14 4v10M26 4v10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="25" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 21v8M16 25h8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        )}
        <p className="upload-zone__title">
          {disabled ? "Analyzing…" : fileName ? fileName : "Drop an MRI slice here"}
        </p>
        <p className="upload-zone__subtitle">
          {disabled
            ? "Running inference on the scan"
            : "PNG, JPEG, or TIFF — axial T1/T2/FLAIR slice"}
        </p>
        {!disabled && (
          <span className="upload-zone__cta">
            {isDragOver ? "Release to upload" : "Browse files"}
          </span>
        )}
      </div>

      <input
        ref={inputRef} type="file"
        accept="image/png,image/jpeg,image/tiff"
        onChange={handleFileInput}
        style={{ display: "none" }} disabled={disabled}
      />

      <style>{`
        .upload-zone {
          position: relative; overflow: hidden;
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius-lg);
          background: var(--bg-panel);
          padding: var(--space-7) var(--space-5);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: border-color 0.25s, background 0.25s, transform 0.2s, box-shadow 0.25s;
          min-height: 180px;
        }
        .upload-zone:hover,
        .upload-zone--drag {
          border-color: var(--accent-teal);
          background: var(--bg-panel-raised);
          box-shadow: 0 0 0 4px rgba(var(--accent-teal-rgb), 0.08), inset 0 0 40px rgba(var(--accent-teal-rgb), 0.03);
        }
        .upload-zone--drag {
          transform: scale(1.01);
          box-shadow: 0 0 0 6px rgba(var(--accent-teal-rgb), 0.12), inset 0 0 60px rgba(var(--accent-teal-rgb), 0.05);
        }
        .upload-zone--loaded {
          border-style: solid;
          border-color: rgba(var(--accent-teal-rgb), 0.4);
        }
        .upload-zone:active:not(.upload-zone--disabled) { transform: scale(0.997); }
        .upload-zone--disabled { cursor: default; border-style: solid; animation: borderPulse 2s ease-in-out infinite; }

        .upload-zone__glow {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--accent-teal-rgb), 0.06), transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          pointer-events: none; opacity: 0; transition: opacity 0.3s;
        }
        .upload-zone:hover .upload-zone__glow,
        .upload-zone--drag .upload-zone__glow { opacity: 1; }

        .upload-zone__content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: var(--space-2); color: var(--text-secondary);
          text-align: center; max-width: 100%;
        }
        .upload-zone__icon-wrap {
          color: var(--text-tertiary); margin-bottom: var(--space-1);
          transition: color 0.2s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .upload-zone:hover .upload-zone__icon-wrap { color: var(--accent-teal); transform: translateY(-3px) scale(1.08); }
        .upload-zone__icon-wrap--drag { color: var(--accent-teal) !important; transform: translateY(-5px) scale(1.15) !important; }
        .upload-zone__spinner-wrap { animation: float 2s ease-in-out infinite; }

        .upload-zone__title {
          font-family: var(--font-display); font-size: 15px; font-weight: 600;
          color: var(--text-primary); margin: 0;
          max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .upload-zone__subtitle { font-size: 12.5px; color: var(--text-tertiary); margin: 0; }
        .upload-zone__cta {
          margin-top: var(--space-2); font-size: 12px; color: var(--accent-teal);
          border: 1px solid rgba(0, 212, 255, 0.25); padding: 4px 14px;
          border-radius: 999px;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .upload-zone:hover .upload-zone__cta {
          background: rgba(var(--accent-teal-rgb), 0.1);
          border-color: rgba(var(--accent-teal-rgb), 0.5);
          transform: translateY(-1px);
        }
        .upload-zone__sweep {
          position: absolute; top: 0; left: -30%; width: 30%; height: 100%;
          background: linear-gradient(
            90deg, transparent,
            rgba(0, 212, 255, 0.05) 40%, rgba(0, 212, 255, 0.10) 50%,
            rgba(0, 212, 255, 0.05) 60%, transparent
          );
          animation: sweep 5s ease-in-out infinite;
        }
        @keyframes sweep { 0% { left: -30%; } 50% { left: 100%; } 100% { left: 100%; } }
        @media (max-width: 480px) {
          .upload-zone { padding: var(--space-5) var(--space-3); min-height: 150px; }
          .upload-zone__title { max-width: 220px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
