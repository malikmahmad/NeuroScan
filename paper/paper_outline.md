# Paper Outline — IEEE Format

**Working title:**
"A Comparative Deep Learning Framework with Explainable AI for Multi-Class
Brain Tumor Classification and Segmentation from MRI"

*(Adjust the title once you have final numbers — if ViT wins, lead with that;
if EfficientNet wins, emphasize "efficient" instead of "comparative".)*

**Target venues** (check current calls for papers / fees before submitting):
- *IEEE Access* (open access journal, Scopus + IEEE Xplore indexed, accepts
  independent-researcher submissions, has an article processing charge)
- IEEE-sponsored regional/student conferences on AI in healthcare or
  biomedical engineering — search "IEEE EMBS conference 2026" /
  "IEEE BIBM 2026" for open calls
- Some university-hosted IEEE-affiliated conferences accept independent
  submissions; check Anthropic's training data won't have current 2026 CFPs,
  so search for the current ones yourself before assuming a deadline.

---

## Abstract (150–250 words)
Write this **last**, after Results are final. One sentence each for:
problem, gap in existing work, your method, your headline numbers, your
conclusion. No citations in the abstract.

## I. Introduction
- Why brain tumor diagnosis from MRI matters (manual reading is slow,
  subject to inter-rater variability — cite a clinical-burden statistic if
  you find a real one via search, don't invent one)
- What existing deep-learning approaches do (cite 2-3 real papers — search
  for recent brain tumor MRI classification papers, paraphrase their
  approach, don't quote)
- The specific gap this paper addresses:
  1. Most works report a single architecture's accuracy without a
     controlled comparison against architecturally different alternatives
     (CNN vs. transformer)
  2. Few works combine classification + segmentation + *methodologically
     correct* explainability in one evaluated pipeline
- One-paragraph summary of your contributions (bullet list is fine here)

## II. Related Work
Organize by sub-topic, 1 short paragraph each, paraphrased in your own words:
- Classical / early CNN approaches to brain tumor MRI classification
- Transfer learning approaches (EfficientNet, ResNet, etc. on this task)
- Vision Transformers in medical imaging generally
- Tumor segmentation approaches (U-Net and variants)
- Explainability in medical imaging (Grad-CAM, attention-based methods)

**Citations you should include (find current bibliographic details via
search before finalizing — formats/venues below as a starting point):**
- Ronneberger, Fischer & Brox (2015) — U-Net
- Tan & Le (2019) — EfficientNet
- Dosovitskiy et al. (2020) — "An Image is Worth 16x16 Words" (ViT)
- Selvaraju et al. (2017) — Grad-CAM
- Abnar & Zuidema (2020) — Attention Rollout / "Quantifying Attention Flow"
- Buda, Saha & Mazurowski (2019) — *Computers in Biology and Medicine*
  (source of your segmentation dataset)
- Nickparvar — Kaggle Brain Tumor MRI Dataset (cite the dataset page itself
  as a dataset citation, plus any paper that originally compiled the
  underlying Figshare data it merges)

## III. Methodology
### A. Datasets
- Brain Tumor MRI Dataset: class counts, image counts, train/test split
  sizes — pull the real numbers your script printed in the EDA cell
- LGG MRI Segmentation Dataset: case count, slice count, tumor-positive
  vs. tumor-negative slice counts — again, your script's real printed
  numbers, not estimates
- Preprocessing: resize to 224×224 (classification) / 256×256
  (segmentation), ImageNet normalization, augmentation list (flip,
  rotation, color jitter)

### B. Model Architectures
- One subsection per model (CNN / EfficientNet-B0 / ViT-B/16 / U-Net) —
  brief architecture description + why it was chosen, referencing the
  exact code in `backend/app/models.py`
- State clearly which layers were frozen vs. fine-tuned for the transfer
  learning models — this is exactly the kind of methodological detail
  reviewers check for

### C. Training Configuration
- Loss functions (cross-entropy for classification, Dice+BCE for
  segmentation — explain why Dice+BCE: class imbalance between tumor and
  background pixels)
- Optimizer, learning rate, scheduler, epochs, batch size — pull straight
  from `notebooks/train_classification.py` / `train_segmentation.py`
  config constants
- Hardware used (GPU model, e.g. "NVIDIA T4 via Kaggle Notebooks")

### D. Explainability Methodology
- Explain *why* Grad-CAM is invalid for ViT and what Attention Rollout
  does instead — this paragraph is a genuine technical contribution to
  include, since several public implementations get this wrong

### E. Evaluation Metrics
- Classification: accuracy, precision/recall/F1 (macro + weighted),
  ROC-AUC (one-vs-rest)
- Segmentation: Dice coefficient, IoU

## IV. Results
Pull these directly from the JSON files your scripts already save —
don't hand-type numbers, copy them from `outputs/metrics/*.json` and
`outputs_segmentation/metrics/*.json` so the paper and the code can never
drift out of sync.

- **Table 1:** Classification comparison (`outputs/metrics/model_comparison.csv`)
- **Figure 1:** Training/validation curves per model
  (`outputs/metrics/*_history.json`)
- **Figure 2:** Confusion matrices, one per model
  (`outputs/figures/*_confusion_matrix.png`)
- **Figure 3:** Qualitative explainability comparison — 1 row per class,
  columns = Original / CNN Grad-CAM / EfficientNet Grad-CAM / ViT Attention
  Rollout (`outputs/figures/explainability/*.png`)
- **Table 2:** Segmentation results — Dice, IoU
  (`outputs_segmentation/metrics/segmentation_test_results.json`)
- **Figure 4:** Segmentation qualitative examples
  (`outputs_segmentation/figures/segmentation_qualitative.png`)

## V. Discussion
- Which architecture won, and a *reasoned* explanation why (e.g. "ViT's
  lack of convolutional locality bias may explain its weaker performance
  on a dataset this size, consistent with known ViT data-hunger" — only
  write this if your numbers actually show that pattern)
- Where the models disagree (look at which test images CNN/EfficientNet/ViT
  classify differently — a short qualitative error analysis is exactly
  what reviewers like to see)
- Limitations: 2D slices vs. real 3D volumetric MRI, dataset size, single
  institution's worth of images for the segmentation set, no clinical
  validation
- Note honestly that this is *not* a clinically validated tool

## VI. Conclusion & Future Work
- One paragraph restating the contribution + headline numbers
- Future work: 3D volumetric segmentation, multi-institution external
  validation, deployment study

## References
IEEE numbered style (`[1]`, `[2]`, …), generated from your actual citations
above — use a tool like Google Scholar's "Cite" → BibTeX, or Zotero, rather
than hand-formatting; IEEE reference formatting is strict and easy to get
subtly wrong by hand.

---

## Before you submit, double-check:
- [ ] Every number in every table matches a file in `outputs/metrics/` —
      no number should exist only in the paper text
- [ ] Every cited paper is paraphrased in your own words, not copied
- [ ] You searched for the current CFP/deadline/fee of your target venue —
      don't rely on memory for this, things change
- [ ] Your name and affiliation are accurate and this is your own,
      independently-run experiment (re-trained by you, on your own
      compute, with your own results) — not a re-skin of someone else's
      repository or report
