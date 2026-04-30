# LO 4.3: Secure AWS Resources

> Security in ML is tested through a complete architecture lens: IAM controls who can do what, VPC controls network isolation, KMS controls encryption, and CloudTrail provides audit logs. The exam tests whether you can assemble these layers into a compliant ML architecture. Know each layer's purpose and where it fits in the stack.

---

## 1. Identity and Access Control

### IAM Roles and Policies — *The Permission Foundation*

**What it is:** Identity and Access Management controls every action performed by humans and services on AWS.

**Vibe:** Every SageMaker training job, endpoint, and notebook runs under an IAM execution role. The execution role must have only the permissions it needs (least privilege). Identity-based policies define what an IAM principal can do. Resource-based policies (like S3 bucket policies) define who can access a specific resource.

**Exam Keywords:** "Least privilege," "Execution role," "Identity-based policy," "Resource-based policy," "SageMaker execution role," "IAM Role Manager."

---

### AWS Organizations SCPs — *The Organizational Guardrail*

**What it is:** Policies applied at the AWS Organization level that restrict what can happen across all member accounts.

**Vibe:** SCPs override IAM permissions — even if an IAM role has full S3 access, an SCP that denies S3 writes will block that action. Use SCPs to enforce security guardrails: prevent data from leaving a specific region (data residency), enforce encryption, or restrict access to unapproved services. SCPs do not grant permissions — they only restrict what IAM can grant.

**Exam Keywords:** "Organization-wide guardrails," "Data residency enforcement," "Cross-account restrictions," "Deny overrides IAM allow," "Cannot be overridden by IAM."

---

## 2. Network Security Architecture

| Service | Definition & Exam Relevance |
|---|---|
| **VPC Private Subnets** | Place all SageMaker resources in private subnets with no direct internet route. Prevents exfiltration of model data or training secrets |
| **VPC Endpoints (PrivateLink)** | Allows SageMaker to privately connect to S3, ECR, SageMaker API without leaving the AWS network. No NAT Gateway, no internet exposure. Mandatory for private subnet configurations |
| **Security Groups** | Stateful firewall rules applied to instances and SageMaker endpoints. Control which ports and protocols can send/receive traffic. Applied at instance level |
| **NACLs (Network ACLs)** | Stateless subnet-level traffic rules. Evaluated before security groups. Return traffic must be explicitly allowed (stateless) |
| **Inter-Container Encryption** | Encrypts traffic between containers during distributed training jobs. Required when training data or model weights are sensitive and job spans multiple instances |
| **SageMaker Network Isolation Mode** | Prevents training or inference containers from making any outbound network calls during execution. Maximum isolation |

---

## 3. Data Protection and Encryption

### AWS KMS — *The Encryption Keymaster*

**What it is:** A managed service for creating, managing, and using encryption keys for data at rest.

**Vibe:** KMS encrypts data at rest across SageMaker: notebook instance volumes, training instance volumes, model artifacts in S3, Feature Store data, and endpoint storage. Customer-Managed Keys (CMKs) provide additional control and audit capability required for HIPAA and FedRAMP compliance.

**Exam Keywords:** "At-rest encryption," "Customer-managed keys (CMK)," "S3/EBS/EFS encryption," "SageMaker notebook encryption," "Feature Store encryption," "HIPAA/FedRAMP compliance."

---

### Amazon Macie — *The PII/PHI Detector*

**What it is:** A data security service that uses ML to automatically discover and classify sensitive data in S3.

**Vibe:** Macie continuously scans S3 buckets and classifies data as PII, PHI, financial data, or credentials. Generates findings when sensitive data is found in unexpected locations or when bucket permissions are overly permissive. Use when the scenario involves discovering whether training data contains sensitive information.

**Exam Keywords:** "PII discovery," "PHI classification," "S3 data scanning," "Sensitive data inventory," "Compliance," "Automated classification."

---

### AWS Secrets Manager — *The Credential Vault*

**What it is:** Stores and automatically rotates secrets: database credentials, API keys, and third-party tokens.

**Vibe:** SageMaker training scripts or inference code should never have credentials hardcoded. Instead, the SageMaker execution role grants access to Secrets Manager, and the code calls the Secrets Manager API at runtime to retrieve credentials. Secrets Manager also auto-rotates credentials on a schedule.

**Exam Keywords:** "Credentials management," "Auto-rotation," "API keys," "Database passwords," "No hardcoded secrets," "Runtime retrieval."

---

## 4. Audit, Compliance, and Responsible AI

| Service | Definition & Exam Relevance |
|---|---|
| **AWS CloudTrail** | Logs every SageMaker API call: who called CreateTrainingJob, who approved a model, who modified an endpoint. Essential for security audits and compliance. Immutable trail stored in S3 |
| **AWS Config** | Tracks configuration changes to AWS resources over time. Detects when a resource deviates from a compliant baseline (e.g., S3 bucket becomes public). Supports automated remediation |
| **TLS/SSL (In-Transit Encryption)** | All SageMaker API calls and endpoint traffic use TLS encryption in transit by default. Do not allow HTTP endpoints |
| **SageMaker Clarify** | Pre-training bias detection and post-training SHAP explainability. Supports compliance with regulations requiring model transparency and fairness documentation |
| **Bedrock Guardrails** | Content filtering for generative AI: blocks harmful topics, filters hallucinations, masks PII in FM outputs, enforces content policies at the Bedrock API layer |
| **Model Cards** | Structured documentation recording a model's intended use, training data, performance metrics, fairness evaluations, and known limitations |

---

## 5. The Complete Five-Layer Security Architecture

> This is the most commonly tested security pattern. Know all five layers and their triggers.

**Layer 1 — Identity:** IAM execution roles with least-privilege policies on every SageMaker resource. SageMaker Role Manager for standardized role templates. SCPs at org level for cross-account guardrails.

**Layer 2 — Network:** SageMaker resources in VPC private subnets. VPC Endpoints (PrivateLink) for private access to S3, ECR, and SageMaker APIs. Security Groups restrict inbound/outbound at instance level. NACLs at subnet level.

**Layer 3 — Encryption:** KMS encrypts all data at rest (S3 model artifacts, EBS training volumes, SageMaker notebooks, Feature Store). TLS/SSL encrypts all data in transit. Inter-container encryption for distributed training.

**Layer 4 — Secrets:** Secrets Manager stores all credentials and API keys. Secrets retrieved at runtime via IAM role — never hardcoded in training scripts or containers.

**Layer 5 — Audit:** CloudTrail logs all API calls. AWS Config tracks resource configuration drift. SageMaker Clarify provides fairness and explainability reports. Model Cards document governance decisions.

---

## 6. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| SageMaker execution role needs least-privilege access to S3 training data only | IAM identity-based policy scoped to specific S3 bucket ARN + KMS key ARN |
| Data must never leave a specific AWS region (data residency) | S3 bucket region restrictions + AWS Organizations SCP to deny cross-region S3 operations |
| SageMaker resources must not have internet access and must reach S3/ECR privately | VPC private subnets + VPC Endpoints (PrivateLink) for S3, ECR, and SageMaker API |
| Data at rest in S3, EBS, or SageMaker notebooks must be encrypted with customer keys | AWS KMS with Customer-Managed Keys (CMKs) |
| Discover whether S3 training data contains PII or PHI | Amazon Macie — automated sensitive data classification |
| Training scripts need database credentials without hardcoding | AWS Secrets Manager — retrieve at runtime via IAM role |
| Audit who approved a model in Model Registry or modified an endpoint | AWS CloudTrail — logs all SageMaker API calls |
| Generative AI application needs content filtering and PII masking in FM outputs | Amazon Bedrock Guardrails — topic denial, content filtering, PII masking |
| Document model fairness, intended use, and training data for governance | SageMaker Model Cards |
| Distributed training containers must encrypt inter-instance traffic | Enable inter-container traffic encryption in training job configuration |

---

> ⚡ **EXAM TIP:** The complete security pattern — VPC private subnets + VPC Endpoints (PrivateLink) + KMS encryption (at rest) + TLS (in transit) + IAM least privilege + CloudTrail audit = the five-layer ML security model.

> ⚡ **EXAM TIP:** Security services NOT in scope per official guide: GuardDuty, Inspector, Shield, WAF, Cognito, CloudHSM. Focus only on: IAM, KMS, Macie, Secrets Manager, VPC, CloudTrail, AWS Config, and SCPs.
