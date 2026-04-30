# LO 3.3: Use Automated Orchestration Tools to Set Up CI/CD Pipelines

> MLOps is a major exam theme. This LO tests whether you can assemble the canonical MLOps architecture: SageMaker Pipelines for model building, Model Registry for approval gating, CodePipeline for CI/CD triggers, and CloudFormation for endpoint deployment. Know the role of each service and how EventBridge connects them.

---

## 1. Orchestration Service Personas

### SageMaker Pipelines — *The ML Workflow Engine*

**What it is:** A native ML pipeline service that automates the steps from data processing to model deployment.

**Vibe:** SageMaker Pipelines chains steps: Processing Job → Training Job → Evaluation → Condition Step (pass/fail gate) → Model Registration → Deployment. Each step is a fully managed SageMaker job. Pipelines integrate natively with SageMaker Experiments (tracking) and Model Registry (versioning).

**Exam Keywords:** "ML pipeline," "Processing → Training → Evaluation → Register → Deploy," "Condition step," "Native SageMaker," "Model Registry integration."

---

### SageMaker Model Registry — *The Approval Gate*

**What it is:** A central repository for versioning, approving, and promoting trained models.

**Vibe:** Every model trained by SageMaker Pipelines can be registered with metadata (metrics, training data, hyperparameters). Approval workflow: Pending → Approved → Rejected. An EventBridge rule on the "Approved" event triggers the deployment pipeline automatically. This is the gating mechanism between training and production.

**Exam Keywords:** "Model versioning," "Pending → Approved → Rejected," "Approval workflow," "EventBridge trigger on approval," "Deployment gate," "Audit trail."

---

### AWS CodePipeline + CodeBuild + CodeDeploy — *The CI/CD Engine*

**What it is:** A suite of managed services that automate software build, test, and deployment workflows.

**Vibe:** CodePipeline orchestrates stages: Source (CodeCommit/GitHub) → Build (CodeBuild: runs tests, packages model) → Deploy (CodeDeploy or CloudFormation: deploys the SageMaker endpoint). In ML workflows, CodePipeline is often triggered by a Model Registry approval event.

**Exam Keywords:** "CI/CD pipeline," "Source → Build → Deploy stages," "CodeBuild" (unit/integration tests), "CodeDeploy" (deployment), "Triggered by Model Registry approval."

---

### SageMaker Projects — *The MLOps Template*

**What it is:** Pre-built MLOps templates that wire together SageMaker Pipelines, Model Registry, and CodePipeline automatically.

**Vibe:** SageMaker Projects provision the entire MLOps infrastructure from a template with a single click. Use Projects when the exam asks for the fastest way to set up an end-to-end MLOps workflow without building each component manually.

**Exam Keywords:** "Pre-built MLOps template," "One-click setup," "Pipelines + Model Registry + CodePipeline," "SageMaker Studio integration," "Fastest MLOps setup."

---

### AWS Step Functions — *The General-Purpose Orchestrator*

**What it is:** A serverless state machine service that coordinates any AWS service using visual workflows.

**Vibe:** Unlike SageMaker Pipelines (ML-specific), Step Functions can orchestrate any combination of AWS services: Lambda, SageMaker, Glue, DynamoDB, SNS. Choose Step Functions when the ML workflow includes non-SageMaker steps or when you need complex branching logic, parallel execution, or error handling across heterogeneous services.

**Exam Keywords:** "State machine," "Cross-service orchestration," "Non-SageMaker steps," "Lambda + SageMaker + Glue," "Complex branching," "General-purpose."

---

### Amazon MWAA — *The DAG Orchestrator*

**What it is:** A fully managed Apache Airflow service for complex, DAG-based workflow orchestration.

**Vibe:** Choose MWAA when the scenario involves existing Apache Airflow DAGs being migrated to AWS, or when you need DAG-based scheduling for complex multi-system workflows. Not SageMaker-native.

**Exam Keywords:** "Apache Airflow," "DAG-based orchestration," "Managed Airflow," "Existing Airflow migration," "Complex scheduling."

---

## 2. The Canonical MLOps Architecture Pattern

> This is the most commonly tested architecture in Domain 3. Know every step and every service's role.

**Step 1:** Data scientist commits code to CodeCommit/GitHub.

**Step 2:** CodePipeline detects the commit (Source stage) and triggers CodeBuild to run unit tests and package the pipeline definition.

**Step 3:** SageMaker Pipelines executes: Processing → Training → Evaluation → Condition step (if accuracy > threshold).

**Step 4:** If condition passes, the model is registered in SageMaker Model Registry with "Pending" status.

**Step 5:** A human approves the model in Model Registry (or auto-approval via Lambda).

**Step 6:** EventBridge detects "Approved" state change → triggers CodePipeline deploy stage → CloudFormation stack updates the SageMaker endpoint.

**Step 7:** SageMaker Model Monitor watches the deployed endpoint for drift.

---

## 3. Event-Driven Retraining Pattern

> SageMaker Model Monitor detects data drift → publishes a CloudWatch metric violation → CloudWatch Alarm fires → EventBridge rule matches the alarm event → triggers a Lambda function → Lambda starts the SageMaker Pipeline to retrain the model.

This closes the MLOps feedback loop automatically without human intervention.

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Orchestrate Processing → Training → Evaluation → Registration natively in SageMaker | SageMaker Pipelines — ML-specific pipeline with condition steps |
| Model versioning, approval workflow, and deployment gating | SageMaker Model Registry — pending → approved state triggers EventBridge |
| Fastest way to set up complete MLOps environment | SageMaker Projects — pre-built template wires all components automatically |
| ML workflow includes non-SageMaker services with complex branching | AWS Step Functions — general-purpose state machine |
| Team has existing Apache Airflow DAGs or needs DAG-based scheduling | Amazon MWAA — managed Airflow |
| Model should retrain automatically when drift is detected in production | Model Monitor → CloudWatch Alarm → EventBridge → Lambda → SageMaker Pipeline |
| Trigger CI/CD on code commit to GitHub or CodeCommit | CodePipeline (Source on commit) → CodeBuild (tests) → CloudFormation (endpoint update) |

---

> ⚡ **EXAM TIP:** Standard MLOps pattern — SageMaker Pipelines (model build) + Model Registry (approval gate) + CodePipeline (CI/CD trigger) + CloudFormation (endpoint deployment). Know the role each service plays and the order they fire in.

> ⚡ **EXAM TIP:** Model Registry states: Pending → Approved → Rejected. The "Approved" state change is what triggers the EventBridge rule that fires the CodePipeline deployment stage. Without this gate, every trained model goes straight to production.

> ⚡ **EXAM TIP:** Pipelines vs. Step Functions vs. MWAA — Pipelines = ML-native, SageMaker steps only. Step Functions = any AWS service, complex branching. MWAA = existing Airflow/DAG-based workflows.
