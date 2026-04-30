# LO 1.1: Ingest and Store Data

> The exam will test your ability to choose the right ingestion tool based on latency requirements, the right storage layer based on throughput needs, and the right governance service based on permission granularity. Every scenario is solvable once you know which dimension to prioritize.

---

## 1. Service Personas: Streaming Ingestion

### Amazon Kinesis Data Firehose — *The Managed Delivery Pipeline*

**What it is:** A fully managed, near real-time streaming delivery service.

**Vibe:** Zero custom code required. Automatically scales and delivers streaming data directly to Amazon S3, Amazon Redshift, Amazon OpenSearch, and Splunk. This is the lowest-operational-overhead streaming option on the exam. You never manage consumers.

**Exam Keywords:** "Near real-time," "No custom code," "Lowest overhead," "Deliver to S3/Redshift/OpenSearch," "Fully managed."

---

### Amazon Kinesis Data Streams (KDS) — *The Custom Real-Time Processor*

**What it is:** A real-time data streaming service for building custom consumer applications.

**Vibe:** Unlike Firehose, KDS lets you build your own consumer logic using AWS Lambda or Amazon Managed Service for Apache Flink. Choose this when you need sub-second latency or need to replay data. More operational effort than Firehose.

**Exam Keywords:** "Sub-second latency," "Custom consumer," "Replay capability," "Lambda integration," "True real-time."

---

### Amazon MSK (Managed Streaming for Apache Kafka) — *The Kafka Migration Path*

**What it is:** A fully managed service for running Apache Kafka clusters on AWS.

**Vibe:** MSK is the right answer only when the question mentions existing Kafka workloads, Apache Kafka APIs, or migrating an on-premises Kafka cluster to AWS. Do not default to MSK for generic streaming — use Firehose or KDS first.

**Exam Keywords:** "Existing Kafka workload," "Apache Kafka APIs," "Kafka migration," "Open-source compatibility."

---

## 2. Service Personas: High-Performance ML Storage

> Storage choice directly impacts SageMaker training speed and cost. The exam frequently presents GPU idle time or I/O bottleneck symptoms as the problem — your job is to match the symptom to the storage fix.

### Amazon S3 — *The ML Data Lake Foundation*

**What it is:** Durable, scalable, and cost-efficient object storage.

**Vibe:** S3 is the starting point for every ML data pipeline. Raw data lands here, processed datasets live here, and model artifacts are stored here. It is not optimized for high-throughput sequential reads from training jobs — that is where FSx for Lustre comes in.

**Exam Keywords:** "Durable storage," "Data lake," "Raw datasets," "Model artifacts," "S3 Transfer Acceleration" (for faster uploads).

---

### Amazon FSx for Lustre — *The Training I/O Accelerator*

**What it is:** A high-performance file system that links directly to Amazon S3.

**Vibe:** This is a high-yield exam topic. If a scenario states that a SageMaker training job is experiencing an I/O bottleneck — GPUs sitting idle while waiting for data to stream from S3 — the answer is FSx for Lustre. It provides sub-millisecond latency and exposes your S3 bucket as a POSIX file system, eliminating the download wait.

**Exam Keywords:** "I/O bottleneck," "GPUs idle," "Sub-millisecond latency," "High-throughput training," "Linked to S3 bucket."

---

### Amazon EFS (Elastic File System) — *The Shared Notebook Storage*

**What it is:** A fully managed, scalable shared file system for concurrent access.

**Vibe:** EFS is not designed for extreme ML training throughput. Its role in ML scenarios is sharing a common home directory or dataset across multiple SageMaker Studio notebooks simultaneously. If the question involves multiple notebooks needing the same files at the same time, EFS is the answer — not FSx for Lustre.

**Exam Keywords:** "Shared access," "Multiple notebooks," "Concurrent reads," "SageMaker Studio home directory," "POSIX-compliant."

---

## 3. Service Personas: Data Governance and Metadata

### AWS Glue Data Catalog — *The Metadata Repository*

**What it is:** A centralized metadata store that automatically catalogs data schemas.

**Vibe:** Glue Crawlers scan S3 (and other sources), infer schemas, and register table definitions into the Data Catalog. Once registered, Athena, EMR, and SageMaker can query the data without you manually defining schemas. Think of it as the card catalog for your data lake.

**Exam Keywords:** "Metadata repository," "Schema discovery," "Glue Crawler," "Table definitions," "Used by Athena and EMR."

---

### AWS Lake Formation — *The Fine-Grained Access Controller*

**What it is:** A service that simplifies setting up a secure, governed data lake.

**Vibe:** Choose Lake Formation when the scenario requires column-level or row-level security over the ML data lake. It layers permissions on top of S3 and the Glue Data Catalog, allowing you to grant table-, column-, or row-scoped access to specific IAM roles without managing thousands of individual S3 bucket policies.

**Exam Keywords:** "Fine-grained access control," "Column-level security," "Row-level security," "Data lake permissions," "Centralized governance."

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Near real-time ingestion with lowest operational overhead | Amazon Kinesis Data Firehose — no code, managed delivery to S3/Redshift/OpenSearch |
| Sub-second (true real-time) latency and custom consumer logic | Amazon Kinesis Data Streams (KDS) — build custom apps with Lambda or Flink |
| Scenario mentions Apache Kafka APIs or migrating an existing Kafka cluster | Amazon MSK — the managed Kafka option; don't pick it for generic streaming |
| SageMaker training job has GPUs sitting idle waiting for data (I/O bottleneck) | Amazon FSx for Lustre — sub-millisecond latency, linked directly to S3 |
| Multiple SageMaker Studio notebooks need to share the same files simultaneously | Amazon EFS — shared POSIX file access; not optimized for training throughput |
| Column-level or row-level security over the data lake is required | AWS Lake Formation — fine-grained access control over S3 + Glue Catalog |
| Athena or EMR need to automatically discover schemas in S3 | AWS Glue Data Catalog + Glue Crawler — registers schema so Athena can query in place |

---

## 5. Key Concept Quick Reference

| Term / Service | Definition & Exam Relevance |
|---|---|
| **Parquet / ORC** | Columnar storage formats — best for analytics queries. Preferred for Feature Store offline access and Athena queries |
| **RecordIO** | SageMaker native format — use when training built-in algorithms (Image Classification, Object Detection) |
| **CSV / JSON** | Most flexible; slowest for large-scale analytics. Use for prototyping or API ingestion |
| **S3 Transfer Acceleration** | Routes uploads through CloudFront edge locations to speed up long-distance S3 uploads |
| **EBS Provisioned IOPS** | High-performance block storage for a single EC2 instance. Not for multi-instance training |
| **Amazon Redshift + Redshift ML** | Columnar data warehouse; Redshift ML runs SQL-based ML predictions inside the warehouse |

---

> ⚡ **EXAM TIP:** Kinesis Streams vs. Firehose — Streams = custom consumer + replay. Firehose = fully managed delivery, no custom consumers. If the scenario says "build a custom streaming application," it is Streams.

> ⚡ **EXAM TIP:** Data format selection — Parquet/ORC = columnar, best for analytics. RecordIO = SageMaker native training format. CSV = simplest but slowest for large datasets. Always match format to access pattern.
