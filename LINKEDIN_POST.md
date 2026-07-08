================================================================
1. ARTICLE TITLE
================================================================

What Happens When Architecture Is the Only Variable? Benchmarking Seven Deep Learning Models for Brain Tumor MRI


================================================================
2. ARTICLE BODY
(LinkedIn Article editor mein paste karo — no markdown tables, pure LinkedIn-native formatting)
================================================================

Most brain tumor MRI repositories report a single accuracy number. Far fewer answer a more fundamental question:

How much of the final performance comes from the model architecture itself, and how much comes from differences in preprocessing, data splits, augmentation, or training strategy?

That question became the motivation behind NeuroScan — an open-source medical imaging research project that compares seven modern deep learning architectures for four-class brain tumor MRI classification under identical experimental conditions.

Rather than pursuing the highest possible benchmark score, NeuroScan focuses on controlled experimentation. Every model is trained using the same dataset, preprocessing pipeline, augmentation strategy, optimizer, learning-rate schedule, hardware, and evaluation protocol, allowing architecture to be the only experimental variable.

Beyond classification, the repository also includes automatic U-Net segmentation, architecture-aware explainability, a production-style FastAPI backend, automated testing, and fully reproducible training notebooks.

🔗 Repository: github.com/malikmahmad/NeuroScan

---

Project at a Glance

Task: Brain Tumor MRI Classification
Classes: 4 (Glioma, Meningioma, Pituitary, No Tumor)
Models Compared: 7
Segmentation: U-Net
Explainability: Grad-CAM + Attention Rollout
Backend: FastAPI
Testing: 17 Passing Pytest Tests
Framework: PyTorch
License: MIT

---

Key Contributions

✅ Fair benchmark across seven architectures using identical training conditions
✅ Architecture-aware explainability
   — Grad-CAM for CNNs
   — Attention Rollout for Vision Transformers
✅ Automatic U-Net tumor segmentation
✅ Production-style FastAPI inference backend
✅ 17 automated backend tests
✅ Fully reproducible Kaggle training pipeline
✅ Open-source under the MIT License

---

Why This Benchmark Matters

Deep learning papers frequently report impressive accuracy improvements, but direct comparisons are often difficult because each model is trained under different experimental conditions.

Variations in preprocessing, train-validation splits, augmentation policies, optimization strategies, and hardware can all influence reported performance.

As a result, comparing two published accuracy numbers rarely reveals the true contribution of the underlying architecture.

NeuroScan minimizes these confounding factors by keeping every aspect of the training pipeline constant except the neural network itself.

That allows the comparison to focus on architectural differences rather than experimental variability.

---

What's Inside NeuroScan

📌 (Insert Architecture Diagram Here)

NeuroScan combines multiple components into a single reproducible research pipeline.

Core Components

— Seven independent image classification models
— Automatic U-Net segmentation
— Architecture-aware explainability
— FastAPI backend (8 REST endpoints)
— MRI plausibility validation
— Kaggle-ready notebooks and evaluation scripts
— Automated testing (17 passing tests)
— Machine-readable JSON metrics

The modular architecture allows every component to remain independent while operating as one integrated pipeline.

---

The Controlled Comparison

Every classifier was trained under exactly the same experimental conditions.

Shared Training Configuration

— 224 × 224 ImageNet-normalized inputs
— Horizontal Flip, 10° Rotation, Brightness & Contrast Jitter
— AdamW Optimizer with ReduceLROnPlateau Scheduler
— Batch Size: 32
— Epochs: 15
— Hardware: NVIDIA T4 GPU

The only variable between experiments is the model architecture.

Model Configuration

Custom CNN
   Total Parameters: 0.42M
   Trainable: 0.42M (100%)
   Pretraining: None

EfficientNet-B0
   Total Parameters: 4.01M
   Trainable: 1.13M
   Pretraining: ImageNet-1K

MobileNetV3-Large
   Total Parameters: 4.21M
   Trainable: 2.99M
   Pretraining: ImageNet-1K

DenseNet-121
   Total Parameters: 6.96M
   Trainable: 2.16M
   Pretraining: ImageNet-1K

ResNet-50
   Total Parameters: 23.52M
   Trainable: 14.97M
   Pretraining: ImageNet-1K

Swin-T
   Total Parameters: 27.52M
   Trainable: 15.37M
   Pretraining: ImageNet-1K

ViT-B/16
   Total Parameters: 85.80M
   Trainable: 7.09M
   Pretraining: ImageNet-1K

All parameter counts were computed directly from the model definitions.

---

Results

📌 (Insert Benchmark Figure Here)

Held-Out Test Set — 1,600 Images (400 per Class)

🥇 ResNet-50
   Accuracy: 95.25%   |   Macro F1: 0.951   |   ROC-AUC: 0.991

Swin-T
   Accuracy: 94.81%   |   Macro F1: 0.947   |   ROC-AUC: 0.990

ViT-B/16
   Accuracy: 94.69%   |   Macro F1: 0.946   |   ROC-AUC: 0.990

DenseNet-121
   Accuracy: 94.25%   |   Macro F1: 0.941   |   ROC-AUC: 0.986

MobileNetV3-Large
   Accuracy: 94.25%   |   Macro F1: 0.941   |   ROC-AUC: 0.991

EfficientNet-B0
   Accuracy: 91.56%   |   Macro F1: 0.913   |   ROC-AUC: 0.985

Custom CNN
   Accuracy: 78.19%   |   Macro F1: 0.769   |   ROC-AUC: 0.926

The objective of NeuroScan is not to claim a new state-of-the-art result. Instead, it provides a transparent, reproducible benchmark for fair architectural comparison.

Key Observations

— Transfer learning improves performance dramatically
— ResNet-50 achieved the highest overall accuracy
— Performance among pretrained models differs by only ~1%
— Glioma remains the most challenging class
— U-Net achieved Dice = 0.886 and IoU = 0.856

---

Comparison with Published Literature

ResNet-50 (NeuroScan)
   Accuracy: 95.25%
   Training Strategy: Layer4 Fine-Tuning

ViT-B/16 (NeuroScan)
   Accuracy: 94.69%
   Training Strategy: Last Encoder Block Fine-Tuning

EfficientNetV2b0 — Hassan & Ghadiri, 2025
   Accuracy: 99.16%
   Training Strategy: Full Backbone Fine-Tuning

EfficientNetV2 + Attention — Pacal, 2024
   Accuracy: 99.76%
   Training Strategy: Full Fine-Tuning + Attention Modules

Unlike published work, NeuroScan intentionally limits fine-tuning to maintain equal training effort across every architecture.

---

Explainability

📌 (Insert Grad-CAM vs Attention Rollout Figure Here)

CNNs and Vision Transformers require different explainability techniques.

— CNNs → Grad-CAM
— Vision Transformers → Attention Rollout

Rather than applying Grad-CAM everywhere, NeuroScan automatically selects the correct explanation method for each architecture.

---

Reproducibility

Reproducibility is a central design principle of NeuroScan.

Every metric is generated directly from evaluation scripts and stored as machine-readable JSON rather than being manually copied into documentation.

Included in the repository:

— Training notebooks
— Evaluation scripts
— Backend APIs
— Inference pipeline
— Kaggle environment
— Checkpoint loading
— Automated metrics generation

No reported metric is manually copied into the documentation.

---

Engineering Beyond Model Training

📌 (Insert Project Structure Figure Here)

Unlike many research repositories, NeuroScan was designed as both a research project and a software engineering project.

It includes:

— FastAPI Backend
— Modular Architecture
— Lazy Checkpoint Loading
— Automated Testing
— MRI Validation
— JSON Metrics Pipeline
— Explainability APIs
— Integrated U-Net Pipeline
— Docker-Ready Deployment

---

Current Limitations

Every research project has limitations. NeuroScan currently includes the following:

— MRI validation uses a heuristic rather than a clinical quality assessment model
— Ensemble inference has not yet been benchmarked
— Segmentation remains 2D
— CORS settings are intended for local development
— No external clinical validation has been performed

NeuroScan is intended solely for research and educational purposes. It is not a diagnostic system.

---

Future Work

Short-Term Goals
— Ensemble Benchmarking
— Monte Carlo Dropout
— ROC Curves
— Precision–Recall Curves

Long-Term Goals
— Cross-Dataset Validation
— 3D Volumetric Segmentation
— Native DICOM Support
— Additional Explainability Methods

---

A Personal Note

Building NeuroScan taught me considerably more than how to train neural networks.

It reinforced the importance of controlled experimentation, reproducibility, and transparent reporting — principles that become even more important in medical AI.

The most difficult part wasn't writing code. It was resisting the temptation to optimize for better-looking numbers by changing data splits, tuning comparisons, or omitting limitations.

The value of a reproducible benchmark is not that it reports the highest accuracy. Its value is that someone else can run the same experiment, inspect every implementation detail, and arrive at the same conclusions.

---

References

Abnar, S., & Zuidema, W. (2020). Quantifying Attention Flow in Transformers. ACL 2020.
Dosovitskiy et al. (2021). An Image is Worth 16x16 Words. ICLR 2021.
Liu et al. (2021). Swin Transformer. ICCV 2021.
He et al. (2016). Deep Residual Learning for Image Recognition. CVPR 2016.
Huang et al. (2017). Densely Connected Convolutional Networks. CVPR 2017.
Tan & Le (2019). EfficientNet. ICML 2019.
Ronneberger et al. (2015). U-Net. MICCAI 2015.
Selvaraju et al. (2017). Grad-CAM. ICCV 2017.
Hassan & Ghadiri (2025). Computers in Biology and Medicine.
Pacal (2024). Cluster Computing.
Buda, Saha & Mazurowski (2019). Computers in Biology and Medicine.

---

Closing Thoughts

Reproducible research creates far more long-term value than isolated benchmark numbers.

My hope is that NeuroScan serves as a transparent baseline that students, researchers, and engineers can inspect, reproduce, extend, and improve. Whether it becomes a teaching resource, a starting point for future work, or simply a reference for fair benchmarking practices, the project will have achieved its purpose.

If you find NeuroScan useful, I'd be grateful for your feedback. Feel free to open an issue, contribute improvements, or star the repository if you'd like to support the project.

🔗 github.com/malikmahmad/NeuroScan


================================================================
3. "TELL YOUR NETWORK" POST
(Article publish hone ke 5-10 min baad paste karo)
================================================================

🧠 Same MRI. Same data. Same training pipeline. Seven different deep learning models.

The only variable?

The architecture itself.

That's the idea behind NeuroScan — an open-source research project comparing seven deep learning architectures for brain tumor MRI classification under identical experimental conditions.

Held-out test set (1,600 MRI images):

🥇 ResNet-50 — 95.25%
Swin-T — 94.81%
ViT-B/16 — 94.69%
DenseNet-121 — 94.25%
MobileNetV3-Large — 94.25%
EfficientNet-B0 — 91.56%
Custom CNN — 78.19%

Beyond classification, the project also includes U-Net segmentation, architecture-aware explainability, a FastAPI backend, reproducible training notebooks, and is fully open-source under the MIT License.

I'd love to hear your thoughts and feedback.

🔗 github.com/malikmahmad/NeuroScan

#MedicalAI #DeepLearning #PyTorch #ComputerVision #OpenSource #BrainTumor #ResearchEngineering #VisionTransformer #MedicalImaging #HealthcareAI #MachineLearning #AIResearch #FastAPI


================================================================
PUBLISHING ORDER
================================================================

Step 1 — Article publish karo
Step 2 — 5-10 minutes wait karo
Step 3 — "Tell your network" post karo

NOTE: Article mein 4 jagah images insert karni hain:
1. After "What's Inside NeuroScan" → Architecture diagram
2. After "Results" heading → Benchmark/cover image
3. After "Explainability" heading → Grad-CAM vs Attention Rollout
4. After "Engineering Beyond Model Training" → Project structure
================================================================
