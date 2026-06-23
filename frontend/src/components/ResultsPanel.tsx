import { jsPDF } from "jspdf";
import type { ClassifyResult, SegmentResult, SegmentNote } from "../api";

interface Props {
  originalImageUrl: string;
  result: ClassifyResult;
  segmentation?: SegmentResult | SegmentNote;
}

function isSegmentResult(s: SegmentResult | SegmentNote | undefined): s is SegmentResult {
  return !!s && "tumor_detected" in s;
}

const CLASS_LABELS: Record<string, string> = {
  glioma: "Glioma",
  meningioma: "Meningioma",
  pituitary: "Pituitary Tumor",
  notumor: "No Tumor Detected",
};

const CLASS_DESCRIPTIONS: Record<string, string> = {
  glioma: "Arises from glial cells. Most common primary brain tumor.",
  meningioma: "Grows from the meninges. Usually benign, slow-growing.",
  pituitary: "Develops in the pituitary gland. Often treatable.",
  notumor: "No malignant or benign tumor detected in this slice.",
};

const MODEL_LABELS: Record<string, string> = {
  cnn: "Custom CNN",
  efficientnet: "EfficientNet-B0",
  vit: "ViT-B/16",
};

function downloadReport(
  _originalImageUrl: string,
  result: ClassifyResult,
  segmentation?: SegmentResult | SegmentNote
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const seg = isSegmentResult(segmentation) ? segmentation : null;
  const timestamp = new Date().toLocaleString();
  const isTumor = result.predicted_class !== "notumor";

  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 20;

  const teal   = "#0d9e6e";
  const amber  = "#c47a1a";
  const dark   = "#1a1a2e";
  const grey   = "#6b7280";
  const light  = "#f3f4f6";

  // Header bar
  doc.setFillColor(teal);
  doc.rect(0, 0, W, 14, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("NeuroScan — MRI Analysis Report", margin, 9.5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(timestamp, W - margin, 9.5, { align: "right" });

  y = 24;

  // Disclaimer
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(240, 168, 87);
  doc.roundedRect(margin, y, contentW, 9, 2, 2, "FD");
  doc.setTextColor(amber);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("⚠  Research & educational use only. Not a certified medical device. Do not use for clinical decision-making.", margin + 3, y + 5.5);
  y += 14;

  // Verdict box
  const verdictColor = isTumor ? amber : teal;
  doc.setFillColor(isTumor ? 255 : 240, isTumor ? 248 : 253, isTumor ? 235 : 248);
  doc.setDrawColor(verdictColor);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, "FD");

  doc.setTextColor(verdictColor);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(CLASS_LABELS[result.predicted_class] ?? result.predicted_class, margin + 5, y + 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grey);
  doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, margin + 5, y + 17);
  doc.text(`Model: ${MODEL_LABELS[result.model] ?? result.model}   |   Explainability: ${result.explainability_method}`, margin + 50, y + 17);
  y += 28;

  // Class description
  doc.setFontSize(9);
  doc.setTextColor(grey);
  doc.setFont("helvetica", "italic");
  doc.text(CLASS_DESCRIPTIONS[result.predicted_class] ?? "", margin, y);
  y += 8;

  // Section: Class Probabilities
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(grey);
  doc.text("CLASS PROBABILITIES", margin, y);
  y += 4;

  const sortedProbs = Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1]);
  const barH = 5;
  const barW = contentW - 60;

  for (const [cls, prob] of sortedProbs) {
    const isTop = cls === result.predicted_class;

    doc.setFontSize(9);
    doc.setFont("helvetica", isTop ? "bold" : "normal");
    doc.setTextColor(isTop ? dark : grey);
    doc.text(CLASS_LABELS[cls] ?? cls, margin, y + 4);

    // Track
    doc.setFillColor(235, 237, 240);
    doc.roundedRect(margin + 42, y, barW, barH, 1, 1, "F");

    // Fill
    const fillW = Math.max((prob * barW), 1);
    doc.setFillColor(isTop ? (isTumor ? 196 : 13) : 91,
                     isTop ? (isTumor ? 122 : 158) : 159,
                     isTop ? (isTumor ? 26  : 110) : 227);
    doc.roundedRect(margin + 42, y, fillW, barH, 1, 1, "F");

    // Value
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grey);
    doc.text(`${(prob * 100).toFixed(1)}%`, margin + 42 + barW + 3, y + 4);

    y += 9;
  }

  y += 4;

  // Section: Segmentation
  if (seg) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(grey);
    doc.text("SEGMENTATION  (U-Net)", margin, y);
    y += 5;

    const cardW = (contentW - 6) / 2;

    // Card 1 — detection
    doc.setFillColor(light);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(margin, y, cardW, 16, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(grey);
    doc.setFont("helvetica", "normal");
    doc.text("Tumor presence", margin + 3, y + 5.5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(seg.tumor_detected ? amber : teal);
    doc.text(seg.tumor_detected ? "Detected" : "Not found", margin + 3, y + 13);

    // Card 2 — area
    doc.setFillColor(light);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(margin + cardW + 6, y, cardW, 16, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(grey);
    doc.setFont("helvetica", "normal");
    doc.text("Tumor area (% of slice)", margin + cardW + 9, y + 5.5);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dark);
    doc.text(`${(seg.tumor_area_ratio * 100).toFixed(2)}%`, margin + cardW + 9, y + 13);

    y += 22;
  }

  // Footer
  const footerY = 285;
  doc.setDrawColor(220, 225, 230);
  doc.line(margin, footerY, W - margin, footerY);
  doc.setFontSize(7);
  doc.setTextColor(grey);
  doc.setFont("helvetica", "normal");
  doc.text("NeuroScan — Comparative Deep Learning Framework for Brain Tumor MRI Analysis", margin, footerY + 4);
  doc.text("Not a certified diagnostic device.", W - margin, footerY + 4, { align: "right" });

  doc.save(`neuroscan-report-${Date.now()}.pdf`);
}

export default function ResultsPanel({ originalImageUrl, result, segmentation }: Props) {
  const sortedProbs = Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1]);
  const isTumor = result.predicted_class !== "notumor";
  const overlaySrc = result.explainability_overlay_png_base64
    ? `data:image/png;base64,${result.explainability_overlay_png_base64}`
    : null;

  return (
    <div className="results-panel">
      {/* ── Images Row ─────────────────────────── */}
      <div className="results-panel__images">
        <figure>
          <img src={originalImageUrl} alt="Original MRI slice" />
          <figcaption>Original</figcaption>
        </figure>
        {overlaySrc && (
          <figure>
            <img src={overlaySrc} alt={`${result.explainability_method} overlay`} />
            <figcaption>{result.explainability_method}</figcaption>
          </figure>
        )}
        {isSegmentResult(segmentation) && (
          <figure>
            <img
              src={`data:image/png;base64,${segmentation.overlay_png_base64}`}
              alt="Segmentation overlay"
            />
            <figcaption>U-Net Segmentation</figcaption>
          </figure>
        )}
      </div>

      {/* ── Results Column ─────────────────────── */}
      <div className="results-panel__summary">
        {/* Verdict */}
        <div className={`verdict-badge ${isTumor ? "verdict-badge--alert" : "verdict-badge--clear"}`}>
          {isTumor ? "⚠ " : "✓ "}
          {CLASS_LABELS[result.predicted_class] ?? result.predicted_class}
        </div>

        {/* Description */}
        <p className="class-description">
          {CLASS_DESCRIPTIONS[result.predicted_class]}
        </p>

        {/* Meta row */}
        <div className="meta-row">
          <span className="meta-tag">
            {result.model === "cnn" ? "CNN" : result.model === "efficientnet" ? "EfficientNet-B0" : "ViT-B/16"}
          </span>
          <span className="meta-tag meta-tag--method">{result.explainability_method}</span>
          <span className="results-panel__confidence mono">
            {(result.confidence * 100).toFixed(1)}% confidence
          </span>
        </div>

        {/* Probability bars */}
        <div className="prob-bars">
          {sortedProbs.map(([cls, prob]) => (
            <div className="prob-bar" key={cls}>
              <span className="prob-bar__label">{CLASS_LABELS[cls] ?? cls}</span>
              <div className="prob-bar__track">
                <div
                  className="prob-bar__fill"
                  style={{
                    width: `${prob * 100}%`,
                    background:
                      cls === result.predicted_class
                        ? isTumor
                          ? "var(--accent-amber)"
                          : "var(--accent-teal)"
                        : "var(--accent-blue)",
                  }}
                />
              </div>
              <span className="prob-bar__value mono">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        {/* Segmentation note */}
        {isSegmentResult(segmentation) && (
          <div className="seg-summary">
            <div className="seg-summary__row">
              <span className="seg-summary__label">Tumor area</span>
              <span className="seg-summary__value mono">
                {(segmentation.tumor_area_ratio * 100).toFixed(2)}% of slice
              </span>
            </div>
            <div className="seg-summary__row">
              <span className="seg-summary__label">Detection</span>
              <span
                className="seg-summary__value"
                style={{ color: segmentation.tumor_detected ? "var(--accent-amber)" : "var(--accent-teal)" }}
              >
                {segmentation.tumor_detected ? "Tumor region found" : "No region detected"}
              </span>
            </div>
          </div>
        )}
        {segmentation && "note" in segmentation && (
          <p className="results-panel__seg-note">{segmentation.note}</p>
        )}

        {/* Download button */}
        <button
          className="download-btn"
          onClick={() => downloadReport(originalImageUrl, result, segmentation)}
        >
          ↓ Download PDF Report
        </button>
      </div>

      <style>{`
        .results-panel {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: var(--space-6);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }
        @media (max-width: 760px) {
          .results-panel { grid-template-columns: 1fr; }
        }
        .results-panel__images {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .results-panel__images figure {
          margin: 0;
          flex: 1;
          min-width: 120px;
        }
        .results-panel__images img {
          width: 100%;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          display: block;
          object-fit: cover;
          aspect-ratio: 1;
        }
        .results-panel__images figcaption {
          text-align: center;
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: var(--space-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .verdict-badge {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 17px;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
        }
        .verdict-badge--clear {
          background: var(--accent-teal-bg);
          color: var(--accent-teal);
          border: 1px solid rgba(61, 220, 151, 0.25);
        }
        .verdict-badge--alert {
          background: var(--accent-amber-bg);
          color: var(--accent-amber);
          border: 1px solid rgba(240, 168, 87, 0.3);
        }
        .class-description {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 var(--space-3) 0;
          line-height: 1.5;
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }
        .meta-tag {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .meta-tag--method {
          color: var(--accent-blue);
          border-color: rgba(91, 159, 227, 0.3);
        }
        .results-panel__confidence {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .prob-bars {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .prob-bar {
          display: grid;
          grid-template-columns: 120px 1fr 48px;
          align-items: center;
          gap: var(--space-3);
        }
        .prob-bar__label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .prob-bar__track {
          height: 6px;
          background: var(--bg-canvas);
          border-radius: 3px;
          overflow: hidden;
        }
        .prob-bar__fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        .prob-bar__value {
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: right;
        }
        .seg-summary {
          background: var(--bg-canvas);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        .seg-summary__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .seg-summary__label { color: var(--text-tertiary); }
        .seg-summary__value { color: var(--text-primary); }
        .results-panel__seg-note {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 var(--space-4) 0;
        }
        .download-btn {
          width: 100%;
          padding: var(--space-3);
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          margin-top: auto;
        }
        .download-btn:hover {
          border-color: var(--accent-teal);
          color: var(--accent-teal);
          background: var(--accent-teal-bg);
        }
      `}</style>
    </div>
  );
}
