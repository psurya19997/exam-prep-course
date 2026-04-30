# LO 1.3: Ensure Data Integrity and Prepare Data for Modeling

> This LO is about verifying that the data you ingested (LO 1.1) and transformed (LO 1.2) is accurate, complete, fair, and safe before a model ever touches it. The exam tests three separate integrity concerns: bias detection, data quality enforcement, and labeling. Know which service handles which concern.

---

## 1. Service Personas: Data Integrity Tools

### Amazon SageMaker Ground Truth — *The Human Labeler*

**What it is:** A service for building highly accurate training datasets through human and automated labeling.

**Vibe:** When you have raw images, audio clips, or text documents that need manual classification or annotation before training, Ground Truth manages the entire labeling workflow. It can use Amazon Mechanical Turk (public workforce), private teams, or automated labeling via active learning — where the ML model labels confident examples automatically and only sends ambiguous ones to humans. Ground Truth Plus is the fully managed variant where AWS manages the workforce for you.

**Exam Keywords:** "Data labeling," "Human-in-the-loop," "Mechanical Turk," "Active learning," "Annotation," "Ground Truth Plus" (managed workforce).

---

### Amazon SageMaker Feature Store — *The Single Source of Truth*

**What it is:** A centralized repository to store, share, and manage ML features across teams.

**Vibe:** Once you calculate a feature (e.g., Customer_Lifetime_Value), Feature Store ensures the training pipeline and the real-time inference system use the exact same feature definition. Without it, the two codebases can diverge, causing training-serving skew. The offline store supports point-in-time queries to prevent data leakage during model evaluation.

**Exam Keywords:** "Prevent training-serving skew," "Online and offline store," "Feature reusability," "Cross-team sharing," "Point-in-time query."

---

### Amazon SageMaker Clarify (Pre-training) — *The Bias Detective*

**What it is:** A tool that scans datasets and measures statistical bias before model training begins.

**Vibe:** Clarify computes pre-training bias metrics to flag demographic imbalances or label disparities in your dataset. It answers: "Is my training data itself unfair?" — before any model learns from it. Clarify also works post-training for model explainability (SHAP values), which is tested in Domain 2. Know both uses.

**Exam Keywords:** "Pre-training bias metrics," "Class Imbalance (CI)," "Difference in Proportions of Labels (DPL)," "KL divergence," "Fairness," "SHAP values" (post-training).

---

### AWS Glue Data Quality — *The Pipeline Bouncer*

**What it is:** Automatically measures and monitors the quality of data flowing through ETL pipelines.

**Vibe:** You define rules (e.g., "Age column must never be negative," "Completeness of CustomerID must be >99%"). Glue Data Quality evaluates incoming data against those rules and can halt the ETL job if violations are detected — preventing garbage data from reaching a model. Think of it as a data contract enforcer at the pipeline level.

**Exam Keywords:** "Data quality rules," "Stop pipeline on bad data," "Data validation," "Completeness," "Uniqueness," "Freshness," "ETL quality gates."

---

### Amazon Macie — *The PII Detector*

**What it is:** A fully managed data security service that automatically discovers sensitive data in S3.

**Vibe:** Macie uses machine learning to identify personally identifiable information (PII) and protected health information (PHI) in S3 buckets. If an exam scenario asks how to discover whether a dataset contains sensitive data before it is used for training, Macie is the answer — not manual inspection or IAM policies.

**Exam Keywords:** "PII detection," "PHI classification," "Sensitive data discovery," "S3 scanning," "Data classification," "Compliance."

---

## 2. Pre-Training Bias Metrics (SageMaker Clarify)

| Metric | Definition & Exam Relevance |
|---|---|
| **Class Imbalance (CI)** | Measures whether a facet (demographic group) is underrepresented relative to the overall dataset. High CI = model sees few examples from that group |
| **Difference in Proportions of Labels (DPL)** | Measures whether the positive outcome rate differs across facet groups. High DPL = label itself is distributed differently by group |
| **KL Divergence** | Measures how much the label distribution of one facet diverges from the overall distribution |
| **TVD / JS Divergence** | Total Variation Distance and Jensen-Shannon Divergence — additional distribution comparison metrics for continuous or multi-class targets |

---

## 3. Handling Class Imbalance: Techniques

> When a dataset is heavily skewed (e.g., 99% normal transactions, 1% fraud), standard training produces a model that ignores the minority class. The exam tests three distinct mitigation approaches.

| Technique | How It Works | AWS Tool |
|---|---|---|
| **SMOTE** | Generates synthetic minority-class samples by interpolating between existing ones. Increases minority class size without exact duplication | SageMaker Data Wrangler (built-in transform) |
| **Oversampling / Undersampling** | Oversampling: duplicate minority rows. Undersampling: remove majority rows. Simpler but can overfit (over) or lose information (under) | Data Wrangler or custom preprocessing |
| **Algorithm-level weights** | Pass class_weight or scale_pos_weight to the algorithm. Model penalizes misclassifying minority class more heavily. No data duplication | XGBoost: scale_pos_weight parameter |
| **Stratified Splits** | When splitting imbalanced data, preserve class ratio in each split. Prevents a split from having zero minority examples | Data Wrangler or scikit-learn |

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Raw images, audio, or text need human-assigned labels before training | SageMaker Ground Truth — manages the labeling workforce. Ground Truth Plus = AWS manages workforce |
| Models perform poorly because real-time features don't match training features (training-serving skew) | SageMaker Feature Store — online store serves inference; offline store serves training |
| Need to identify if a dataset unfairly underrepresents a demographic group before training | SageMaker Clarify (pre-training) — compute CI, DPL, KL divergence metrics on raw dataset |
| Dataset is heavily skewed (99% majority, 1% minority class) | SMOTE or resampling via Data Wrangler. Algorithm-level: XGBoost scale_pos_weight |
| Enforce data quality rules and stop ML pipeline if data is invalid | AWS Glue Data Quality — define rules, halt ETL on violations |
| Discover whether an S3 bucket contains PII or PHI data | Amazon Macie — automated sensitive data classification across S3 |
| Data must stay within a specific geographic region (data residency) | S3 bucket region restrictions + AWS Organizations SCPs |

---

> ⚡ **EXAM TIP:** SageMaker Clarify is tested in TWO distinct contexts: (1) Pre-training bias detection in Domain 1 — scanning the dataset before training. (2) Post-training explainability (SHAP values) in Domain 2. Know which phase each use belongs to.

> ⚡ **EXAM TIP:** AWS Glue Data Quality vs. SageMaker Clarify — Glue Data Quality = technical data quality rules (nulls, ranges, uniqueness). Clarify = statistical fairness and bias metrics. They solve different problems. Don't interchange them.
