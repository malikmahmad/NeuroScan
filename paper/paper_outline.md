# NeuroScan: A Controlled Seven-Architecture Benchmark for Explainable Brain Tumor MRI Classification and Segmentation

**Malik Muhammad Ahmad**
Department of Information Technology
MNS University of Engineering and Technology, Multan, Pakistan
<!-- TODO: replace with real email before submission -->

---

## Abstract

Automated brain tumor classification from MRI presents a clinically significant challenge, yet most published deep learning work reports performance for a single architecture without establishing whether observed gains stem from the model itself or from differences in preprocessing, data splits, or training protocols. This paper presents NeuroScan, a controlled benchmark evaluating seven deep learning architectures — Custom CNN, EfficientNet-B0, MobileNetV3-Large, DenseNet-121, ResNet-50, Swin-T, and ViT-B/16 — under a standardized common training protocol applied to the same dataset and splits. All models are evaluated on a held-out 1,600-image test set. ResNet-50 achieves the best performance among the evaluated architectures at 95.44% accuracy (Macro F1: 0.954, ROC-AUC: 0.990, 95% CI: [94.30, 96.36]%). Under the standardized transfer-learning configurations evaluated here, pretrained architectures substantially outperform the scratch-trained baseline (78.12%), while performance differences among pretrained models are comparatively smaller (91.56%–95.44%). A dedicated ablation training ResNet-50 from scratch under the identical protocol decomposes the observed gap: moving from scratch-trained Custom CNN to scratch-trained ResNet-50 improved accuracy by 11.81 percentage points, while adding ImageNet pretraining to ResNet-50 provided a further 5.44-percentage-point improvement — indicating that both architectural capacity and pretraining contribute to the overall performance difference, though their individual contributions are partially confounded by the parameter-count difference between the two scratch-trained models. McNemar's exact test confirms that ResNet-50's advantage over all six competitors is statistically significant (all p ≤ 0.005). The system integrates a U-Net segmentation model achieving Dice 0.886 and IoU 0.856, and implements architecture-specific visualization methods: Grad-CAM for convolutional models, standard Attention Rollout for ViT-B/16, and a separate attention-based visualization for Swin-T. All code, training notebooks, and evaluation metrics are publicly available at github.com/malikmahmad/NeuroScan.

**Keywords:** Brain Tumor MRI, Deep Learning, Architecture Benchmark, Transfer Learning, Grad-CAM, Attention Rollout, U-Net Segmentation, Reproducible Research

---

## I. Introduction

Brain tumor diagnosis from MRI is a time-intensive task requiring expert radiological interpretation, subject to inter-reader variability and resource constraints in many clinical settings. Deep learning has demonstrated substantial promise in automating this task [1]–[3], yet the literature presents a fragmented picture: most published systems train and evaluate a single architecture, making it difficult to isolate whether reported accuracy improvements reflect genuine architectural advantages or differences in experimental design.

The specific gap this work addresses is the absence of fair, reproducible cross-architecture comparisons under a standardized protocol. Existing studies vary in dataset splits, augmentation policies, optimization strategies, and hardware — making direct numerical comparisons unreliable. A researcher seeking to select an architecture for a new medical imaging task cannot reliably conclude, from the existing literature, whether a reported accuracy gap is architectural or experimental in origin.

NeuroScan addresses this gap by evaluating seven architecturally distinct models under a standardized training protocol with architecture-specific partial fine-tuning of the final feature-extraction stage(s). The models span a custom CNN trained from scratch, five transfer-learned convolutional networks of varying depth and design, a hierarchical transformer (Swin-T), and a pure attention transformer (ViT-B/16). Beyond classification, the system integrates U-Net tumor segmentation and implements architecture-specific visualization methods: Grad-CAM for convolutional architectures, standard Attention Rollout for ViT-B/16, and a separate attention-based visualization for Swin-T.

We do not claim state-of-the-art performance, clinical readiness, or that architecture alone explains the observed performance differences. We provide a standardized seven-model benchmark and investigate how pretrained architectures compare under a common protocol.

**Contributions of this work:**

1. A seven-architecture classification benchmark (CNN / EfficientNet-B0 / MobileNetV3-Large / DenseNet-121 / ResNet-50 / Swin-T / ViT-B/16) evaluated under a standardized training protocol with architecture-specific partial fine-tuning of the final feature-extraction stage(s), using identical datasets, splits, preprocessing, augmentation, optimizer, learning rate, scheduler, batch size, and number of training epochs.

2. Empirical quantification via ablation: ResNet-50 trained from scratch (90.00%) vs. pretrained (95.44%) under the identical protocol isolates ImageNet pretraining as contributing +5.44 percentage points, while architectural capacity differences contribute an additional +11.81 pp (Custom CNN scratch 78.12% vs. ResNet-50 scratch 90.00%). Both factors contribute meaningfully to the observed performance gap — neither alone accounts for the full 17.32 pp difference between the scratch-trained CNN baseline and the best pretrained model.d performance gap — neither alone accounts for the full 17.32 pp difference between the scratch-trained CNN baseline and the best pretrained model.

3. Integration of U-Net segmentation (Dice 0.886, IoU 0.856) providing spatial tumor localization beyond class-level prediction.

4. Architecture-specific visualization methods implemented across all models: Grad-CAM applied to the five convolutional architectures using spatial feature activations; standard Attention Rollout applied to ViT-B/16; a separate attention-based visualization for Swin-T.

5. A fully reproducible implementation: training notebooks, evaluation scripts, FastAPI inference backend, and all metrics in machine-readable JSON, publicly released under the MIT License.

---

## II. Related Work

### A. CNN-Based Brain Tumor Classification

Early deep learning approaches to brain tumor MRI classification relied on custom convolutional architectures trained from scratch [4]. Subsequent work demonstrated that transfer learning from ImageNet-pretrained models substantially improves performance even on small medical imaging datasets [5]. ResNet-50 and DenseNet-121 have been widely applied to this task, with reported accuracies varying substantially depending on dataset, split strategy, and training protocol [6], [7].

### B. Transfer Learning Variants

EfficientNet architectures have shown strong performance on brain tumor MRI with transfer learning. Hassan and Ghadiri (2025) report 99.16% accuracy using EfficientNetV2b0 with transfer learning and fine-tuning [9]. Pacal et al. (2024) report 99.76% by enhancing EfficientNetV2 with Global Attention Mechanism (GAM) and Efficient Channel Attention (ECA) modules [10]. These results were produced under different experimental conditions — different datasets, preprocessing pipelines, and architectural configurations — and are not directly comparable to results obtained under the constrained partial fine-tuning protocol used in this work.

### C. Vision Transformers in Medical Imaging

Dosovitskiy et al. (2021) introduced ViT-B/16, demonstrating competitive performance with CNNs when pretrained at scale [11]. Swin Transformer (Liu et al., 2021) introduced hierarchical shifted-window attention, enabling multi-scale feature learning [12]. Both have been applied to medical imaging classification tasks, though controlled comparisons against CNNs under identical protocols remain limited.

### D. Segmentation

U-Net (Ronneberger et al., 2015) remains the standard architecture for medical image segmentation [13]. Applied to the LGG MRI Segmentation dataset, published Dice scores range from 0.84 to 0.92 depending on training protocol and evaluation split [14]. This work achieves Dice 0.886 on a stratified held-out test set.

### E. Explainability

Grad-CAM (Selvaraju et al., 2017) generates class-discriminative heatmaps by computing the gradient of the predicted class score with respect to spatial convolutional feature maps [15]. Attention Rollout (Abnar and Zuidema, 2020) provides an alternative for transformer architectures by composing self-attention matrices across encoder layers to produce patch-level attribution maps [16]. The appropriate method depends on the architecture being explained.

---

## III. Methodology

### A. Datasets

**Classification:** The Brain Tumor MRI Dataset (Nickparvar, Kaggle) [17] contains 7,200 axial MRI slices across four balanced classes: Glioma (1,800), Meningioma (1,800), No Tumor (1,800), and Pituitary Tumor (1,800). The provided train/test split yields 5,600 training images and 1,600 test images (400 per class). A 15% validation split from training gives 4,760 training and 840 validation images, stratified by class. All splits use a fixed random seed (42) for reproducibility.

**Dataset limitation — image-level vs. patient-level:** The Nickparvar dataset aggregates images from multiple sources including the SARTAJ dataset. Patient-level independence between training and test sets cannot be verified from the available metadata, as patient identifiers are not provided. The original dataset provides an image-level train/test split, which is used as-is. **Because patient identifiers are unavailable, patient-level separation between training, validation, and test sets cannot be established. Consequently, the reported classification performance should be interpreted strictly as performance on the provided image-level benchmark split and should not be interpreted as an estimate of generalization to unseen patients.** The SARTAJ-sourced glioma subset has documented label inconsistencies [17], which may contribute to the lower observed glioma F1 across all models.

Preprocessing: resize to 224×224, ImageNet normalization (mean [0.485, 0.456, 0.406], std [0.229, 0.224, 0.225]). Augmentation during training only: random horizontal flip (p=0.5), random rotation (±10°), color jitter (brightness=0.15, contrast=0.15).

**Segmentation:** The LGG MRI Segmentation dataset (Buda et al., 2019) [14] contains 3,929 FLAIR axial slice/mask pairs from 110 patients. Tumor-positive slices: 1,373 (35%); tumor-negative: 2,556 (65%). Split: 70% train / 15% validation / 15% test, stratified by tumor presence. Preprocessing: resize to 256×256, same ImageNet normalization.

### B. Model Architectures

All seven classifiers share identical input processing and produce 4-class logits. Table I summarizes architectural characteristics.

**Table I — Architecture Summary**

| Model | Total Params | Trainable Params | Pretraining | Unfrozen Components |
|---|---|---|---|---|
| Custom CNN | 0.42M | 0.42M (100%) | None | All |
| EfficientNet-B0 | 4.01M | 1.13M | ImageNet-1K | Last 2 blocks + head |
| MobileNetV3-Large | 4.21M | 2.99M | ImageNet-1K | Last 3 blocks + head |
| DenseNet-121 | 6.96M | 2.16M | ImageNet-1K | DenseBlock4 + norm5 + head |
| ResNet-50 | 23.52M | 14.97M | ImageNet-1K | Layer4 + head |
| Swin-T | 27.52M | 15.37M | ImageNet-1K | Last Swin stage + head |
| ViT-B/16 | 85.8M | 7.09M | ImageNet-1K | Last encoder block + head |

All parameter counts computed from model definitions in `backend/app/models.py`.

Note: trainable parameter counts differ across architectures (2.99M–14.97M for pretrained models) because each architecture has a different number of parameters in its last stage. The fine-tuning policy is standardized (last stage + head), but the computational effort is not equal. Results should be interpreted accordingly.

**Custom CNN:** Four convolutional blocks (3→32→64→128→256 channels, each Conv2D + BatchNorm + ReLU + MaxPool2D), AdaptiveAvgPool2D(1×1), Flatten, Dropout(0.3) + Linear(256→128) + ReLU, Dropout(0.3) + Linear(128→4).

**EfficientNet-B0, MobileNetV3-Large, DenseNet-121, ResNet-50:** torchvision ImageNet-pretrained weights. Architecture-specific final stages unfrozen as detailed in Table I. Replaced classifier heads as described above.

**Swin-T:** timm ImageNet-pretrained `swin_tiny_patch4_window7_224`. Last Swin stage + head unfrozen.

**ViT-B/16:** torchvision ImageNet-pretrained ViT-B/16. Last encoder block + replaced head (Linear(768→4)) unfrozen.

**U-Net:** Standard encoder-decoder with 4 encoding stages (32→64→128→256 channels), bottleneck (512 channels), 4 decoding stages with skip connections, single-channel sigmoid output. Loss: Dice + Binary Cross-Entropy.

### C. Training Protocol

**Table II — Standardized Training Configuration**

| Hyperparameter | Classification | Segmentation |
|---|---|---|
| Input size | 224 × 224 | 256 × 256 |
| Optimizer | AdamW, lr=1e-4, wd=1e-4 | AdamW, lr=1e-4, wd=1e-4 |
| LR Scheduler | ReduceLROnPlateau (factor=0.5, patience=2) | ReduceLROnPlateau |
| Loss | Cross-Entropy | Dice + BCE |
| Epochs | 15 | 25 |
| Batch size | 32 | 16 |
| Hardware | NVIDIA T4 GPU (Kaggle) | NVIDIA T4 GPU (Kaggle) |
| Random seed | 42 | 42 |

Best checkpoint selected by validation accuracy (classifiers) or validation Dice (U-Net). All seven classifiers use the same training loop implementation with no model-specific hyperparameter tuning.

### D. Explainability Methods

**Grad-CAM [15]:** Applied to CNN, EfficientNet-B0, MobileNetV3-Large, DenseNet-121, and ResNet-50. Grad-CAM is applied to the convolutional architectures using spatial feature activations from their final convolutional stages: the gradient of the predicted class score is computed with respect to the target layer's feature activations, pooled per channel to obtain importance weights, combined with the activations, passed through ReLU, and bilinearly upsampled to input resolution.

Target layers: `model[14]` (CNN BatchNorm before pooling), `model.features[-1]` (EfficientNet-B0, MobileNetV3), `model.features.denseblock4` (DenseNet-121), `model.layer4[-1]` (ResNet-50).

**Attention Rollout for ViT-B/16 [16]:** For ViT-B/16, standard Attention Rollout is applied: attention matrices from all 12 encoder layers are extracted via forward hooks, each has the identity added to account for residual connections and is row-normalized, and matrices are composed by sequential multiplication. The CLS token row of the final composed matrix is reshaped to a 14×14 spatial patch grid and bilinearly upsampled to input resolution.

**Attention-based visualization for Swin-T:** For Swin-T, the windowed attention mechanism differs fundamentally from ViT's global self-attention — Swin-T does not employ a global CLS token. The implemented visualization hooks the final LayerNorm output, which has shape (1, H, W, C) = (1, 7, 7, 768) for 224×224 input, and averages across the channel dimension to produce a 7×7 spatial importance map that is bilinearly upsampled to input resolution. This is described as a Swin feature-activation visualization rather than standard Attention Rollout. Qualitative inspection across four tumor classes confirms that the resulting heatmaps are spatially consistent with expected tumor locations for glioma and pituitary tumor classes, and less clearly localized for no-tumor and meningioma. This visualization is presented as exploratory and should not be used to support strong interpretability claims without further quantitative validation.

### E. Evaluation Metrics

Classification: accuracy, macro-averaged F1, weighted F1, ROC-AUC (one-vs-rest). Segmentation: Dice coefficient, IoU. All metrics computed on held-out test sets not used during training or validation checkpoint selection.

Statistical note: 95% confidence intervals and McNemar's test for pairwise model comparisons are recommended before formal submission but are not included in the current manuscript.

---

## IV. Results

### A. Classification Performance

**Table III — Classification Results, Held-Out Test Set (1,600 images, 400 per class)**

| Model | Total Params | Trainable | Accuracy | 95% CI | Macro F1 | Weighted F1 | ROC-AUC |
|---|---|---|---|---|---|---|---|
| Custom CNN | 0.42M | 0.42M | 78.12% | [76.03, 80.08] | 0.769 | 0.769 | 0.926 |
| EfficientNet-B0 | 4.01M | 1.13M | 91.56% | [90.10, 92.83] | 0.913 | 0.913 | 0.985 |
| DenseNet-121 | 6.96M | 2.16M | 93.87% | [92.59, 94.95] | 0.937 | 0.937 | 0.989 |
| MobileNetV3-Large | 4.21M | 2.99M | 94.13% | [92.86, 95.18] | 0.940 | 0.940 | 0.988 |
| Swin-T | 27.52M | 15.37M | 93.94% | [92.66, 95.00] | 0.938 | 0.938 | 0.987 |
| ViT-B/16 | 85.8M | 7.09M | 93.87% | [92.59, 94.95] | 0.937 | 0.937 | 0.991 |
| **ResNet-50** | **23.52M** | **14.97M** | **95.44%** | **[94.30, 96.36]** | **0.954** | **0.954** | **0.990** |

95% confidence intervals computed using the Wilson score method on the 1,600-image held-out test set.

### B. Per-Class F1, ResNet-50

**Table IV — Per-Class F1, ResNet-50 (Best Model)**

| Class | F1-Score |
|---|---|
| Glioma | 0.910 |
| Meningioma | 0.940 |
| No Tumor | 0.971 |
| Pituitary Tumor | 0.994 |

### C. Statistical Significance

**Table V — McNemar's Test: ResNet-50 vs. Each Competitor (1,600 paired test predictions)**

| Comparison | b (ResNet-50 correct, other wrong) | c (other correct, ResNet-50 wrong) | p-value | Significant (α=0.05) |
|---|---|---|---|---|
| ResNet-50 vs CNN | 283 | 6 | < 0.0001 | Yes |
| ResNet-50 vs EfficientNet-B0 | 75 | 13 | < 0.0001 | Yes |
| ResNet-50 vs DenseNet-121 | 40 | 15 | 0.0010 | Yes |
| ResNet-50 vs MobileNetV3 | 36 | 15 | 0.0046 | Yes |
| ResNet-50 vs Swin-T | 38 | 14 | 0.0012 | Yes |
| ResNet-50 vs ViT-B/16 | 38 | 13 | 0.0006 | Yes |

McNemar's exact test applied to paired binary correct/incorrect vectors on the held-out test set. ResNet-50's advantage over all six competitors is statistically significant at α = 0.05. b = cases where ResNet-50 is correct and the competitor is wrong; c = cases where the competitor is correct and ResNet-50 is wrong.

### D. Segmentation Performance

**Table VI — U-Net, Held-Out Test Set (589 slices)**

| Metric | Score |
|---|---|
| Dice Coefficient | 0.886 |
| IoU (Jaccard) | 0.856 |

### E. Comparison with Published Literature

**Table VII — Context with Published Results on Brain Tumor MRI Classification**

| Method | Accuracy | Training / Adaptation | Reference |
|---|---|---|---|
| ResNet-50 (this work) | 95.44% | Partial fine-tuning (last stage only) | — |
| ViT-B/16 (this work) | 93.87% | Partial fine-tuning (last encoder block) | — |
| EfficientNetV2b0 | 99.16% | Transfer learning + fine-tuning | [9] |
| EfficientNetV2 + GAM + ECA | 99.76% | Transfer learning + attention modules | [10] |

These results were obtained under different datasets, splits, preprocessing, training strategies, and architectural configurations and are therefore provided as contextual literature comparisons rather than direct head-to-head comparisons. The performance gap reflects these methodological differences rather than a ceiling for the architectures evaluated in this work.

---

## V. Discussion

### A. Pretrained vs. Scratch-Trained Performance

The most prominent finding is the performance gap between the scratch-trained models and pretrained models. A dedicated ablation was conducted training ResNet-50 from scratch under the identical protocol (same architecture, same hyperparameters, same splits, same 15 epochs, weights=None).

**Table VIII — Ablation: Effect of ImageNet Pretraining (ResNet-50, same protocol)**

| Model | Accuracy | Macro F1 | ROC-AUC |
|---|---|---|---|
| ResNet-50 (ImageNet pretrained) | 95.44% | 0.954 | 0.990 |
| ResNet-50 (trained from scratch) | 90.00% | 0.898 | 0.968 |
| Custom CNN (trained from scratch) | 78.12% | 0.769 | 0.926 |
| **Pretraining gain (ResNet-50)** | **+5.44 pp** | **+0.056** | **+0.022** |

This ablation isolates two distinct contributions. First, ImageNet pretraining contributes 5.44 percentage points of accuracy when architecture and all other conditions are held constant (ResNet-50 scratch 90.00% vs. pretrained 95.44%). Second, architectural capacity contributes an additional 11.81 percentage points (Custom CNN scratch 78.12% vs. ResNet-50 scratch 90.00%), as these models differ in architecture and parameter count but share the same from-scratch initialization. Both pretraining and architectural capacity contribute meaningfully to the observed performance differences — neither alone accounts for the full gap between the scratch-trained CNN baseline and the best pretrained model.

Pretrained models improved accuracy by 13.44–17.32 percentage points over the scratch-trained CNN (78.12%), consistent with findings in the transfer learning literature [5], [8]. The ablation decomposes this gap into two components: architectural capacity (+11.81 pp, CNN scratch vs. ResNet-50 scratch) and ImageNet pretraining (+5.44 pp, ResNet-50 scratch vs. pretrained). These components are not fully independent — the two scratch-trained models also differ in parameter count — but the ResNet-50 ablation directly evaluates the contribution of ImageNet initialization while holding the architecture constant.

### B. Performance Among Pretrained Models

Within the pretrained group, accuracy ranges from 91.56% (EfficientNet-B0) to 95.44% (ResNet-50) — a spread of 3.88 percentage points. Four of the six pretrained models cluster within approximately 1.57 percentage points of each other (93.87%–95.44%). Under the standardized protocol used in this study, the choice among these architectures has a substantially smaller effect than the decision to use pretraining.

McNemar's exact test confirms that ResNet-50's advantage over every competitor is statistically significant at α = 0.05 (all p < 0.005), including against the three nearest competitors: DenseNet-121 (p = 0.0010), Swin-T (p = 0.0012), and ViT-B/16 (p = 0.0006). The b/c ratios indicate that ResNet-50 corrects substantially more errors than its competitors make relative to it.

This finding is conditional on the specific fine-tuning depth used (last stage only). Different fine-tuning depths would likely produce different relative rankings.

### C. ResNet-50 as Best Performing Model

ResNet-50 achieves the best performance (95.44%) among the seven architectures under the evaluated protocol. Its superiority over all six competitors is confirmed as statistically significant by McNemar's exact test. Despite having fewer trainable parameters than Swin-T (14.97M vs. 15.37M), ResNet-50 outperforms it (95.44% vs. 93.94%). ViT-B/16 achieves 93.87% with only 7.09M trainable parameters, suggesting that frozen pretrained features contribute significantly to performance even without extensive fine-tuning.

### D. Glioma Classification Difficulty

Glioma achieves the lowest per-class F1 across all seven models. This pattern is consistent across architectures and may be attributable in part to label inconsistencies in the SARTAJ-sourced glioma subset [17]. No causal analysis has been conducted; this is an observation reported without adjustment.

### E. Segmentation

U-Net achieves Dice 0.886 on the held-out LGG segmentation test set, within the published range for this dataset (0.84–0.92 [14]). The model operates on 2D axial slices independently; volumetric context between slices is not incorporated, which is the primary limitation for clinical applicability.

### F. Explainability

Grad-CAM is applied to the five convolutional architectures using spatial feature activations from their final convolutional stages. Standard Attention Rollout is applied to ViT-B/16 by composing self-attention matrices across its 12 encoder layers and projecting the resulting CLS-token attribution to the input image. For Swin-T, a separate attention-based visualization is used that averages spatial attention output maps from the final Swin stage and upsamples them to the input resolution. This visualization is not described as standard Attention Rollout, because Swin-T uses hierarchical windowed attention and does not employ a global CLS token in the same manner as ViT-B/16. The Swin-T visualization is therefore presented as an exploratory attention-based visualization and should undergo further validation before being used to support strong interpretability claims.

---

## VI. Conclusion

This paper presents NeuroScan, a controlled seven-architecture benchmark for brain tumor MRI classification under a standardized training protocol with architecture-specific partial fine-tuning of the final feature-extraction stage(s). ResNet-50 achieved the highest accuracy among the seven architectures (95.44%, 95% CI: [94.30, 96.36]%), and its advantage over all six competitors is confirmed as statistically significant by McNemar's exact test (all p ≤ 0.005). The central empirical finding is supported by a dedicated ablation: the ResNet-50 scratch ablation directly evaluates the contribution of ImageNet initialization while holding the ResNet-50 architecture and training protocol constant. Under this protocol, moving from scratch-trained Custom CNN to scratch-trained ResNet-50 improved accuracy by 11.81 percentage points, while adding ImageNet pretraining to ResNet-50 provided a further 5.44-percentage-point improvement (90.00% scratch vs. 95.44% pretrained). The observed gap is decomposed into these two components — architectural capacity and pretraining — though they are not fully independent given the parameter-count difference between the two scratch-trained models. U-Net segmentation achieves Dice 0.886. Architecture-specific visualization methods are implemented across all models, using Grad-CAM for convolutional architectures, standard Attention Rollout for ViT-B/16, and a separate attention-based visualization for Swin-T.

The benchmark does not claim state-of-the-art performance relative to fully fine-tuned architectures, nor clinical readiness, nor patient-level generalization. Its value lies in reproducibility, statistical validation, and the controlled comparison under a standardized protocol: every reported number can be traced to a training run, and the entire pipeline is publicly available.

**Future work:** Swin-T attention visualization validation; 3D volumetric segmentation; cross-dataset validation; DICOM input support; MC Dropout uncertainty quantification; ablation of fine-tuning depth (full backbone vs. last stage).

---

## Acknowledgments

The author thanks the Kaggle platform for providing free GPU compute (NVIDIA T4) used for all training experiments. Datasets are used under their respective licenses: CC BY-SA 4.0 (Nickparvar brain tumor dataset) and CC BY-NC-SA 4.0 (LGG MRI Segmentation dataset).

---

## References

[1] B. H. Menze et al., "The multimodal brain tumor image segmentation benchmark (BRATS)," *IEEE Trans. Med. Imaging*, vol. 34, no. 10, pp. 1993–2024, Oct. 2015.

[2] N. Gordillo, E. Montseny, and P. Sobrevilla, "State of the art survey on MRI brain tumor segmentation," *Magn. Reson. Imaging*, vol. 31, no. 8, pp. 1426–1438, 2013.

[3] S. Bakas et al., "Advancing the cancer genome atlas glioma MRI collections with expert segmentation labels and radiomic features," *Sci. Data*, vol. 4, Article 170117, 2017.

[4] A. Sajjad et al., "Multi-grade brain tumor classification using deep CNN with extensive data augmentation," *J. Comput. Sci.*, vol. 30, pp. 174–182, 2019.

[5] C. Szegedy et al., "Rethinking the inception architecture for computer vision," in *Proc. CVPR*, Las Vegas, NV, 2016, pp. 2818–2826.

[6] K. He, X. Zhang, S. Ren, and J. Sun, "Deep residual learning for image recognition," in *Proc. CVPR*, Las Vegas, NV, 2016, pp. 770–778.

[7] G. Huang, Z. Liu, L. van der Maaten, and K. Q. Weinberger, "Densely connected convolutional networks," in *Proc. CVPR*, Honolulu, HI, 2017, pp. 4700–4708.

[8] M. Tan and Q. V. Le, "EfficientNet: Rethinking model scaling for convolutional neural networks," in *Proc. ICML*, Long Beach, CA, 2019, pp. 6105–6114.

[9] E. Hassan and H. Ghadiri, "Advancing brain tumor classification: A robust framework using EfficientNetV2 transfer learning and statistical analysis," *Comput. Biol. Med.*, vol. 185, Art. no. 109542, 2025, doi: 10.1016/j.compbiomed.2024.109542.

[10] I. Pacal, O. Celik, B. Bayram, and A. Cunha, "Enhancing EfficientNetv2 with global and efficient channel attention mechanisms for accurate MRI-Based brain tumor classification," *Cluster Comput.*, vol. 27, no. 8, pp. 11187–11212, 2024, doi: 10.1007/s10586-024-04532-1.

[11] A. Dosovitskiy et al., "An image is worth 16×16 words: Transformers for image recognition at scale," in *Proc. ICLR*, 2021.

[12] Z. Liu et al., "Swin Transformer: Hierarchical vision transformer using shifted windows," in *Proc. ICCV*, Montreal, Canada, 2021, pp. 10012–10022.

[13] O. Ronneberger, P. Fischer, and T. Brox, "U-Net: Convolutional networks for biomedical image segmentation," in *Proc. MICCAI*, Munich, Germany, 2015, pp. 234–241.

[14] M. Buda, A. Saha, and M. A. Mazurowski, "Association of genomic subtypes of lower-grade gliomas with shape features automatically extracted by a deep learning algorithm," *Comput. Biol. Med.*, vol. 109, pp. 218–225, 2019.

[15] R. R. Selvaraju, M. Cogswell, A. Das, R. Vedantam, D. Parikh, and D. Batra, "Grad-CAM: Visual explanations from deep networks via gradient-based localization," in *Proc. ICCV*, Venice, Italy, 2017, pp. 618–626.

[16] S. Abnar and W. Zuidema, "Quantifying attention flow in transformers," in *Proc. ACL*, Online, 2020, pp. 4190–4197.

[17] M. Nickparvar, "Brain tumor MRI dataset," Kaggle, 2021. [Online]. Available: https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset

---

## Appendix: Reproducibility Statement

All experiments were conducted using PyTorch 2.x, torchvision, and timm 1.0.9. Training was performed on the Kaggle Notebooks platform (NVIDIA T4 GPU, 16GB VRAM). Random seed 42 was set for Python, NumPy, and PyTorch before each training run. Model checkpoints, training histories, evaluation metrics, and confusion matrices are stored in `notebooks/outputs/metrics/` and `notebooks/outputs_segmentation/metrics/` in machine-readable JSON format. The complete codebase is available at github.com/malikmahmad/NeuroScan under the MIT License.
