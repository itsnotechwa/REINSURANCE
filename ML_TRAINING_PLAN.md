# Machine Learning Model Training Plan

## Executive Summary

This document provides a comprehensive plan for training machine learning models for the reinsurance application. Currently, the application uses **rule-based logic** for fraud detection and reserve estimation, which works immediately without training. This plan outlines how to upgrade to trained ML models for improved accuracy.

## Current State: Rule-Based System

### Fraud Detection Rules

The current rule-based fraud detection uses the following logic:

```python
def rule_based_fraud_detection(claim_amount, claim_type, claimant_age):
    fraud_score = 0.0
    
    # Rule 1: High claim amounts (30% weight)
    if claim_amount > 50000:
        fraud_score += 0.3
    elif claim_amount > 30000:
        fraud_score += 0.2
    elif claim_amount > 10000:
        fraud_score += 0.1
    
    # Rule 2: High-risk claim types (15% weight)
    if claim_type in ['auto', 'property']:
        fraud_score += 0.15
    
    # Rule 3: Age-based risk (15% weight)
    if claimant_age < 25 or claimant_age > 70:
        fraud_score += 0.15
    
    # Rule 4: Combination factors (20% weight)
    if claim_amount > 40000 and claim_type in ['auto', 'property']:
        fraud_score += 0.2
    
    # Classify as fraudulent if score > 0.5
    is_fraudulent = fraud_score > 0.5
    
    return fraud_score, is_fraudulent
```

### Reserve Estimation Rules

```python
def rule_based_reserve_estimation(claim_amount, claim_type, is_fraudulent):
    # Base multipliers by claim type
    type_multipliers = {
        'auto': 0.75,
        'health': 0.85,
        'property': 0.70,
        'home': 0.70,
        'life': 0.90
    }
    
    multiplier = type_multipliers.get(claim_type, 0.7)
    
    # Reduce reserve for suspected fraud
    if is_fraudulent:
        multiplier *= 0.3
    
    # Calculate reserve with variance
    reserve = claim_amount * multiplier * random.uniform(0.9, 1.1)
    
    return reserve
```

### Advantages of Rule-Based System
- ✅ Works immediately without training data
- ✅ Transparent and explainable decisions
- ✅ Easy to modify and tune
- ✅ No computational overhead
- ✅ Consistent results

### Limitations of Rule-Based System
- ❌ Cannot learn from data patterns
- ❌ Limited to predefined rules
- ❌ May miss complex fraud patterns
- ❌ Requires manual tuning
- ❌ Cannot adapt to new fraud techniques

## Upgrade Path: Machine Learning Models

### Model Architecture

#### 1. Fraud Detection Model
- **Algorithm**: Logistic Regression (baseline) or XGBoost Classifier (advanced)
- **Type**: Binary classification
- **Target**: `is_fraudulent` (0 or 1)
- **Features**:
  - `claim_amount` (numeric)
  - `claim_type` (categorical)
  - `claimant_age` (numeric)
  - `claim_length` (numeric - days to process)

#### 2. Reserve Estimation Model
- **Algorithm**: XGBoost Regressor
- **Type**: Regression
- **Target**: `reserve_amount` (continuous)
- **Features**: Same as fraud detection model

### Data Requirements

#### Minimum Dataset Size
- **Training**: 1,000+ claims (2,000+ recommended)
- **Validation**: 200+ claims
- **Test**: 200+ claims

#### Required Fields
```json
{
  "claim_id": "unique identifier",
  "claim_amount": "float (claimed amount)",
  "claim_type": "string (auto/health/property/home/life)",
  "claimant_age": "int (18-100)",
  "claim_length": "int (days to process)",
  "is_fraudulent": "int (0 or 1) - TARGET for fraud model",
  "reserve_amount": "float (actual reserve) - TARGET for reserve model"
}
```

#### Data Quality Checklist
- [ ] No missing values in critical fields
- [ ] Claim amounts are positive numbers
- [ ] Ages are realistic (18-100)
- [ ] Fraud labels are verified (not just suspected)
- [ ] Reserve amounts are actual final reserves (not estimates)
- [ ] Data represents diverse claim types
- [ ] Sufficient fraud cases (at least 10% of dataset)

## Training Process

### Phase 1: Data Preparation (Week 1)

#### Step 1.1: Data Collection
```bash
# Option A: Use existing data
# Collect from your database
python3.11 -c "
from app import create_app, db
from app.models import Claim, Prediction
import pandas as pd

app = create_app()
with app.app_context():
    claims = Claim.query.all()
    # Export to CSV
    # ... export logic
"

# Option B: Use synthetic data for testing
cd Backend
python3.11 app/utils/data_generator.py
# Creates: Backend/app/data/synthetic_claims.csv
```

#### Step 1.2: Data Validation
```python
import pandas as pd

# Load data
df = pd.read_csv('Backend/app/data/synthetic_claims.csv')

# Validation checks
print(f"Total records: {len(df)}")
print(f"Missing values:\n{df.isnull().sum()}")
print(f"Fraud rate: {df['is_fraudulent'].mean():.2%}")
print(f"Claim types:\n{df['claim_type'].value_counts()}")
print(f"Amount range: ${df['claim_amount'].min():.2f} - ${df['claim_amount'].max():.2f}")
```

#### Step 1.3: Data Splitting
```python
from sklearn.model_selection import train_test_split

# Split data
train_df, temp_df = train_test_split(df, test_size=0.3, random_state=42, stratify=df['is_fraudulent'])
val_df, test_df = train_test_split(temp_df, test_size=0.5, random_state=42, stratify=temp_df['is_fraudulent'])

print(f"Training set: {len(train_df)} ({len(train_df)/len(df):.1%})")
print(f"Validation set: {len(val_df)} ({len(val_df)/len(df):.1%})")
print(f"Test set: {len(test_df)} ({len(test_df)/len(df):.1%})")
```

### Phase 2: Model Training (Week 2)

#### Step 2.1: Train Fraud Detection Model

**Using the Backend API (Recommended)**:
```bash
# Login as admin
curl -c cookies.txt -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Train fraud model
curl -b cookies.txt -X POST http://127.0.0.1:5000/ml/train-fraud

# Response includes metrics:
# {
#   "message": "Fraud model trained successfully",
#   "metrics": {
#     "accuracy": 0.92,
#     "precision": 0.88,
#     "recall": 0.85,
#     "f1": 0.86
#   }
# }
```

**Using Python Script**:
```python
from app.services.ml_service import train_fraud_model
import pandas as pd

# Load your training data
df = pd.read_csv('Backend/app/data/synthetic_claims.csv')

# Train model
metrics = train_fraud_model(df)
print("Fraud Model Metrics:", metrics)

# Model saved to: Backend/ml_models/fraud_model.pkl
```

#### Step 2.2: Train Reserve Estimation Model

**Using the Backend API**:
```bash
# Train reserve model
curl -b cookies.txt -X POST http://127.0.0.1:5000/ml/train-reserve

# Response includes metrics:
# {
#   "message": "Reserve model trained successfully",
#   "metrics": {
#     "mse": 2450.5,
#     "mae": 1200.3,
#     "r2": 0.78
#   }
# }
```

**Using Python Script**:
```python
from app.services.ml_service import train_reserve_model
import pandas as pd

# Load your training data
df = pd.read_csv('Backend/app/data/synthetic_claims.csv')

# Train model
metrics = train_reserve_model(df)
print("Reserve Model Metrics:", metrics)

# Model saved to: Backend/ml_models/reserve_model.pkl
```

### Phase 3: Model Evaluation (Week 3)

#### Step 3.1: Evaluate Fraud Detection Model

**Key Metrics**:
- **Accuracy**: Overall correctness (target: >85%)
- **Precision**: Of predicted frauds, how many are actually fraudulent (target: >80%)
- **Recall**: Of actual frauds, how many did we catch (target: >75%)
- **F1 Score**: Harmonic mean of precision and recall (target: >80%)

**Evaluation Script**:
```python
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# Load model and test data
model = joblib.load('Backend/ml_models/fraud_model.pkl')
test_df = pd.read_csv('test_data.csv')

# Prepare features
X_test = test_df[['claim_amount', 'claim_type', 'claimant_age', 'claim_length']]
y_test = test_df['is_fraudulent']

# Predict
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

# Metrics
print("Classification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print(f"\nROC AUC Score: {roc_auc_score(y_test, y_proba):.3f}")
```

#### Step 3.2: Evaluate Reserve Estimation Model

**Key Metrics**:
- **MSE** (Mean Squared Error): Average squared difference (lower is better)
- **MAE** (Mean Absolute Error): Average absolute difference (lower is better)
- **R² Score**: Proportion of variance explained (target: >0.7)

**Evaluation Script**:
```python
import joblib
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np

# Load model and test data
model = joblib.load('Backend/ml_models/reserve_model.pkl')
test_df = pd.read_csv('test_data.csv')

# Prepare features
X_test = test_df[['claim_amount', 'claim_type', 'claimant_age', 'claim_length']]
y_test = test_df['reserve_amount']

# Predict
y_pred = model.predict(X_test)

# Metrics
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mse)

print(f"MSE: ${mse:,.2f}")
print(f"RMSE: ${rmse:,.2f}")
print(f"MAE: ${mae:,.2f}")
print(f"R² Score: {r2:.3f}")

# Percentage error
mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
print(f"MAPE: {mape:.2f}%")
```

### Phase 4: Deployment (Week 4)

#### Step 4.1: Model Deployment Checklist
- [ ] Models trained and saved to `Backend/ml_models/`
- [ ] Evaluation metrics meet minimum thresholds
- [ ] Models tested with sample predictions
- [ ] Model version documented in database
- [ ] Backup of previous models created (if any)

#### Step 4.2: Verify Deployment
```bash
# Test prediction with trained models
curl -b cookies.txt -X POST http://127.0.0.1:5000/claim/upload \
  -F "file=@sample_claim.pdf"

# Check prediction response includes model_version: "ml-v1.0"
# (instead of "rule-based")
```

#### Step 4.3: Monitor Performance
```python
# Get model stats
curl -b cookies.txt http://127.0.0.1:5000/ml/model-stats

# Response shows all trained models and their metrics
```

## Advanced Training Strategies

### 1. Handling Imbalanced Data

Fraud detection typically has imbalanced classes (more legitimate than fraudulent claims).

**Strategies**:
```python
from sklearn.utils import resample
from imblearn.over_sampling import SMOTE

# Option A: Oversample minority class
fraud_cases = df[df['is_fraudulent'] == 1]
legitimate_cases = df[df['is_fraudulent'] == 0]

fraud_oversampled = resample(fraud_cases, 
                             n_samples=len(legitimate_cases),
                             random_state=42)

balanced_df = pd.concat([legitimate_cases, fraud_oversampled])

# Option B: SMOTE (Synthetic Minority Over-sampling)
from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
```

### 2. Feature Engineering

Add derived features to improve model performance:

```python
# Time-based features
df['claim_month'] = pd.to_datetime(df['claim_date']).dt.month
df['claim_day_of_week'] = pd.to_datetime(df['claim_date']).dt.dayofweek

# Ratio features
df['reserve_to_claim_ratio'] = df['reserve_amount'] / df['claim_amount']

# Categorical encoding
df['is_high_risk_type'] = df['claim_type'].isin(['auto', 'property']).astype(int)
df['is_high_amount'] = (df['claim_amount'] > 50000).astype(int)

# Age groups
df['age_group'] = pd.cut(df['claimant_age'], 
                         bins=[0, 25, 40, 60, 100],
                         labels=['young', 'adult', 'senior', 'elderly'])
```

### 3. Hyperparameter Tuning

Optimize model parameters for better performance:

```python
from sklearn.model_selection import GridSearchCV
from xgboost import XGBClassifier

# Define parameter grid
param_grid = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.1, 0.3],
    'n_estimators': [100, 200, 300],
    'min_child_weight': [1, 3, 5]
}

# Grid search
xgb = XGBClassifier(random_state=42)
grid_search = GridSearchCV(xgb, param_grid, cv=5, scoring='f1')
grid_search.fit(X_train, y_train)

print("Best parameters:", grid_search.best_params_)
print("Best F1 score:", grid_search.best_score_)
```

### 4. Ensemble Methods

Combine multiple models for better predictions:

```python
from sklearn.ensemble import VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

# Create ensemble
lr = LogisticRegression(random_state=42)
rf = RandomForestClassifier(random_state=42)
xgb = XGBClassifier(random_state=42)

ensemble = VotingClassifier(
    estimators=[('lr', lr), ('rf', rf), ('xgb', xgb)],
    voting='soft'
)

ensemble.fit(X_train, y_train)
```

## Model Retraining Strategy

### When to Retrain
- [ ] Monthly (recommended for production)
- [ ] When fraud rate changes significantly (>5% change)
- [ ] When new fraud patterns emerge
- [ ] When model performance degrades (accuracy drops >5%)
- [ ] After accumulating 500+ new claims

### Retraining Process
1. Export all claims from database
2. Combine with previous training data
3. Validate data quality
4. Retrain both models
5. Compare metrics with previous version
6. Deploy if metrics improve or maintain
7. Update model version in database

### Version Control
```python
# Save models with version numbers
import joblib
from datetime import datetime

version = datetime.now().strftime('%Y%m%d_%H%M%S')
joblib.dump(fraud_model, f'ml_models/fraud_model_v{version}.pkl')
joblib.dump(reserve_model, f'ml_models/reserve_model_v{version}.pkl')

# Keep backup of previous version
# Symlink latest version to fraud_model.pkl and reserve_model.pkl
```

## Cost-Benefit Analysis

### Rule-Based System
- **Setup Time**: Immediate
- **Maintenance**: Low (manual rule updates)
- **Accuracy**: 70-80% (estimated)
- **Adaptability**: Low
- **Cost**: $0 (no training infrastructure)

### ML Models
- **Setup Time**: 2-4 weeks (initial training)
- **Maintenance**: Medium (monthly retraining)
- **Accuracy**: 85-95% (with good data)
- **Adaptability**: High (learns from new patterns)
- **Cost**: Moderate (compute for training)

### Recommendation
- **Start with**: Rule-based system (already implemented)
- **Upgrade to ML when**:
  - You have 2,000+ labeled claims
  - Fraud detection accuracy is critical
  - You can dedicate resources to maintenance
  - You need to adapt to evolving fraud patterns

## Conclusion

The reinsurance application is currently running with a functional rule-based system that provides immediate value. The ML training infrastructure is ready, and you can upgrade to trained models whenever you have sufficient data.

**Next Steps**:
1. ✅ Use rule-based system for immediate operations
2. 📊 Collect and label claim data over time
3. 🔍 Validate data quality (minimum 2,000 claims)
4. 🎯 Train initial models using this plan
5. 📈 Monitor and retrain monthly
6. 🚀 Continuously improve with new features

**Questions or Issues?**
- Check model training logs in terminal
- Review metrics in `/ml/model-stats` endpoint
- Consult `INTEGRATION_GUIDE.md` for troubleshooting
