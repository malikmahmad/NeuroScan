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
    (file: File) => {
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
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
      className={`upload-zone ${isDragOver ? "upload-zone--drag" : ""} ${disabled ? "upload-zone--disabled" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={disabled ? undefined : handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload an MRI scan"
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
    >
      <div className="upload-zone__sweep" aria-hidden="true" />
      <div className="upload-zone__content">
        {disabled ? (
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        ) : (
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14h28M14 4v10M26 4v10" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="25" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 21v8M16 25h8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
        <p className="upload-zone__title">
          {disabled ? "Analyzing…" : fileName ? fileName : "Drop an MRI slice here"}
        </p>
        <p className="upload-zone__subtitle">
          {disabled ? "Running inference on the scan" : "PNG, JPEG, or TIFF — axial T1/T2/FLAIR slice"}
        </p>
        {!disabled && <span className="upload-zone__cta">Browse files</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/tiff"
        onChange={handleFileInput}
        style={{ display: "none" }}
        disabled={disabled}
      />

      <style>{`
        .upload-zone {
          position: relative;
          overflow: hidden;
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius-lg);
          background: var(--bg-panel);
          padding: var(--space-7) var(--space-5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          min-height: 180px;
        }
        .upload-zone:hover,
        .upload-zone--drag {
          border-color: var(--accent-teal);
          background: var(--bg-panel-raised);
        }
        .upload-zone:active { transform: scale(0.997); }
        .upload-zone--disabled { cursor: default; border-style: solid; }
        .upload-zone__content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          text-align: center;
          max-width: 100%;
        }
        .upload-zone__content svg { color: var(--text-tertiary); margin-bottom: var(--space-1); }
        .upload-zone__title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .upload-zone__subtitle { font-size: 12.5px; color: var(--text-tertiary); margin: 0; }
        .upload-zone__cta {
          margin-top: var(--space-2);
          font-size: 12px;
          color: var(--accent-teal);
          border: 1px solid rgba(61, 220, 151, 0.3);
          padding: 4px 12px;
          border-radius: 999px;
        }
        .upload-zone__sweep {
          position: absolute;
          top: 0;
          left: -30%;
          width: 30%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(61, 220, 151, 0.08) 40%,
            rgba(61, 220, 151, 0.16) 50%,
            rgba(61, 220, 151, 0.08) 60%,
            transparent
          );
          animation: sweep 5s ease-in-out infinite;
        }
        @keyframes sweep {
          0%   { left: -30%; }
          50%  { left: 100%; }
          100% { left: 100%; }
        }
        @media (max-width: 480px) {
          .upload-zone { padding: var(--space-5) var(--space-3); min-height: 150px; }
          .upload-zone__title { max-width: 220px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
