================================================================
ARTICLE TITLE
================================================================

What Happens When Architecture Is the Only Variable?
Benchmarking Seven Deep Learning Models for Brain Tumor MRI Classification


================================================================
ARTICLE BODY
(Paste into LinkedIn Article editor)
Bold = Ctrl+B | Italic = Ctrl+I | Separator = use LinkedIn divider
📌 = replace with actual image
[Link text] = hyperlink karo LinkedIn editor mein
================================================================

**What Happens When Architecture Is the Only Variable?**
*Benchmarking Seven Deep Learning Models for Brain Tumor MRI Classification*

*A controlled, open-source benchmark where every architecture is evaluated under identical experimental conditions.*

Most brain tumor MRI repositories report a single accuracy number. Very few answer the question that actually matters:

*How much of the final performance comes from the model architecture itself — and how much comes from differences in preprocessing, data splits, augmentation, or training strategy?*

That question became the motivation behind **NeuroScan** — an open-source medical imaging research project that compares seven modern deep learning architectures for four-class brain tumor MRI classification under strictly identical experimental conditions.

Rather than pursuing the highest benchmark score possible, NeuroScan focuses on **controlled experimentation**. Every model is trained using the same dataset, preprocessing pipeline, augmentation strategy, optimizer, learning-rate schedule, hardware, and evaluation protocol, making the neural network architecture the only experimental variable.

Beyond image classification, the repository also includes automatic U-Net segmentation, architecture-aware explainability, a production-ready FastAPI backend, automated testing, and a fully reproducible research pipeline.

🔗 **Repository:** github.com/malikmahmad/NeuroScan

---

**📌 Project Overview**

🎯 **Task:** Brain Tumor MRI Classification
🧠 **Target Classes:** Glioma · Meningioma · Pituitary Tumor · No Tumor
🤖 **Models Compared:** Seven modern deep learning architectures
🩺 **Segmentation:** Automatic U-Net tumor segmentation
🔍 **Explainability:** Grad-CAM for CNNs · Attention Rollout for Vision Transformers
⚙️ **Backend:** Production-ready FastAPI · 8 REST endpoints · MRI validation · Lazy model loading
🧪 **Testing:** 17 automated Pytest tests
🔥 **Framework:** PyTorch
💻 **Training Environment:** Kaggle-ready notebooks · NVIDIA Tesla T4 GPU
📄 **License:** MIT License

---

**🚀 Key Contributions**

✅ Fair architectural benchmark under identical experimental conditions
✅ Seven deep learning architectures trained using the same pipeline
✅ Architecture-aware explainability
— Grad-CAM for convolutional neural networks
— Attention Rollout for Vision Transformers
✅ Automatic U-Net tumor segmentation
✅ Production-style FastAPI inference backend
✅ MRI plausibility validation before inference
✅ Machine-readable JSON metrics pipeline
✅ 17 automated backend tests
✅ Fully reproducible Kaggle training workflow
✅ Open-source under the MIT License

---

**📊 Why This Benchmark Matters**

Deep learning papers frequently report impressive accuracy improvements, but comparing those numbers directly is often misleading.

Different studies usually employ different preprocessing pipelines, train-validation splits, augmentation policies, optimization strategies, learning-rate schedules, and hardware configurations. Even small differences in those choices can significantly affect reported accuracy.

As a result, many published benchmarks compare entire experimental pipelines rather than the neural network architectures themselves.

NeuroScan was designed to eliminate those confounding variables. Every component of the training pipeline remains constant:

— Dataset · Image preprocessing · Data augmentation
— Optimizer · Learning-rate scheduler · Hardware · Evaluation protocol

*The only thing that changes between experiments is the neural network architecture.*

The objective isn't to claim a new state-of-the-art result. It's to provide a **transparent, reproducible baseline** for fair architectural comparison.

---

**🏗️ What's Inside NeuroScan**

NeuroScan combines multiple independent components into a single reproducible medical imaging pipeline.

*Core Components*
🧠 Seven independent image classification models
🩺 Automatic U-Net tumor segmentation
🔍 Architecture-aware explainability
⚙️ FastAPI backend with 8 REST endpoints
✅ MRI plausibility validation before inference
📓 Kaggle-ready notebooks and evaluation scripts
🧪 Automated backend testing (17 passing tests)
📊 Machine-readable JSON metrics

The modular architecture allows every component to remain independent while operating together as one integrated system.

---

**⚙️ The Controlled Benchmark**

Every classifier was trained under exactly the same experimental conditions.

*Shared Training Configuration*

🖼️ **Input Resolution:** 224 × 224, ImageNet normalization
🔄 **Data Augmentation:** Horizontal Flip · ±10° Rotation · Brightness Jitter · Contrast Jitter
🧠 **Optimizer:** AdamW
📉 **LR Scheduler:** ReduceLROnPlateau
📦 **Batch Size:** 32
⏳ **Training Epochs:** 15
💻 **Hardware:** NVIDIA Tesla T4 GPU

*The only experimental variable is the model architecture.*

---

**🧠 Model Comparison**

**Custom CNN**
Total Parameters: 0.42M · Trainable: 0.42M (100%) · Pretraining: None

**EfficientNet-B0**
Total Parameters: 4.01M · Trainable: 1.13M · Pretraining: ImageNet-1K

**MobileNetV3-Large**
Total Parameters: 4.21M · Trainable: 2.99M · Pretraining: ImageNet-1K

**DenseNet-121**
Total Parameters: 6.96M · Trainable: 2.16M · Pretraining: ImageNet-1K

**ResNet-50**
Total Parameters: 23.52M · Trainable: 14.97M · Pretraining: ImageNet-1K

**Swin Transformer (Swin-T)**
Total Parameters: 27.52M · Trainable: 15.37M · Pretraining: ImageNet-1K

**Vision Transformer (ViT-B/16)**
Total Parameters: 85.80M · Trainable: 7.09M · Pretraining: ImageNet-1K

*All parameter counts were computed directly from the implemented model definitions rather than estimated from published papers.*

---

**📈 Benchmark Results**

*Held-Out Test Set — 1,600 MRI Images · 400 Images per Class*

🥇 **ResNet-50** · Accuracy: **95.44%** · Macro F1: 0.954 · ROC-AUC: 0.990
🥈 **MobileNetV3-Large** · Accuracy: 94.13% · Macro F1: 0.940 · ROC-AUC: 0.988
🥉 **Swin-T** · Accuracy: 93.94% · Macro F1: 0.938 · ROC-AUC: 0.987
**DenseNet-121** · Accuracy: 93.87% · Macro F1: 0.937 · ROC-AUC: 0.989
**ViT-B/16** · Accuracy: 93.87% · Macro F1: 0.937 · ROC-AUC: 0.991
**EfficientNet-B0** · Accuracy: 91.56% · Macro F1: 0.913 · ROC-AUC: 0.985
**Custom CNN** · Accuracy: 78.12% · Macro F1: 0.769 · ROC-AUC: 0.926

*Key Observations*
✔️ Transfer learning contributes far more than architecture selection
✔️ All pretrained models cluster within approximately 1% of one another
✔️ The scratch-trained CNN trails pretrained models by ~17 percentage points
✔️ Glioma remains the most challenging class
✔️ U-Net segmentation: **Dice 0.886 · IoU 0.856**

---

**📚 Comparison with Published Literature**

*ResNet-50 (NeuroScan)*
Accuracy: 95.44% · Training Strategy: Layer4 Fine-Tuning Only

*ViT-B/16 (NeuroScan)*
Accuracy: 93.87% · Training Strategy: Last Encoder Block Fine-Tuning Only

*EfficientNetV2b0 — Hassan & Ghadiri, 2025*
Accuracy: 99.16% · Training Strategy: Full Backbone Fine-Tuning

*EfficientNetV2 + Attention — Pacal, 2024*
Accuracy: 99.76% · Training Strategy: Full Fine-Tuning + Custom Attention Modules

Unlike these studies, NeuroScan intentionally restricts fine-tuning to maintain identical computational effort across every architecture. The benchmark **prioritizes fairness, reproducibility, and transparency over maximizing accuracy**.

---

**🔍 Explainability**

Interpretability is an essential component of trustworthy medical AI. However, explainability techniques are **architecture-dependent**.

*For Convolutional Neural Networks → Grad-CAM*
Computes gradients with respect to the final convolutional feature maps, producing localization heatmaps. Supported: ResNet-50 · DenseNet-121 · EfficientNet-B0 · MobileNetV3 · Custom CNN

*For Vision Transformers → Attention Rollout*
Aggregates self-attention across encoder layers to estimate which image patches most influenced the prediction. Supported: Swin-T · ViT-B/16

Using Grad-CAM on Vision Transformers is a methodological mistake that appears in many public repositories. **NeuroScan automatically selects the correct method per architecture.**

---

**♻️ Reproducibility**

Reproducibility is a central design principle of NeuroScan.

Every reported metric is generated directly from evaluation scripts and stored as machine-readable JSON — eliminating manual copying into documentation.

*Included in the repository:*
— Training notebooks · Evaluation scripts · Backend APIs
— Inference pipeline · Checkpoint loading
— Automated metrics generation · Kaggle-ready environment

Model checkpoints load lazily. If a checkpoint is unavailable, the backend returns an **explicit error** rather than a placeholder prediction. For medical imaging software, transparency is significantly more valuable than silently producing unreliable outputs.

---

**🛠️ Engineering Beyond Model Training**

NeuroScan was designed as both a research project and a software engineering project.

*Backend Features*
⚙️ Production-ready FastAPI backend (8 endpoints)
⚡ Lazy checkpoint loading
🧠 MRI plausibility validation
🧪 17 automated Pytest tests
📊 Machine-readable JSON metrics
📦 Docker-ready deployment
🔍 Integrated explainability APIs
🩺 Automatic U-Net segmentation pipeline

*The engineering philosophy mirrors the research philosophy: everything should be explicit, reproducible, testable, and maintainable.*

---

**⚠️ Current Limitations**

Every research project has limitations. NeuroScan's are intentionally documented:

— MRI validation relies on a heuristic rather than a clinically validated quality assessment model
— Ensemble inference has not yet been comprehensively benchmarked
— Tumor segmentation is currently limited to 2D slices
— No external multi-institution clinical validation has been performed
— Current CORS configuration is intended for research and local deployment

*NeuroScan is designed exclusively for research and educational purposes. It is not a clinical diagnostic system.*

---

**🚀 Future Work**

*Short-Term Roadmap*
— Ensemble benchmarking · Monte Carlo Dropout
— ROC Curves · Precision–Recall Curves

*Long-Term Roadmap*
— Cross-dataset validation · Native DICOM support
— 3D volumetric segmentation · Additional explainability methods

---

**💬 A Personal Note**

Building NeuroScan taught me considerably more than how to train deep learning models.

The hardest challenge wasn't writing the code. It was resisting the temptation to optimize for more attractive benchmark numbers — changing train-test splits, selecting favorable comparisons, reporting only the strongest metrics, ignoring limitations.

*The value of a reproducible benchmark isn't the accuracy number. It's that someone else can inspect every implementation detail, run the same experiment, and arrive at the same conclusion.*

That is the standard NeuroScan attempts to follow.

---

**📂 Project Resources**

📦 **Repository:** github.com/malikmahmad/NeuroScan
📖 **README:** github.com/malikmahmad/NeuroScan/blob/main/README.md
🤝 **Contributing:** github.com/malikmahmad/NeuroScan/blob/main/CONTRIBUTING.md
🐞 **Issue Tracker:** github.com/malikmahmad/NeuroScan/issues
💬 **Discussions:** github.com/malikmahmad/NeuroScan/discussions
📄 **MIT License:** github.com/malikmahmad/NeuroScan/blob/main/LICENSE
📝 **Changelog:** github.com/malikmahmad/NeuroScan/blob/main/CHANGELOG.md
🚀 **Releases:** github.com/malikmahmad/NeuroScan/releases
📑 **Paper Draft:** github.com/malikmahmad/NeuroScan/blob/main/paper/paper_outline.md

---

**📚 References**

Abnar & Zuidema (2020). Quantifying Attention Flow in Transformers. *ACL.*
Dosovitskiy et al. (2021). An Image is Worth 16×16 Words. *ICLR.*
Liu et al. (2021). Swin Transformer. *ICCV.*
He et al. (2016). Deep Residual Learning for Image Recognition. *CVPR.*
Huang et al. (2017). Densely Connected Convolutional Networks. *CVPR.*
Tan & Le (2019). EfficientNet. *ICML.*
Ronneberger et al. (2015). U-Net. *MICCAI.*
Selvaraju et al. (2017). Grad-CAM. *ICCV.*
Hassan & Ghadiri (2025). *Computers in Biology and Medicine.*
Pacal (2024). *Cluster Computing.*
Buda, Saha & Mazurowski (2019). *Computers in Biology and Medicine.*

---

**💭 Closing Thoughts**

Reproducible research creates significantly more long-term value than isolated benchmark numbers.

My hope is that NeuroScan serves as a transparent foundation that students, researchers, and engineers can inspect, reproduce, extend, and improve. Whether it becomes a teaching resource, a reproducible benchmark, or simply a useful reference for fair experimental design, the project will have achieved its purpose.

*Open science advances most effectively when methods — not just results — are shared openly.*

---

**🤝 Call to Action**

If NeuroScan is useful for your research, teaching, or experimentation, I'd genuinely appreciate your feedback. Feel free to:

⭐ Star the repository
🐞 Open an issue
🤝 Contribute improvements
💬 Share suggestions or ideas

Every contribution — whether it's code, documentation, testing, or constructive feedback — helps make open medical AI research more transparent, reproducible, and accessible for everyone.

🔗 **github.com/malikmahmad/NeuroScan**


================================================================
"TELL YOUR NETWORK" POST
(5-10 min after article publish)
================================================================

🧠 Same MRI. Same data. Same training pipeline. Seven different deep learning models.

The only variable? The architecture itself.

That's the idea behind NeuroScan — an open-source research project comparing seven deep learning architectures for brain tumor MRI classification under identical experimental conditions.

Held-out test set (1,600 images):

🥇 ResNet-50 — 95.44%
MobileNetV3-Large — 94.13%
Swin-T — 93.94%
DenseNet-121 — 93.87%
ViT-B/16 — 93.87%
EfficientNet-B0 — 91.56%
Custom CNN — 78.12%

Also includes U-Net segmentation (Dice 0.886), Grad-CAM + Attention Rollout explainability, FastAPI backend, and reproducible training notebooks.

MIT licensed and fully reproducible.

🔗 github.com/malikmahmad/NeuroScan

#MedicalAI #DeepLearning #PyTorch #ComputerVision #OpenSource #BrainTumor #ResearchEngineering #VisionTransformer #MedicalImaging #HealthcareAI #MachineLearning #AIResearch #FastAPI


================================================================
PUBLISHING ORDER
Step 1 — Article publish karo
Step 2 — 5-10 min wait
Step 3 — Post karo

IMAGES (4 jagah):
1. After "What's Inside NeuroScan" → Architecture diagram
2. After "Benchmark Results" → Cover/benchmark image
3. After "Explainability" → Grad-CAM vs Attention Rollout
4. After "Engineering" → Project structure
================================================================
