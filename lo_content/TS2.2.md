# LO 2.2: Train and Refine Models

> Training configuration directly affects cost, speed, and quality. This LO tests whether you know when to use spot training, how to prevent overfitting, when data parallelism vs. model parallelism applies, and how hyperparameter tuning works in SageMaker. Pair every cost question with the right training mode.

---

## 1. SageMaker Training Modes and Infrastructure

### Managed Spot Training — *The Cost Saver*

**What it is:** Uses spare EC2 capacity (Spot Instances) for training jobs at up to 90% cost reduction.

**Vibe:** Spot Instances can be interrupted at any time. To prevent losing all progress when an interruption occurs, you must implement checkpointing — saving model weights to S3 at regular intervals. If a job is interrupted, it resumes from the last checkpoint. Without checkpointing, an interrupted spot job loses all progress and must restart from scratch. This pairing is tested constantly.

**Exam Keywords:** "Up to 90% cost savings," "Spot Instances," "Checkpointing to S3," "Handle interruptions," "Cost optimization."

---

### SageMaker Automatic Model Tuning (AMT) — *The Hyperparameter Optimizer*

**What it is:** Automatically searches the hyperparameter space to find the best model configuration.

**Vibe:** AMT supports three strategies: Bayesian optimization (the default — uses previous results to intelligently pick next candidates), Random search (samples randomly, good for parallelism), and Hyperband (early stopping of underperforming configurations). Define the objective metric (e.g., validation:f1) and the ranges to search, and AMT runs multiple training jobs on your behalf.

**Exam Keywords:** "Hyperparameter tuning," "Bayesian optimization," "Random search," "Hyperband," "Objective metric," "Automatic Model Tuning."

---

### SageMaker Training Compiler — *The GPU Accelerator*

**What it is:** An XLA-based compiler that optimizes deep learning training jobs to run faster on GPU instances.

**Vibe:** Training Compiler automatically translates model operations into hardware-optimized code. It reduces GPU memory usage and increases throughput without changing your model code. Use it for TensorFlow and PyTorch training jobs on GPU instances to reduce training time and cost.

**Exam Keywords:** "Training Compiler," "XLA," "GPU optimization," "Faster training," "TensorFlow/PyTorch."

---

## 2. Distributed Training: Data vs. Model Parallelism

> The exam tests when to use each type. The deciding factor is always whether the model fits on a single GPU.

| Dimension | Data Parallelism | Model Parallelism |
|---|---|---|
| **When to use** | Model fits on one GPU but dataset is too large | Model is too large to fit on a single GPU |
| **What is split** | Training data is split across GPUs | Model layers are split across GPUs |
| **Libraries** | SageMaker DDP (Distributed Data Parallel), Horovod | SageMaker Model Parallel (SMP) |
| **Exam trigger** | "Large dataset," "Speed up training," "Multiple GPUs" | "Model too large for one GPU," "LLM training," "Billions of parameters" |

---

## 3. Regularization Techniques

| Technique | How It Works | When to Use |
|---|---|---|
| **L1 Regularization (Lasso)** | Drives weights to exactly zero — performs automatic feature selection | When you suspect many features are irrelevant |
| **L2 Regularization (Ridge)** | Shrinks weights toward zero but does not zero them — smooths the model | When all features may be relevant but you want to prevent large weights |
| **Dropout** | Randomly zeros out neurons during training — prevents co-adaptation | Deep neural networks prone to overfitting |
| **Weight Decay** | Equivalent to L2 in practice — adds a penalty to large weights in the loss function | As an alternative to explicit L2 penalty |
| **Early Stopping** | Halts training when validation metric stops improving | Prevent overfitting and reduce training time |

---

## 4. Preventing Overfitting, Underfitting, and Catastrophic Forgetting

| Problem | Symptoms | Solutions |
|---|---|---|
| **Overfitting** | High training accuracy, low validation accuracy | Add regularization, get more data, reduce model complexity, use dropout |
| **Underfitting** | Low training AND validation accuracy | Increase model complexity, add features, train longer, reduce regularization |
| **Catastrophic Forgetting** | Fine-tuned model loses performance on original task | Elastic Weight Consolidation (EWC), replay methods, mix old and new data |

---

## 5. Model Improvement Techniques

| Technique | How It Works |
|---|---|
| **Ensembling** | Combine predictions from multiple models to reduce variance |
| **Stacking** | Use model predictions as inputs to a meta-model (second-level learner) |
| **Boosting** | Sequentially train models, each correcting the previous model's errors (XGBoost, AdaBoost) |
| **Fine-tuning** | Start from a pre-trained model and update weights on your custom dataset |
| **Model compression** | Pruning, quantization (FP32→FP16), knowledge distillation to reduce model size |

---

## 6. SageMaker Model Registry — Version Control for Models

**What it is:** A central repository for versioning, approving, and promoting trained models.

**Vibe:** Every model trained by SageMaker Pipelines can be registered with full metadata: metrics, training data lineage, hyperparameters. Approval workflow: Pending → Approved → Rejected. An approved model triggers the deployment pipeline via EventBridge.

**Exam Keywords:** "Model versioning," "Approval workflow," "Audit trail," "Pending → Approved → Rejected," "Deployment gate."

---

## 7. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Reduce training cost and interruptions are acceptable | Managed Spot Training + S3 checkpointing — up to 90% savings |
| Find best hyperparameter combination automatically | SageMaker Automatic Model Tuning (AMT) — Bayesian optimization by default |
| Training dataset is too large for one GPU but model fits | Data Parallelism — SageMaker DDP or Horovod |
| Model is too large to fit on a single GPU | Model Parallelism — SageMaker Model Parallel (SMP) |
| Model is overfitting (high train, low validation accuracy) | Add dropout, L1/L2 regularization, get more training data |
| Fine-tuned model forgets original task performance | Catastrophic forgetting — use EWC or replay methods |
| Need to track experiments, compare runs, and reproduce results | SageMaker Experiments — tracks metrics, params, artifacts per run |

---

> ⚡ **EXAM TIP:** Spot Training + checkpointing = cost optimization question. Always pair them. Without checkpointing, an interrupted spot job loses all progress and must restart from scratch.

> ⚡ **EXAM TIP:** L1 vs. L2 — L1 drives weights to zero (feature selection, sparse model). L2 shrinks weights toward zero (keeps all features, smooth model). Common trap: L1 for feature selection, L2 for regularization without feature elimination.
