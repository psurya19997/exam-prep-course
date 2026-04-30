# LO 3.1: Select Deployment Infrastructure Based on Existing Architecture and Requirements

> Deployment selection is a four-way decision: real-time, serverless, asynchronous, or batch. Each has a distinct traffic profile trigger. Once you internalize the four endpoint types, most questions in this section become straightforward pattern matching.

---

## 1. SageMaker Endpoint Types — The Core Decision Framework

| Endpoint Type | Profile, Use Case & Key Properties |
|---|---|
| **Real-Time Endpoints** | Persistent, always-on. Synchronous responses in <60 seconds. Best when traffic is consistent and latency must be low (fraud detection, recommendation feeds). You pay for uptime even with zero requests. Supports production variants for A/B testing |
| **Serverless Inference** | Scales automatically to zero when idle — pay only per invocation + compute duration. Best for infrequent or spiky traffic where idle cost is unacceptable. Cold start latency when scaling from zero. Cannot use GPU |
| **Asynchronous Inference** | Requests are queued and processed up to 1 hour. Best for large payloads (>6 MB), long-running inference, or workloads where the caller does not need an immediate response. Output written to S3. Scales to zero when queue is empty |
| **Batch Transform** | Offline scoring of entire datasets stored in S3. No persistent endpoint — spun up for the job and terminated. Most cost-effective for bulk inference (scoring all customers overnight). Does not support real-time use cases |

---

## 2. Advanced Endpoint Configurations

### Multi-Model Endpoints (MME) — *The Fleet Manager*

**What it is:** A single endpoint that dynamically loads and serves many models from S3.

**Vibe:** Instead of deploying one endpoint per model, MME lets you host thousands of models behind one endpoint. SageMaker loads a model into memory on demand and evicts least-recently-used models when memory is full. Best when you have many similar models (e.g., one per customer) that do not all need to be in memory simultaneously.

**Exam Keywords:** "Many models, one endpoint," "Cost-efficient fleet," "Dynamic loading," "Similar model architecture," "Per-customer models."

---

### Multi-Container Endpoints — *The Mixed-Model Host*

**What it is:** A single endpoint with multiple distinct model containers running in parallel.

**Vibe:** Unlike MME (which dynamically swaps one model type), MCE hosts multiple different model types simultaneously in separate containers. Each container can run a different algorithm or framework. Useful when you need to compare different model architectures on the same endpoint or serve diverse workloads from one host.

**Exam Keywords:** "Different model types," "Multiple containers," "Parallel serving," "Framework diversity," "Side-by-side comparison."

---

### Serial Inference Pipeline — *The Assembly Line*

**What it is:** Chains multiple containers in sequence: preprocessing → model → postprocessing.

**Vibe:** A Serial Inference Pipeline links 2–5 containers where the output of each step becomes the input of the next. This lets you package feature engineering, model inference, and result formatting as a single atomic endpoint call. All steps run on one instance, keeping inter-step latency low.

**Exam Keywords:** "Preprocessing + inference + postprocessing," "Chained containers," "Single endpoint call," "Feature transform at inference."

---

## 3. Deployment Strategies: Traffic Management

| Strategy | How It Works & When to Use |
|---|---|
| **Production Variants (A/B Testing)** | Split live traffic by percentage between two model versions (e.g., 90% old, 10% new). Both serve real users. Used for post-deployment comparison |
| **Shadow Testing** | Duplicate all production traffic to the new model silently. New model output is logged but never returned to users. Safest pre-deployment validation |
| **Blue/Green Deployment** | Two full environments. Traffic switched completely from Blue to Green at once. Instant rollback. All-or-nothing |
| **Canary Deployment** | Small percentage (e.g., 5%) shifted to new version first. Gradually increase if metrics are healthy. Lower blast radius than Blue/Green |
| **Linear Deployment** | Traffic shifts in equal, scheduled increments (e.g., 10% every 10 minutes) until 100% on new version. Fully automated ramp |

---

## 4. Model Optimization and Edge Deployment

### SageMaker Neo — *The Hardware Compiler*

**What it is:** Compiles trained models for a specific target hardware platform to reduce size and improve inference speed.

**Vibe:** Neo uses XLA compilation to optimize model operations for the target chip — whether a cloud instance (ml.c5, ml.g4dn), an edge device (NVIDIA Jetson, Raspberry Pi, ARM Cortex), or AWS Inferentia. Compiled models are typically 25–50% smaller and 2x faster at inference.

**Exam Keywords:** "Compile for target hardware," "Edge deployment," "NVIDIA Jetson," "Raspberry Pi," "AWS Inferentia," "Reduce model size," "Faster inference."

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Consistent traffic and low-latency responses required at all times | Real-Time Endpoint — persistent, synchronous, supports A/B testing |
| Infrequent or unpredictable traffic and idle cost must be zero | Serverless Inference — scales to zero, pay per invocation, accept cold start |
| Payloads are large (>6 MB) or inference takes many minutes | Asynchronous Inference — queued, up to 1 hour, output to S3 |
| Offline batch scoring of entire dataset (no real-time needed) | Batch Transform — no persistent endpoint, most cost-efficient |
| Thousands of similar models and cannot afford one endpoint per model | Multi-Model Endpoint (MME) — one endpoint, dynamic model loading |
| Inference requires preprocessing + model + postprocessing as one call | Serial Inference Pipeline — chains containers, single atomic request |
| Validate new model against production traffic without user impact | Shadow Testing — traffic mirrored silently |
| Deploy model to edge device (Jetson, Raspberry Pi) or optimize for Inferentia | SageMaker Neo — compiles model for target hardware |

---

> ⚡ **EXAM TIP:** Four endpoint types have clear triggers. Serverless = "spiky/unpredictable traffic + zero idle cost." Async = "large payload (>6MB) or long processing time." Batch = "no real-time, bulk dataset scoring." Real-time = "consistent low-latency." Match the traffic profile.

> ⚡ **EXAM TIP:** Shadow testing vs. A/B testing — Shadow = new model receives traffic silently, zero user impact, pre-deployment validation. A/B = real users served by both variants simultaneously, post-deployment comparison.
