# LO 1.2: Transform Data and Perform Feature Engineering

> Think of data transformation on AWS as a two-axis spectrum: Code-heavy vs. No-code, and General-purpose vs. ML-specific. Every exam question about data prep maps to exactly one quadrant of that spectrum. Nail the personas and the If→Then logic and this LO becomes a question of reading carefully.

---

## 1. Service Personas: Transformation Tools

### AWS Glue — *The Serverless Data Engineer*

**What it is:** A fully managed, serverless ETL (Extract, Transform, Load) service.

**Vibe:** You write PySpark or Scala code; AWS handles all underlying servers. Glue handles massive datasets without you provisioning a cluster. It integrates natively with the Glue Data Catalog. When a scenario asks for serverless Spark ETL with custom code, Glue is always the answer over EMR.

**Exam Keywords:** "Serverless Spark," "Custom ETL code," "Data Catalog integration," "PySpark," "Scala," "Zero server management."

---

### Amazon EMR (Elastic MapReduce) — *The Big Data Heavyweight*

**What it is:** A managed cluster platform for running Apache Spark, Hadoop, and Hive at scale.

**Vibe:** Unlike Glue, EMR is not serverless by default — you choose the EC2 instance types. This gives you granular control over cluster configuration, memory, and compute. Use EMR when a company has existing on-premise Spark or Hadoop workloads, needs cluster-level tuning, or is processing petabyte-scale data that requires persistent infrastructure.

**Exam Keywords:** "Existing Hadoop/Spark workload," "Cluster-level control," "EC2 instance selection," "Petabyte-scale," "On-premise migration."

---

### AWS Glue DataBrew — *The Visual Data Cleaner*

**What it is:** A visual, no-code data preparation tool for analysts.

**Vibe:** DataBrew offers 250+ pre-built transformations (remove nulls, standardize dates, deduplicate) via a spreadsheet-like UI with no coding required. It includes data profiling to automatically detect data quality issues. Its output feeds general analytics pipelines, not SageMaker specifically. If the persona in the scenario is a data analyst or non-programmer, DataBrew wins.

**Exam Keywords:** "Visual interface," "No code," "Data analysts," "Non-programmers," "Data profiling," "250+ transformations," "BI/analytics."

---

### Amazon SageMaker Data Wrangler — *The ML Feature Engineer*

**What it is:** A visual, no-code data preparation tool built specifically inside SageMaker for ML.

**Vibe:** Data Wrangler does what DataBrew does, but the output connects directly into the SageMaker ecosystem: it exports preparation steps to SageMaker Pipelines or loads clean features into SageMaker Feature Store. It also supports ML-specific transforms (target encoding, feature importance visualization) that DataBrew does not. If the output must feed an ML training pipeline, choose Data Wrangler.

**Exam Keywords:** "Export to SageMaker Pipeline," "Feature engineering," "ML-specific transforms," "Target encoding," "SageMaker-native," "Feature Store integration."

---

### Amazon Athena — *The SQL Quick-Look*

**What it is:** A serverless, interactive query service that queries data in place on S3.

**Vibe:** Athena does not move or transform data. You point it at an S3 bucket (using Glue Data Catalog for schema), write standard SQL, and get results in seconds. No ETL job, no cluster to provision. This is the right answer when someone wants to quickly explore what is in a raw CSV or Parquet file without standing up infrastructure.

**Exam Keywords:** "Query in place," "Standard SQL," "Ad-hoc discovery," "No data movement," "Serverless SQL," "Works with Glue Catalog."

---

## 2. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Visual no-code prep needed and output feeds a general data warehouse or BI tool | AWS Glue DataBrew — analyst-friendly, 250+ transforms, data profiling |
| Visual no-code prep needed and output must integrate directly into an ML training pipeline | SageMaker Data Wrangler — SageMaker-native, exports to Pipelines and Feature Store |
| Custom Spark ETL code required with zero server management | AWS Glue — serverless Spark, no cluster provisioning |
| Custom Spark/Hadoop code required with control over EC2 cluster or migrating on-premise Hadoop | Amazon EMR — managed cluster, granular instance control |
| Quickly explore or query a CSV or Parquet file in S3 without ETL | Amazon Athena — serverless SQL in place, no data movement |
| Streaming data needs lightweight transformation before storage | AWS Lambda (simple transforms) or Kinesis Firehose with Lambda transform |

---

## 3. Feature Engineering Concepts (Must Know)

| Term | Definition & Exam Relevance |
|---|---|
| **One-Hot Encoding** | Converts categorical column into N binary columns. Use for nominal (unordered) categories. High cardinality explodes dimensionality |
| **Label Encoding** | Assigns integer to each category. Only safe for ordinal categories or tree-based models (XGBoost). Never for linear models |
| **Normalization (0–1)** | Scales values to [0,1]. Use for distance-based algorithms (KNN, K-Means) |
| **Standardization (z-score)** | Transforms to mean=0, std=1. Use for linear/logistic regression, PCA. More robust to outliers |
| **Binning** | Converts continuous variable into discrete buckets. Reduces noise. Example: age → age group |
| **Log Transform** | Reduces right-skewness (income, transaction amounts). Stabilizes variance for linear models |
| **Tokenization** | Splits text into tokens. Required pre-step for NLP models. Use Data Wrangler or BlazingText |

---

## 4. SageMaker Feature Store: Online vs. Offline Store

> One of the highest-yield distinctions in Domain 1. Know both stores, their use cases, and the exam trap they set up.

| Dimension | Online Store | Offline Store |
|---|---|---|
| **Purpose** | Real-time inference (low latency) | Batch model training (historical data) |
| **Latency** | Milliseconds | Minutes to hours (S3-based) |
| **Storage backend** | Amazon DynamoDB | Amazon S3 (Parquet) |
| **Use case** | Website calls GetRecord for live recommendation | Training job reads 6 months of features |
| **Key benefit** | Consistent features between training and serving | Point-in-time queries prevent data leakage |

---

## 5. High-Yield Connection Bridges

> **Connection 1: S3 → Glue Crawler → Glue Data Catalog → Athena**
> Raw data lands in S3. A Glue Crawler scans it, infers the schema, and registers a table definition in the Glue Data Catalog. Athena uses that catalog to query S3 data with standard SQL — no ETL, no data movement. This three-step chain appears across multiple exam questions.

> **Connection 2: Data Wrangler → Feature Store → Training Job**
> You clean raw user behavior data visually in Data Wrangler. Export engineered features to Feature Store (offline). Training job reads from the offline store. Same features flow through the online store at inference time — no training-serving skew.

---

> ⚡ **EXAM TIP:** Data Wrangler vs. Glue DataBrew — both are visual no-code tools. The split is destination. DataBrew feeds BI/data warehouses. Data Wrangler feeds SageMaker Pipelines and Feature Store. If the word "SageMaker" or "ML pipeline" appears, it is Data Wrangler.

> ⚡ **EXAM TIP:** Feature Store online vs. offline is one of the most frequently tested concepts. Online = real-time inference (milliseconds, DynamoDB). Offline = model training on historical data (S3, Parquet). Know both sides cold.
