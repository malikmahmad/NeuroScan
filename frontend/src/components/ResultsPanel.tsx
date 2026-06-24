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
  glioma:     "Glioma",
  meningioma: "Meningioma",
  pituitary:  "Pituitary tumor",
  notumor:    "No tumor detected",
};

const CLASS_DESCRIPTIONS: Record<string, string> = {
  glioma:     "Arises from glial cells. Most common primary brain tumor.",
  meningioma: "Grows from the meninges. Usually benign and slow-growing.",
  pituitary:  "Develops in the pituitary gland. Often treatable.",
  notumor:    "No malignant or benign tumor detected in this slice.",
};

const MODEL_LABELS: Record<string, string> = {
  cnn:          "Custom CNN",
  efficientnet: "EfficientNet-B0",
  vit:          "ViT-B/16",
};

function downloadReport(
  _originalImageUrl: string,
  result: ClassifyResult,
  segmentation?: SegmentResult | SegmentNote
) {
  const doc       = new jsPDF({ unit: "mm", format: "a4" });
  const seg       = isSegmentResult(segmentation) ? segmentation : null;
  const timestamp = new Date().toLocaleString();
  const isTumor   = result.predicted_class !== "notumor";
  const W         = 210;
  const margin    = 18;
  const contentW  = W - margin * 2;
  let y           = 20;

  const teal  = "#00aac8";
  const amber = "#d48000";
  const dark  = "#0d1117";
  const grey  = "#6b7280";
  const light = "#f0f4f8";

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

  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(240, 168, 87);
  doc.roundedRect(margin, y, contentW, 9, 2, 2, "FD");
  doc.setTextColor(amber);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("⚠  Research & educational use only. Not a certified medical device.", margin + 3, y + 5.5);
  y += 14;

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
  doc.text(`Model: ${MODEL_LABELS[result.model] ?? result.model}   |   ${result.explainability_method}`, margin + 50, y + 17);
  y += 28;

  doc.setFontSize(9);
  doc.setTextColor(grey);
  doc.setFont("helvetica", "italic");
  doc.text(CLASS_DESCRIPTIONS[result.predicted_class] ?? "", margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(grey);
  doc.text("CLASS PROBABILITIES", margin, y);
  y += 4;

  const sortedProbs = Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1]);
  const barW = contentW - 60;

  for (const [cls, prob] of sortedProbs) {
    const isTop = cls === result.predicted_class;
    doc.setFontSize(9);
    doc.setFont("helvetica", isTop ? "bold" : "normal");
    doc.setTextColor(isTop ? dark : grey);
    doc.text(CLASS_LABELS[cls] ?? cls, margin, y + 4);

    doc.setFillColor(235, 237, 240);
    doc.roundedRect(margin + 42, y, barW, 5, 1, 1, "F");

    const fillW = Math.max(prob * barW, 1);
    doc.setFillColor(
      isTop ? (isTumor ? 210 : 0)   : 79,
      isTop ? (isTumor ? 130 : 172) : 172,
      isTop ? (isTumor ? 0   : 200) : 254
    );
    doc.roundedRect(margin + 42, y, fillW, 5, 1, 1, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grey);
    doc.text(`${(prob * 100).toFixed(1)}%`, margin + 42 + barW + 3, y + 4);
    y += 9;
  }

  y += 4;

  if (seg) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(grey);
    doc.text("SEGMENTATION  (U-Net)", margin, y);
    y += 5;

    const cardW = (contentW - 6) / 2;

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
  const isTumor     = result.predicted_class !== "notumor";
  const overlaySrc  = result.explainability_overlay_png_base64
    ? `data:image/png;base64,${result.explainability_overlay_png_base64}`
    : null;

  return (
    <div className="results-panel">
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
            <img src={`data:image/png;base64,${segmentation.overlay_png_base64}`} alt="Segmentation overlay" />
            <figcaption>Segmentation</figcaption>
          </figure>
        )}
      </div>

      <div className="results-panel__summary">
        <span className="results-panel__model-tag">{MODEL_LABELS[result.model] ?? result.model}</span>
        <div className={`verdict-badge ${isTumor ? "verdict-badge--alert" : "verdict-badge--clear"}`}>
          <span className="verdict-badge__dot" />
          {CLASS_LABELS[result.predicted_class] ?? result.predicted_class}
        </div>
        <p className="results-panel__confidence">
          confidence <span className="mono">{(result.confidence * 100).toFixed(1)}%</span>
        </p>

        <div className="prob-bars">
          {sortedProbs.map(([cls, prob], i) => (
            <div className="prob-bar" key={cls}>
              <span className="prob-bar__label">{CLASS_LABELS[cls] ?? cls}</span>
              <div className="prob-bar__track">
                <div
                  className="prob-bar__fill"
                  style={{ width: `${prob * 100}%`, transitionDelay: `${i * 60}ms` }}
                />
              </div>
              <span className="prob-bar__value mono">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        {isSegmentResult(segmentation) && (
          <div className="seg-callout">
            <span className="seg-callout__icon">◎</span>
            tumor area ≈ <span className="mono">{(segmentation.tumor_area_ratio * 100).toFixed(2)}%</span> of slice
          </div>
        )}
        {segmentation && "note" in segmentation && (
          <p className="results-panel__seg-note">{segmentation.note}</p>
        )}

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
          grid-template-columns: 1.3fr 1fr;
          gap: var(--space-6);
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }
        @media (max-width: 760px) {
          .results-panel { grid-template-columns: 1fr; gap: var(--space-5); padding: var(--space-4); }
        }
        .results-panel__images { display: flex; gap: var(--space-3); flex-wrap: wrap; align-content: flex-start; }
        .results-panel__images figure { margin: 0; flex: 1; min-width: 110px; }
        .results-panel__images img {
          width: 100%;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          display: block;
          transition: transform 0.2s, border-color 0.2s;
        }
        .results-panel__images img:hover { border-color: var(--border-strong); transform: translateY(-2px); }
        .results-panel__images figcaption { text-align: center; font-size: 11.5px; color: var(--text-tertiary); margin-top: var(--space-2); }
        .results-panel__model-tag {
          display: inline-block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
        }
        .verdict-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 18px;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
        }
        .verdict-badge__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
        .verdict-badge--clear { background: var(--accent-teal-bg); color: var(--accent-teal); }
        .verdict-badge--alert { background: var(--accent-amber-bg); color: var(--accent-amber); }
        .results-panel__confidence { color: var(--text-secondary); font-size: 13px; margin: 0 0 var(--space-5); }
        .results-panel__confidence .mono { color: var(--text-primary); font-weight: 500; }
        .prob-bars { display: flex; flex-direction: column; gap: var(--space-3); }
        .prob-bar { display: grid; grid-template-columns: 110px 1fr 48px; align-items: center; gap: var(--space-3); }
        .prob-bar__label { font-size: 13px; color: var(--text-secondary); }
        .prob-bar__track { height: 6px; background: var(--bg-canvas); border-radius: 3px; overflow: hidden; }
        .prob-bar__fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue), #7eb8f0);
          border-radius: 3px;
          width: 0%;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          animation: growBar 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes growBar { from { width: 0%; } }
        .prob-bar__value { font-size: 12px; color: var(--text-tertiary); text-align: right; }
        .seg-callout {
          margin-top: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 13px;
          color: var(--text-secondary);
          background: var(--bg-panel-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-2) var(--space-3);
        }
        .seg-callout__icon { color: var(--accent-amber); }
        .seg-callout .mono { color: var(--text-primary); }
        .results-panel__seg-note { margin-top: var(--space-5); font-size: 13px; color: var(--text-tertiary); }
        .download-btn {
          margin-top: var(--space-5);
          width: 100%;
          padding: var(--space-3);
          background: transparent;
          border: 1px solid var(--border-strong);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          font-size: 13px;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .download-btn:hover { border-color: var(--accent-teal); color: var(--accent-teal); background: var(--accent-teal-bg); }
        @media (max-width: 480px) {
          .prob-bar { grid-template-columns: 88px 1fr 40px; gap: var(--space-2); }
          .prob-bar__label { font-size: 12px; }
          .verdict-badge { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
