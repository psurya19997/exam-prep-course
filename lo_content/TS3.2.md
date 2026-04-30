# LO 3.2: Create and Script Infrastructure Based on Existing Architecture and Requirements

> Infrastructure automation for ML is tested through two lenses: IaC tooling (CloudFormation vs. CDK) and endpoint scaling configuration. The exam will describe a scaling scenario and ask which policy or tool applies. Know the auto scaling policy types and the IaC tradeoff cold.

---

## 1. Infrastructure as Code: CloudFormation vs. CDK

| Dimension | AWS CloudFormation | AWS CDK |
|---|---|---|
| **What it is** | Declarative JSON/YAML templates that describe desired AWS infrastructure state | Imperative code (TypeScript, Python, Java) that synthesizes to CloudFormation stacks |
| **Vibe** | You describe what you want; CloudFormation figures out the order. Stable, predictable, AWS-native | You write code with loops, conditionals, and abstractions. More powerful for dynamic or complex infra. Still deploys via CloudFormation |
| **Best for** | Stable, repeatable infrastructure; drift detection; teams that prefer declarative templates | Complex, dynamic infra where code reuse and abstraction improve maintainability |
| **Exam keyword** | "Declarative template," "YAML/JSON," "Drift detection," "Reproducible stack" | "Programmatic infra," "TypeScript/Python for IaC," "Synthesizes to CloudFormation" |

---

## 2. SageMaker Endpoint Auto Scaling

### Application Auto Scaling for SageMaker Endpoints

**What it is:** Automatically adjusts the number of instances behind a SageMaker endpoint based on demand.

**Vibe:** You attach scaling policies to a SageMaker endpoint's production variant. Three core policy types:
- **Target Tracking** — set a target value for a metric (e.g., keep InvocationsPerInstance at 1000) and AWS scales in/out to maintain it
- **Step Scaling** — define fixed scaling increments triggered by CloudWatch alarm thresholds (e.g., add 2 instances when CPU > 80%)
- **Scheduled Scaling** — pre-configure scaling actions for known traffic patterns (e.g., scale up every Monday at 9am)

**Exam Keywords:** "Target tracking," "Step scaling," "Scheduled scaling," "InvocationsPerInstance," "Application Auto Scaling."

---

## 3. Container and Network Infrastructure

| Service | Definition & Exam Relevance |
|---|---|
| **Amazon ECR** | Elastic Container Registry — stores and versions Docker images for SageMaker BYOC, ECS, and EKS workloads. Lifecycle policies automatically expire old image versions |
| **Amazon ECS** | Elastic Container Service — managed container orchestration without Kubernetes complexity. Use for ML inference containers outside SageMaker |
| **Amazon EKS** | Elastic Kubernetes Service — managed Kubernetes. Use when scenario involves existing Kubernetes workloads or multi-cloud portability |
| **VPC Private Subnets** | Isolate SageMaker training and inference resources from the public internet. Required for compliance-sensitive ML workloads |
| **VPC Endpoints (PrivateLink)** | Enable private connectivity to SageMaker API, S3, ECR without traversing the internet. No NAT gateway needed. Required when SageMaker instances are in private subnets |
| **Security Groups** | Stateful, instance-level firewall rules. Control inbound and outbound traffic for SageMaker resources |

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Team wants stable declarative YAML/JSON templates with drift detection | AWS CloudFormation — declarative, AWS-native, built-in drift detection |
| Team wants to write Python or TypeScript to define infrastructure with loops and abstractions | AWS CDK — programmatic IaC that synthesizes to CloudFormation stacks |
| Endpoint needs to maintain a target metric (e.g., requests per instance) automatically | Target Tracking scaling policy via Application Auto Scaling |
| Scaling should occur in fixed increments when CloudWatch alarm threshold is breached | Step Scaling policy — define alarm + fixed instance increment |
| Traffic peaks are predictable by time (e.g., business hours) | Scheduled Scaling — pre-configure scale-out actions at known times |
| SageMaker resources must stay in private subnets with no internet exposure | VPC private subnets + VPC Endpoints (PrivateLink) for S3, SageMaker API, ECR |
| Docker images for BYOC need to be stored, versioned, and accessed by SageMaker | Amazon ECR — push image, grant SageMaker execution role pull permission |

---

> ⚡ **EXAM TIP:** IaC tradeoff in one sentence — CloudFormation = declarative, stable, drift detection. CDK = programmatic, dynamic, synthesizes to CloudFormation. Both ultimately deploy CloudFormation stacks — CDK is just a higher-level abstraction.

> ⚡ **EXAM TIP:** Auto scaling metric selection — InvocationsPerInstance is the most common SageMaker-specific target tracking metric. CPUUtilization and ModelLatency are also used. Match the metric to the bottleneck in the scenario.
