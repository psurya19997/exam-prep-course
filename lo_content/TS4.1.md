# LO 4.1: Monitor Model Inference

> Model performance degrades in production because the world changes. This LO tests your ability to detect that degradation before it causes business damage. SageMaker Model Monitor is the primary tool, but you must know all four monitor types and which one applies to which drift scenario.

---

## 1. Types of Model Drift

| Type | Definition & Exam Relevance |
|---|---|
| **Data Drift (Covariate Shift)** | The statistical distribution of input features changes over time. The model sees data it was not trained on. Detected by the Data Quality Monitor |
| **Concept Drift** | The underlying relationship between input features and the target label changes. The model's predictions become systematically wrong. Detected by the Model Quality Monitor — requires ground truth labels |
| **Bias Drift** | Fairness metrics across demographic groups change over time in production. Detected by the Bias Drift Monitor (powered by SageMaker Clarify) |
| **Feature Attribution Drift** | The relative importance of features (SHAP values) shifts over time, indicating the model relies on different signals than during training. Detected by the Feature Attribution Drift Monitor |

---

## 2. SageMaker Model Monitor — The Four Monitor Types

| Monitor Type | What It Detects, How It Works & Key Requirement |
|---|---|
| **Data Quality Monitor** | Detects feature distribution drift by comparing live inputs against a BASELINE statistics file from training data. Does NOT require ground truth labels. Outputs violations to S3 and CloudWatch. Most commonly deployed monitor |
| **Model Quality Monitor** | Detects prediction quality degradation by comparing model outputs against actual ground truth labels. REQUIRES ground truth labels. Cannot run without them |
| **Bias Drift Monitor** | Uses SageMaker Clarify to compute fairness metrics (CI, DPL) on live inference traffic. Detects whether model starts treating demographic groups differently. Compares against pre-training bias baseline |
| **Feature Attribution Drift Monitor** | Uses SageMaker Clarify SHAP values to detect changes in feature importance over time. Signals the model is relying on different features than during training |

---

## 3. The BASELINE Requirement — Critical Exam Concept

> Model Monitor cannot detect drift if it has nothing to compare against. Before enabling any monitor, you must run a baseline job that processes your training dataset and generates statistics files (mean, std dev, min/max per feature) and constraints files (acceptable ranges). These are stored in S3. The monitor then compares live inference data against these baselines and reports violations.

> **Without a baseline, Model Monitor produces no alerts.** This is the most common misconfiguration trap on the exam.

---

## 4. System Monitoring and Observability Tools

| Service | Definition & Exam Relevance |
|---|---|
| **Amazon CloudWatch** | Collects metrics, logs, and alarms from SageMaker endpoints (Invocations, ModelLatency, OverheadLatency, 4XXError, 5XXError). Set alarms on latency or error rate thresholds |
| **CloudWatch Logs Insights** | Interactive SQL-like query engine for CloudWatch log groups. Analyze inference logs, find error patterns, measure custom metrics |
| **AWS X-Ray** | Distributed tracing. Identifies latency bottlenecks and errors across multi-component inference pipelines (API Gateway → Lambda → SageMaker). Use when you need to find where in the call chain latency is occurring |
| **AWS CloudTrail** | Logs every AWS API call with caller identity, timestamp, and source IP. Use for auditing: who trained a model, who approved it in Model Registry, who changed endpoint configuration |
| **Amazon QuickSight** | BI visualization service. Build dashboards on top of CloudWatch metrics or S3 monitoring data to visualize model performance trends over time |

---

## 5. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Detect when input feature distributions shift from training data (no labels needed) | SageMaker Model Monitor — Data Quality Monitor. Create baseline first |
| Detect actual model performance degradation using real outcomes | SageMaker Model Monitor — Model Quality Monitor. Requires ground truth labels |
| Detect whether fairness metrics across demographic groups are changing in production | SageMaker Model Monitor — Bias Drift Monitor (Clarify-powered) |
| Detect whether SHAP feature importance values are shifting over time | SageMaker Model Monitor — Feature Attribution Drift Monitor (Clarify-powered) |
| Model Monitor is set up but producing no alerts or violations | Check if BASELINE was created first. Without baseline statistics file, Monitor cannot detect drift |
| Trace a latency spike across multiple services in an ML inference pipeline | AWS X-Ray — distributed tracing identifies which component is the bottleneck |
| Audit which IAM user approved a model or modified endpoint configuration | AWS CloudTrail — logs all SageMaker API calls with caller identity and timestamp |
| Retraining pipeline should trigger automatically when drift is detected | Model Monitor violation → CloudWatch Alarm → EventBridge rule → Lambda → SageMaker Pipeline |

---

> ⚡ **EXAM TIP:** Know all four Model Monitor types and their ground truth dependency. Data Quality = no labels needed. Model Quality = labels required. Bias Drift = Clarify fairness metrics. Feature Attribution = Clarify SHAP values.

> ⚡ **EXAM TIP:** BASELINE is always required. If a scenario says Model Monitor is configured but not detecting anything, the missing baseline is almost certainly the answer. Creating the baseline is a mandatory first step.
