---
title: Project Overview
kind: Overview
order: 1
status: ready
updated: 2026-11-28
summary: Can a simple hand drawing reveal Parkinson's disease? A comparison of three deep-learning models on spiral and wave drawings.
---

## The idea
Parkinson's disease often shows first in the hands: a tremor, slow and stiff movement. Ask someone to trace a **spiral** or a **wave**, and those changes appear as shaky, uneven, broken lines. This project teaches a computer to see that difference in a photo of the drawing and say **healthy** or **parkinson**.

> A learning and research project — a screening aid at most, never a diagnosis. Diagnosis needs a neurologist.

## Dataset
*Parkinson Disease Detection* by Gokul on Roboflow Universe (public domain): hand-drawn spiral and wave images labelled **healthy** or **parkinson**, roughly 200 images in total. It is split into train / validation / test (70 / 20 / 10), and checked before training:
- class balance (class weights fix any imbalance)
- image sizes and channels
- corrupt files, exact duplicates (MD5) and near-duplicates (perceptual hash)
- **leakage** — the same drawing must never sit in both train and test

## Pipeline

| Step | What happens |
|---|---|
| Load | Every image path, split and label into one table |
| Explore | Class counts, sample grid, pixel-intensity histograms |
| Clean | Corrupt / duplicate / cross-split leakage removal |
| Preprocess | RGB, 224 × 224, normalised the way each model expects |
| Augment *(train only)* | Horizontal flip, ±10° rotation, 10% zoom and shift, brightness, contrast |
| Train | Class weights, early stopping, learning-rate reduction, best-model checkpoint |
| Evaluate | Accuracy, precision, recall (sensitivity), specificity, F1, ROC-AUC, confusion matrix |
| Explain | Misclassified images + **Grad-CAM** heatmaps |

## Three models, compared

| Model | How it learns |
|---|---|
| **CNN from scratch** | 3 convolution blocks (32 → 64 → 128 filters) with batch-norm and pooling, dropout, one sigmoid output |
| **VGG16** | ImageNet-pretrained features + a small new head; head trained first, then the last 20 layers fine-tuned at a tiny learning rate |
| **ResNet50** | Same two-phase transfer learning, with residual (skip) connections that let a 50-layer network train well |

The best model is picked by **F1**, with **recall** as the tie-breaker — in medicine, missing a real patient costs more than a false alarm.

## Seeing what the model sees
**Grad-CAM** colours the parts of the drawing that drove the decision. If the heat sits on the spiral's lines — not on the paper or the background — the model is looking at the right thing.

## Demo
A small **Gradio** app: upload a drawing → prediction, confidence and heatmap, with a dropdown to compare all three models side by side.

## Tech
Python · TensorFlow / Keras · NumPy · pandas · scikit-learn · Matplotlib · Gradio · Jupyter

## Status
- ✅ Full pipeline built and tested end to end — notebook, all three models, Grad-CAM, demo app
- ⏳ Training on the real dataset — next
- ⏳ Results, live demo link and code link — after training

## Honest limits
- About 200 images is small; test-set scores can swing. Cross-validation is the next step.
- The dataset doesn't document how labels were made.
- Future: more data, k-fold validation, and combining drawings with voice or gait for a multimodal model.
