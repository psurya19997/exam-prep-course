# LO 2.3: Analyze Model Performance

> Model evaluation is not just about picking the right metric — it is about knowing which metric fits which business objective, how to debug a model that is not converging, and how to explain model predictions. The exam tests metric selection under constraints (class imbalance, cost asymmetry) and SageMaker's debugging and explainability tools.

---

## 1. Regression Metrics

| Metric | What It Measures | When to Use |
|---|---|---|
| **RMSE (Root Mean Square Error)** | Square root of average squared errors. Penalizes large errors heavily | When large prediction errors are particularly costly |
| **MAE (Mean Absolute Error)** | Average of absolute errors. All errors weighted equally | When outliers should not dominate evaluation |
| **R-squared (R²)** | Proportion of variance in target explained by the model. 1.0 = perfect | When you need to communicate model fit to non-technical stakeholders |
| **MAPE** | Mean Absolute Percentage Error — errors as percentage of actual values | When relative error matters more than absolute error |

---

## 2. Classification Metrics

| Metric | Formula | When to Use |
|---|---|---|
| **Accuracy** | (TP + TN) / Total | Balanced classes only. Misleading on imbalanced datasets |
| **Precision** | TP / (TP + FP) | When false positives are costly (spam filter, legal decisions) |
| **Recall (Sensitivity)** | TP / (TP + FN) | When false negatives are costly (cancer detection, fraud) |
| **F1 Score** | 2 × (Precision × Recall) / (Precision + Recall) | Imbalanced classes where both precision and recall matter |
| **AUC-ROC** | Area under the ROC curve | Threshold-independent model comparison. Best for overall model quality |
| **Confusion Matrix** | TP, TN, FP, FN breakdown | Visual analysis of which classes are misclassified |

---

## 3. Choosing the Right Metric

| Business Problem | Right Metric | Reason |
|---|---|---|
| Fraud detection (rare events, missing fraud is costly) | Recall | Minimize false negatives — missing fraud is worse than false alarms |
| Spam filter (flagging legitimate email is costly) | Precision | Minimize false positives — user trust matters |
| Comparing two model architectures overall | AUC-ROC | Threshold-independent, measures discrimination ability |
| Imbalanced binary classification | F1 Score | Balances precision and recall across skewed classes |
| Medical diagnosis (missing positive case is dangerous) | Recall | Minimize false negatives — missing a diagnosis is catastrophic |

---

## 4. Identifying Overfitting and Underfitting

| Condition | Symptom | Fix |
|---|---|---|
| **Overfitting** | High training accuracy, low validation accuracy — large gap | Add regularization, get more data, reduce model complexity, use dropout |
| **Underfitting** | Low training AND validation accuracy — both poor | Increase model complexity, add relevant features, train longer |
| **Good fit** | Training and validation accuracy close, both acceptably high | Continue with evaluation on test set |

---

## 5. SageMaker Model Debugger

**What it is:** A tool that automatically detects training issues in real time during model training.

**Vibe:** Debugger runs built-in rules that monitor training metrics, gradients, and weights as the job runs. If it detects a problem, it can stop the training job early or send an alert. You can also write custom rules for domain-specific issues.

| Issue Debugger Detects | What It Means |
|---|---|
| **Vanishing gradients** | Gradients become near-zero in early layers — model stops learning |
| **Exploding gradients** | Gradients become very large — model weights become unstable |
| **Poor weight initialization** | Weights start too large or too small — slow convergence |
| **Overfitting** | Validation loss increases while training loss decreases |
| **Loss not decreasing** | Training is not converging — check learning rate |

---

## 6. SageMaker Clarify (Post-training)

**What it is:** Generates SHAP-based explanations for model predictions after training.

**Vibe:** Clarify post-training answers two questions: "Which features were most important for this prediction?" (SHAP values) and "Is the model treating demographic groups differently?" (post-training bias metrics). SHAP (SHapley Additive exPlanations) assigns each feature a contribution score for a specific prediction — essential for regulated industries that require model transparency.

**Exam Keywords:** "SHAP values," "Feature attribution," "Post-training bias," "Model explainability," "Feature importance."

---

## 7. Shadow Testing vs. A/B Testing

| Dimension | Shadow Testing | A/B Testing (Production Variants) |
|---|---|---|
| **When** | Before deployment validation | After deployment comparison |
| **Traffic** | New model receives mirrored traffic silently | Real users split between variants |
| **User impact** | Zero — production model still serves all responses | Both variants serve real users |
| **Purpose** | Validate new model safely before going live | Compare model versions with real production traffic |
| **Exam trigger** | "Test without affecting users," "Pre-deployment validation" | "Compare model versions," "Gradual rollout" |

---

## 8. The If → Then Decision Logic

| Scenario (IF) | Answer (THEN) |
|---|---|
| Binary classification on imbalanced data — need one metric | F1 Score — balances precision and recall for skewed classes |
| Compare two different models overall, independent of threshold | AUC-ROC — threshold-independent discrimination measure |
| False negatives are more costly than false positives | Optimize Recall — minimize missed positives |
| False positives are more costly than false negatives | Optimize Precision — minimize false alarms |
| Training is not converging — gradients are near zero | SageMaker Debugger — detect vanishing gradients |
| Need to explain which features drove a specific prediction | SageMaker Clarify post-training — SHAP values |
| Validate new model on production traffic without user impact | Shadow Testing — mirror traffic silently |

---

> ⚡ **EXAM TIP:** F1 is threshold-dependent — best for imbalanced classes where you need to balance precision and recall. AUC-ROC is threshold-independent — best for comparing models overall. Never use accuracy on imbalanced datasets.

> ⚡ **EXAM TIP:** Clarify is used TWICE in the exam: pre-training bias detection (Domain 1, LO 1.3) and post-training SHAP explainability (Domain 2, LO 2.3). Make sure you know which phase each use belongs to.
