# LO 2.1: Choose a Modeling Approach

> Algorithm and service selection is the core skill here. The exam gives you a business problem and asks you to pick the right tool. Decision factors: Is it a commodity task? Use an AI service. Is it tabular? Probably XGBoost. Is it time-series? DeepAR. Is it text? Comprehend or BlazingText. Is it real-time recommendations? Personalize. Memorize the algorithm personas.

---

## 1. SageMaker Built-In Algorithms — Use Cases

| Algorithm | Use Case & Exam Relevance |
|---|---|
| **XGBoost** | Most common exam algorithm. Tabular classification and regression. Handles missing values natively. Use scale_pos_weight for class imbalance |
| **Linear Learner** | Linear and logistic regression. Supports L1/L2 regularization natively. Use for simpler, interpretable models |
| **BlazingText** | Two modes: Word2Vec (unsupervised word embeddings) and Text Classification (supervised). Fast, scalable NLP |
| **DeepAR** | Time-series forecasting using RNNs. Handles multiple related time series simultaneously (thousands of product SKUs) |
| **K-Means** | Unsupervised clustering. You must specify K. Use for customer segmentation, anomaly grouping |
| **KNN (K-Nearest Neighbors)** | Classification and regression based on proximity. Computationally expensive at inference for large datasets |
| **PCA** | Dimensionality reduction. Reduces feature count while preserving variance. Use before clustering or with highly correlated features |
| **Random Cut Forest (RCF)** | Anomaly detection in tabular and streaming data. Assigns anomaly score to each record. Good for time-series anomalies |
| **Factorization Machines** | Recommendation systems on sparse data (user-item matrices). Captures pairwise feature interactions efficiently |
| **IP Insights** | Unsupervised anomaly detection on IP address behavior. Detects unusual account access patterns |
| **Object Detection** | Identifies and localizes multiple objects in images with bounding boxes. Built on SSD/YOLO architectures |
| **Image Classification** | Assigns a single label to an entire image. Fine-tuning pre-trained CNNs |
| **Semantic Segmentation** | Labels every pixel in an image. Most fine-grained computer vision task |
| **Seq2Seq** | Sequence-to-sequence tasks: machine translation, text summarization. RNN encoder-decoder architecture |

---

## 2. AWS AI Services — No Custom Training Required

> When a scenario describes a commodity ML task and mentions no ML expertise, custom data, or unique requirements, the answer is always an AWS AI service — not SageMaker. Memorize the service-to-task mapping.

| Service | Task & Key Distinction |
|---|---|
| **Amazon Rekognition** | Image and video analysis: object detection, face recognition, content moderation. NOT for document text — that is Textract |
| **Amazon Textract** | Extracts text, forms, and tables from documents (PDFs, scanned images). Goes beyond OCR to understand document structure. NOT Rekognition |
| **Amazon Comprehend** | NLP: entity recognition, sentiment analysis, topic modeling, PII detection in text. Works on text strings only |
| **Amazon Transcribe** | Speech-to-text. Converts audio files or real-time streams into text. Custom vocabularies and speaker diarization |
| **Amazon Polly** | Text-to-speech. Converts text into natural-sounding audio |
| **Amazon Translate** | Automated language translation between 75+ languages. Supports custom terminology |
| **Amazon Lex** | Builds conversational chatbots with ASR and NLU. Powers Amazon Alexa |
| **Amazon Personalize** | Real-time personalized recommendations. No ML expertise required — provide interaction data and Personalize handles everything |
| **Amazon Kendra** | Intelligent enterprise search using NLP. Understands natural language questions, returns precise answers from documents |
| **Amazon Fraud Detector** | Real-time fraud detection using your historical fraud data. No ML expertise required |
| **Amazon Lookout for Metrics** | Anomaly detection on business metrics (sales, clicks, inventory). Groups anomalies and provides root cause analysis |

---

## 3. Foundation Models and Generative AI Services

### Amazon Bedrock — *The Managed Foundation Model Service*

**What it is:** A fully managed service for accessing and customizing foundation models from multiple providers.

**Vibe:** Bedrock gives you API access to FMs from Anthropic (Claude), Meta (Llama), Stability AI (Stable Diffusion), Cohere, and Amazon (Titan) without managing infrastructure. You can fine-tune select models with your own data or implement RAG (Retrieval-Augmented Generation) via Bedrock Knowledge Bases, which connects to vector stores like OpenSearch or Aurora pgvector.

**Exam Keywords:** "Managed FM," "No infrastructure," "Fine-tuning," "RAG," "Knowledge Bases," "Bedrock Guardrails" (content filtering, PII masking, hallucination control).

---

### SageMaker JumpStart — *The One-Click Fine-Tuning Launcher*

**What it is:** A hub of pre-trained models that can be fine-tuned and deployed with minimal code.

**Vibe:** JumpStart provides ready-to-use models for computer vision, NLP, and tabular tasks. When a scenario involves fine-tuning a pre-trained open-source model (HuggingFace, PyTorch) on custom data inside SageMaker, JumpStart is the fastest path.

**Exam Keywords:** "Pre-trained models," "One-click fine-tuning," "SageMaker-native," "Open-source models," "HuggingFace integration."

---

## 4. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Commodity NLP (sentiment, entities, topics) and no custom model needed | Amazon Comprehend — no training, API-based |
| Document text/form/table extraction from PDFs or scans | Amazon Textract — NOT Rekognition |
| Image/video analysis (labels, faces, moderation) | Amazon Rekognition |
| Time-series forecasting across many related series | SageMaker built-in DeepAR |
| Tabular classification or regression with structured data | SageMaker XGBoost — most common exam algorithm |
| Anomaly detection in streaming or tabular data | Random Cut Forest (RCF) — SageMaker built-in anomaly scorer |
| Personalized recommendations in real time | Amazon Personalize — managed, no ML expertise needed |
| Access a foundation model for generative AI without managing infrastructure | Amazon Bedrock |
| Need fine-tuned FMs + RAG + content safety guardrails in one managed service | Amazon Bedrock with Knowledge Bases and Guardrails |

---

> ⚡ **EXAM TIP:** The most common AI service trap — Textract ≠ Rekognition. Textract = structured text extraction from documents. Rekognition = visual analysis of images and video. "Scanned PDF form" is Textract. "Image containing people" is Rekognition.

> ⚡ **EXAM TIP:** AI service vs. SageMaker custom model — use an AI service when the task is commodity, no proprietary data is involved, and no ML expertise is required. Use SageMaker custom when you have proprietary data, a unique problem, or need granular control.
