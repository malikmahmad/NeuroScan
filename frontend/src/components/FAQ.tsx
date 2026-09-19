import { useState } from "react";
import { useInView } from "../hooks/useInView";

const FAQS = [
  { q: "Is NeuroScan a certified medical device?",
    a: "No. This is a research and educational project built to compare deep learning architectures on a public MRI dataset. It has not been clinically validated and must never be used to make real diagnostic or treatment decisions." },
  { q: "How accurate are the models?",
    a: "On the held-out test set (1,600 images): CNN 78.2%, EfficientNet-B0 91.6%, DenseNet-121 94.3%, MobileNetV3 94.3%, Swin-T 94.8%, ViT-B/16 94.7%, ResNet-50 95.3% (best). U-Net segmentation Dice score: 0.886. Full per-class metrics, confusion matrices, and training curves are in the project's metrics files." },
  { q: "Why seven models instead of one?",
    a: "Most public projects ship a single CNN. Training all seven under identical preprocessing, splits, and hyperparameters turns 'which model is best' into a measured, reproducible comparison instead of a guess — spanning scratch-trained CNN, transfer-learned CNNs, a hybrid transformer, and pure transformers." },
  { q: "What is Grad-CAM vs. Attention Rollout, and why both?",
    a: "Grad-CAM traces gradients through convolutional feature maps — valid for CNN, EfficientNet-B0, ResNet-50, DenseNet-121, and MobileNetV3. Swin-T and ViT-B/16 have no convolutional feature map, so Attention Rollout aggregates self-attention weights across all transformer blocks instead. Using Grad-CAM on a transformer is a methodological error; NeuroScan avoids it." },
  { q: "Does NeuroScan store the images I upload?",
    a: "No. Uploaded scans are held in memory only for the duration of a single prediction request and are never written to disk, logged, or shared." },
  { q: "What's the tech stack?",
    a: "PyTorch for all four models (CNN, EfficientNet-B0, ViT-B/16, U-Net), a FastAPI backend serving inference and explainability, and this React + TypeScript frontend. Runs in Docker." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { ref: headerRef, inView: headerVisible } = useInView<HTMLDivElement>();
  const { ref: listRef,   inView: listVisible   } = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section id="faq" className="faq">
      <div ref={headerRef} className={`faq__header reveal ${headerVisible ? "is-visible" : ""}`}>
        <span className="section-eyebrow">FAQ</span>
        <h2>Questions worth asking before you trust an AI model</h2>
      </div>

      <div ref={listRef} className="faq__list">
        {FAQS.map((item, i) => {
          const isOpen  = openIndex === i;
          const panelId = `faq-panel-${i}`;
          const btnId   = `faq-btn-${i}`;
          return (
            <div
              key={item.q}
              className={`faq__item reveal ${isOpen ? "faq__item--open" : ""} ${listVisible ? "is-visible" : ""}`}
              style={{ transitionDelay: listVisible ? `${i * 0.06}s` : "0s" }}
            >
              <button
                id={btnId}
                className="faq__question"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span>{item.q}</span>
                <span className="faq__chevron" aria-hidden="true">
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className="faq__answer"
                style={{ maxHeight: isOpen ? "600px" : "0px" }}
              >
                <p>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .faq { max-width: 760px; margin: 0 auto; padding: var(--space-8) var(--space-5); }
        .faq__header { text-align: center; margin-bottom: var(--space-6); }
        .faq__header h2 { font-size: 24px; margin-top: var(--space-3); color: var(--text-primary); }
        .faq__list { display: flex; flex-direction: column; gap: var(--space-3); }
        .faq__item {
          background: var(--bg-panel); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); overflow: hidden;
          transition:
            border-color 0.25s, box-shadow 0.25s,
            opacity 0.5s cubic-bezier(0.16,1,0.3,1),
            transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .faq__item--open {
          border-color: rgba(var(--accent-teal-rgb), 0.35);
          box-shadow: 0 4px 20px rgba(var(--accent-teal-rgb), 0.08);
        }
        .faq__item:not(.faq__item--open):hover {
          border-color: rgba(var(--accent-teal-rgb), 0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .faq__question {
          width: 100%; background: transparent; border: none;
          padding: var(--space-4) var(--space-5);
          display: flex; justify-content: space-between; align-items: center;
          gap: var(--space-3); font-size: 14.5px; font-weight: 500;
          color: var(--text-primary); text-align: left;
          transition: background 0.2s;
        }
        .faq__question:hover { background: var(--bg-panel-raised); }
        .faq__chevron { color: var(--accent-teal); flex-shrink: 0; display: flex; }
        .faq__answer {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .faq__answer p {
          margin: 0; padding: 0 var(--space-5) var(--space-4);
          font-size: 13.5px; line-height: 1.6; color: var(--text-secondary);
        }
      `}</style>
    </section>
  );
}

