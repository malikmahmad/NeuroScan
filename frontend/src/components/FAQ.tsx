import { useState } from "react";

const FAQS = [
  { q: "Is NeuroScan a certified medical device?",
    a: "No. This is a research and educational project built to compare deep learning architectures on a public MRI dataset. It has not been clinically validated and must never be used to make real diagnostic or treatment decisions." },
  { q: "How accurate are the models?",
    a: "On the held-out test set: the custom CNN reached 78.2% accuracy, EfficientNet-B0 reached 91.6%, and ViT-B/16 reached 94.7%. The U-Net segmentation model reached a Dice score of 0.886. Full per-class metrics, confusion matrices, and training curves are in the project's metrics files." },
  { q: "Why three models instead of one?",
    a: "Most public projects ship a single CNN. Training all three under identical preprocessing and splits turns 'which model is best' into a measured, reproducible comparison instead of a guess — and it's useful to see where a from-scratch CNN, a transfer-learned CNN, and a transformer disagree." },
  { q: "What is Grad-CAM vs. Attention Rollout, and why both?",
    a: "Grad-CAM traces gradients through convolutional feature maps, so it applies to the CNN and EfficientNet. A Vision Transformer has no convolutional feature map, so Attention Rollout — which aggregates self-attention weights across all transformer blocks — is used for ViT instead. Using Grad-CAM on a transformer is a methodological error that some public implementations make; NeuroScan avoids it." },
  { q: "Does NeuroScan store the images I upload?",
    a: "No. Uploaded scans are held in memory only for the duration of a single prediction request and are never written to disk, logged, or shared." },
  { q: "What's the tech stack?",
    a: "PyTorch for all four models (CNN, EfficientNet-B0, ViT-B/16, U-Net), a FastAPI backend serving inference and explainability, and this React + TypeScript frontend. Runs in Docker." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="faq">
      <div className="faq__header">
        <span className="section-eyebrow">FAQ</span>
        <h2>Questions worth asking before you trust an AI model</h2>
      </div>
      <div className="faq__list">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div className={`faq__item ${isOpen ? "faq__item--open" : ""}`} key={item.q}>
              <button className="faq__question" onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen}>
                <span>{item.q}</span>
                <span className="faq__chevron">{isOpen ? "−" : "+"}</span>
              </button>
              <div className="faq__answer" style={{ maxHeight: isOpen ? "300px" : "0px" }}>
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
        .faq__item { background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; transition: border-color 0.2s; }
        .faq__item--open { border-color: rgba(var(--accent-teal-rgb), 0.3); }
        .faq__question { width: 100%; background: transparent; border: none; padding: var(--space-4) var(--space-5); display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); font-size: 14.5px; font-weight: 500; color: var(--text-primary); text-align: left; }
        .faq__chevron { font-size: 18px; color: var(--accent-teal); flex-shrink: 0; }
        .faq__answer { overflow: hidden; transition: max-height 0.3s ease; }
        .faq__answer p { margin: 0; padding: 0 var(--space-5) var(--space-4); font-size: 13.5px; line-height: 1.6; color: var(--text-secondary); }
      `}</style>
    </section>
  );
}
