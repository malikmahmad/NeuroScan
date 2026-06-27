---
name: Model improvement
about: Propose a change to one of the models — architecture, training, or loss
title: "[MODEL] "
labels: model
---

## What the current model does wrong, or where it falls short

Be specific. "ViT confuses glioma and meningioma more than I'd like" is more useful than "accuracy could be higher." If you have numbers (which class, which confusion, how often), include them.

## What you're proposing

The actual change — new architecture, different fine-tuning strategy, different loss function, different augmentation, whatever it is.

## Expected impact

Your best guess at the tradeoff. Accuracy up, but at what cost in training time, inference speed, or memory? If you don't know, say so — that's fine, it's still useful to flag the idea.

## Supporting evidence

Papers, your own experiments, results from a similar dataset elsewhere — anything that backs up why you think this would help. "I tried this on a notebook and got X" with the actual notebook linked is great. A plausible-sounding idea with nothing behind it is still worth opening, just say that's what it is.
