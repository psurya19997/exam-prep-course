# LO 4.2: Monitor and Optimize Infrastructure and Costs

> Cost optimization in ML has two layers: compute purchasing strategy (spot, reserved, savings plans) and right-sizing the instance type. The exam tests both, with special emphasis on the Inferentia vs. Trainium chip distinction — a common trap question. Know every cost lever and the tool that enables it.

---

## 1. Compute Purchasing Options

| Option | How It Works, Savings & Best Use Case |
|---|---|
| **On-Demand Instances** | Pay by the second, no commitment. Highest cost. Use for unpredictable workloads or experiments |
| **Managed Spot Training** | Uses EC2 Spot Instances at up to 90% discount. Can be interrupted. MUST implement checkpointing to S3. Best for fault-tolerant, non-time-critical training jobs |
| **Reserved Instances (RIs)** | 1 or 3-year commitment to specific instance type and region. Up to 72% discount. Best for production inference endpoints with steady, predictable traffic |
| **SageMaker Savings Plans** | Commit to a consistent $/hour spend on SageMaker (any instance type) for 1 or 3 years. More flexible than RIs because the commitment is monetary, not instance-specific |
| **AWS Inferentia (ml.inf1/inf2)** | Custom AWS chip optimized for deep learning INFERENCE. Higher throughput and lower cost per inference than comparable GPU instances. NOT for training |
| **AWS Trainium (ml.trn1)** | Custom AWS chip optimized for deep learning TRAINING. Better price-performance for training large models. NOT for inference |

---

## 2. Inferentia vs. Trainium — The Common Trap

| Chip | AWS Inferentia (ml.inf1/inf2) | AWS Trainium (ml.trn1) |
|---|---|---|
| **Purpose** | Deep learning INFERENCE cost optimization | Deep learning TRAINING cost optimization |
| **Phase** | Model serving / production endpoint | Model training job |
| **Savings vs GPU** | Up to 70% lower cost per inference | Up to 50% lower cost per training step |
| **Exam trigger** | "Reduce inference costs" or "cheaper serving" | "Reduce training costs" or "cheaper training" |

---

## 3. Cost Analysis and Right-Sizing Tools

| Service | Definition & Exam Relevance |
|---|---|
| **SageMaker Inference Recommender** | Runs automated load tests across multiple instance types. Recommends optimal instance type and count for your model based on latency and cost targets. Use before committing to a production instance type |
| **AWS Compute Optimizer** | Analyzes historical CloudWatch utilization for EC2, Lambda, and ECS. Recommends right-sized configurations. Use when instances are consistently over-provisioned |
| **AWS Cost Explorer** | Visualizes AWS spending over time, by service, by region, or by tag. Primary tool for identifying cost trends and anomalies |
| **AWS Budgets** | Set spending thresholds and receive alerts when costs approach or exceed the budget. Proactive cost governance |
| **AWS Trusted Advisor** | Automated recommendations across cost, performance, security, and fault tolerance. Identifies underutilized SageMaker endpoints and idle instances |
| **Resource Tagging** | Apply key-value tags to SageMaker resources (Project=ModelA, Team=DataScience). Without tags, Cost Explorer cannot attribute spending to specific ML workloads |
| **S3 Lifecycle Policies** | Automatically transition old model artifacts and training datasets to cheaper S3 storage tiers (S3-IA, Glacier) after a defined period |

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Reduce training job costs and interruptions are acceptable | Managed Spot Training + checkpointing to S3 — up to 90% savings |
| Reduce inference costs for a deep learning model in production | AWS Inferentia (ml.inf1/inf2) — custom chip for inference, NOT training |
| Reduce training costs for a large deep learning model | AWS Trainium (ml.trn1) — custom chip for training, NOT inference |
| Find optimal instance type for a new SageMaker endpoint | SageMaker Inference Recommender — automated load testing + recommendation |
| EC2 or Lambda instances are consistently under-utilized | AWS Compute Optimizer — rightsizing recommendations based on utilization metrics |
| Need to attribute ML costs to specific teams or projects | Resource Tagging — apply tags, then filter by tag in Cost Explorer |
| Old model artifacts in S3 accumulating and increasing storage costs | S3 Lifecycle Policies — auto-transition to cheaper tiers after N days |
| Traffic is infrequent and endpoint sits idle most of the day | Serverless Inference — scales to zero, no idle compute cost |

---

> ⚡ **EXAM TIP:** Inferentia = inference cost savings. Trainium = training cost savings. These are the most common chip-related trap. Inferentia → Inference. Trainium → Training. Always anchor to the ML phase described in the scenario.

> ⚡ **EXAM TIP:** Resource tagging is the prerequisite for cost allocation. Without tags, Cost Explorer shows total SageMaker cost but cannot break it down by team, project, or model. "How do we know which ML project costs the most?" → tagging.
