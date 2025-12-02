### Simple Mimicking of How the Detection Will Work (Using a Real Example)

To illustrate how the fraud detection and reserve estimation will function in practice, let's mimic the process using a realistic example based on a common auto insurance claim scenario (inspired by patterns from public datasets like Kaggle's auto insurance claims data). This shows the end-to-end flow: input data → model predictions → rule-based adjustments → final outputs. Assume the models (XGBoost Classifier for fraud, XGBoost Regressor for reserves) are already trained on synthetic/real data with the features we discussed.

#### Example Scenario: A Suspicious Auto Claim
- **Input Data** (Extracted from a submitted PDF claim form via OCR in your backend):
  - claim_amount: $15,000 (requested payout for vehicle damage).
  - claimant_age: 25 (young driver).
  - claim_duration_days: 5 (claim filed quickly after incident).
  - claim_type: 'auto'.
  - claimant_gender: 'male'.
  - region: 'south'.
  - policy_deductable: $2,000 (high out-of-pocket).
  - policy_annual_premium: $1,200 (relatively low).
  - number_of_vehicles_involved: 1 (single vehicle).
  - bodily_injuries: 0 (no reported injuries).
  - witnesses: 0 (none listed).
  - incident_hour_of_the_day: 2 (late night, 2 AM).
  - auto_year: 2005 (old vehicle).
  - incident_type: 'single_vehicle_collision'.
  - incident_severity: 'major' (extensive damage claimed).
  - police_report_available: 'no' (none provided).
  - insured_education_level: 'high_school'.
  - insured_occupation: 'manual_labor'.

- **Step 1: Preprocessing** (Handled by the model's pipeline):
  - Numeric features (e.g., claim_amount, age) are scaled (e.g., standardized to mean 0, std 1).
  - Categorical features (e.g., claim_type, severity) are one-hot encoded (e.g., 'major' becomes [0, 1, 0] for minor/major/total_loss).
  - Input is fed as a single-row DataFrame.

- **Step 2: Fraud Detection with XGBoost Classifier**:
  - The model analyzes patterns: High claim_amount relative to low premium, young age, no witnesses, late-night incident, no police report, and major severity all raise red flags (based on learned correlations from training data).
  - Raw Prediction: Fraud probability = 0.75 (75% chance of fraud, above 0.5 threshold → classified as fraudulent).
  - Rule-Based Adjustment: Check rules—`claim_amount ($15,000) > 3 * policy_annual_premium ($1,200 * 3 = $3,600)` AND `witnesses == 0` AND `police_report_available == 'no'`. This triggers: Boost probability by +0.2 → Final fraud_prob = 0.95 (95% fraudulent).
  - Output: is_fraudulent = True, fraud_score = 0.95.

- **Step 3: Reserve Estimation with XGBoost Regressor** (Using fraud_prob as an optional input feature for better accuracy):
  - The model predicts based on features like severity ('major' suggests higher costs), claim_amount, vehicle age (old → more expensive repairs), and incident details.
  - Raw Prediction: Reserve estimate = $12,500 (e.g., 80-90% of claimed amount, adjusted for typical payouts).
  - Rule-Based Adjustment: Check rules—`incident_severity == 'major'` triggers: Increase by +20% → Final reserve_estimate = $15,000.
  - Output: reserve_estimate = $15,000 (recommended initial reserve to set aside, potentially higher if fraudulent to cover investigations).

- **Final System Output** (Stored in your Prediction model and returned to user/admin):
  - {'claim_id': 123, 'fraud_score': 0.95, 'is_fraudulent': True, 'reserve_estimate': 15000.0, 'model_version': 'v1.0'}
  - Action: If fraudulent, flag for manual review; set reserves accordingly to manage financial risk.

This example mimics a real case where a staged single-vehicle accident (common fraud type) is detected via anomalous patterns. In practice, the backend would call this via `predict_fraud_and_reserve(claim_id, extracted_data)`, and rules ensure human-interpretable overrides.

### Step-by-Step Plan: Phases for Development

Now, the development plan for building the standalone ML project (focusing on XGBoost models + rule-based add-ons). We'll divide into phases for structured progression, assuming a 1-2 week timeline with iterative testing. This is standalone first (Python script/notebook), then backend integration. Use Git for version control.

#### Phase 1: Setup and Data Preparation (Days 1-2)
- **Goals**: Establish environment, generate realistic data, perform EDA.
- **Steps**:
  1. Set up Python environment (e.g., virtualenv with pip install scikit-learn xgboost pandas numpy matplotlib seaborn joblib imbalanced-learn).
  2. Implement expanded synthetic data generator (as in previous code, with 10,000 samples, 5% fraud rate, correlations via adjustments/multivariate sampling).
  3. Load/clean data: Handle types, impute missings, engineer features (e.g., ratios like claim_amount/premium).
  4. Perform EDA: Generate plots (distributions, correlations, fraud patterns); log insights (e.g., "High severity correlates with 2x reserves").
  5. Split data: 70/15/15 train/val/test; stratify fraud.
- **Deliverables**: Data CSV, EDA notebook/script with plots, preprocessed splits.
- **Testing**: Verify data realism (e.g., fraud rate ~5%, no NaNs).

#### Phase 2: Model Training and Tuning (Days 3-5)
- **Goals**: Train XGBoost models, add rule-based logic, optimize.
- **Steps**:
  1. Build preprocessing pipeline: ColumnTransformer for scaling/encoding.
  2. For Fraud (XGBoost Classifier): Integrate SMOTE for imbalance; tune hyperparameters (GridSearchCV: n_estimators, max_depth, learning_rate; scorer=ROC-AUC).
  3. For Reserves (XGBoost Regressor): Tune similarly (scorer=neg_mean_squared_error).
  4. Implement rule-based add-ons: Simple functions (e.g., def apply_fraud_rules(prob, features): if conditions, prob += 0.2; cap at 1.0).
  5. Train on train set; validate on val set; apply rules post-prediction.
  6. Evaluate baselines (e.g., compare to dummy models) and iterate if metrics low (e.g., add fraud_prob as reserve feature).
- **Deliverables**: Trained models (.pkl files), tuning logs (best params, CV scores).
- **Testing**: Unit tests for predictions (e.g., assert fraud_prob between 0-1); check rules apply correctly on sample inputs.

#### Phase 3: Evaluation, Explainability, and Optimization (Days 6-7)
- **Goals**: Validate performance, add interpretability, refine.
- **Steps**:
  1. Evaluate on test set: Compute metrics (AUC/recall for fraud; R²/MSE for reserves); plot confusion matrix/residuals.
  2. Add explainability: Use SHAP to generate feature importance plots/summaries (e.g., "Top fraud feature: witnesses").
  3. Bias check: Analyze metrics by subgroups (e.g., fraud recall by gender/region); adjust if biased.
  4. Optimize: If AUC <0.85, increase data size or tune further; test rules' impact (e.g., +5% recall).
  5. Simulate real use: Run on 10-20 example claims (like above) to mimic backend.
- **Deliverables**: Evaluation report (metrics table, plots), SHAP outputs.
- **Testing**: Edge cases (e.g., all-default inputs, extreme values); robustness to missing features.

#### Phase 4: Documentation and Backend Integration Prep (Days 8-10)
- **Goals**: Package for deployment, prepare for claims routes.
- **Steps**:
  1. Write inference function: def predict_fraud_and_reserve(input_dict): load models, preprocess, predict, apply rules, return dict.
  2. Document: README with run instructions, model details, feature list/defaults; code comments.
  3. Containerize (optional): Dockerize script for easy testing.
  4. Prep integration: Update ml_service.py (remove training, add predict function with new features/rules); modify claims routes (enhance extract_structured_data for new fields; test UploadClaim/Prediction with examples).
  5. Final test: Run end-to-end on mock backend data.
- **Deliverables**: Standalone script, updated backend code snippets, deployment guide.
- **Testing**: API-like calls (e.g., simulate POST to /upload-claim); monitor logs for errors.

This phased plan ensures iterative development with checkpoints. If issues arise (e.g., low metrics), loop back to prior phases. Total: ~10 days, scalable. Let me know if we start coding Phase 1!