import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, mean_squared_error, mean_absolute_error, r2_score
import json
import os
from config import logger, DATA_DIR

# Load and preprocess datasets
datasets = {}
for claim_type in ['auto', 'health', 'property']:
    file_path = os.path.join(DATA_DIR, f'{claim_type}_claims.csv')
    datasets[claim_type] = pd.read_csv(file_path)

# Determine union of all columns
all_columns = set()
for claim_type, data in datasets.items():
    all_columns.update(data.columns.drop(['is_fraudulent', 'reserve_amount']))
all_columns = list(all_columns)

# Preprocess each dataset
encoded_datasets = {}
for claim_type, data in datasets.items():
    # Fill NA with 0 for missing columns
    data = data.copy()
    for col in all_columns:
        if col not in data.columns:
            data[col] = 0
    # Reorder to match union
    data = data[all_columns + ['is_fraudulent', 'reserve_amount']]
    
    # Label encode categorical variables
    le = LabelEncoder()
    for col in ['incident_type', 'incident_severity', 'police_report_available', 'insured_education_level', 'insured_occupation', 'claimant_gender', 'county']:
        if col in data.columns:
            data[col] = le.fit_transform(data[col])
    
    encoded_datasets[claim_type] = data

# Train fraud classifier
X_sets = {claim_type: data.drop(['is_fraudulent', 'reserve_amount'], axis=1) for claim_type, data in encoded_datasets.items()}
y_fraud_sets = {claim_type: data['is_fraudulent'] for claim_type, data in encoded_datasets.items()}

# Split and create DMatrix for each, store predictions for metrics
dtrain_sets = {}
dval_sets = {}
X_val_sets = {}
y_val_sets = {}
for claim_type in X_sets:
    X_train, X_val, y_train, y_val = train_test_split(X_sets[claim_type], y_fraud_sets[claim_type], test_size=0.2, random_state=42, stratify=y_fraud_sets[claim_type])
    dtrain_sets[claim_type] = xgb.DMatrix(X_train, label=y_train)
    dval_sets[claim_type] = xgb.DMatrix(X_val, label=y_val)
    X_val_sets[claim_type] = X_val
    y_val_sets[claim_type] = y_val

# Incremental training using xgb.train with existing model
params = {'objective': 'binary:logistic', 'eval_metric': 'auc', 'seed': 42, 'max_depth': 6, 'lambda': 1, 'learning_rate': 0.1}
model = None
for i, claim_type in enumerate(dtrain_sets):
    if model is None:
        model = xgb.train(params, dtrain_sets[claim_type], num_boost_round=50, evals=[(dval_sets[claim_type], 'val')], early_stopping_rounds=10)
    else:
        model = xgb.train(params, dtrain_sets[claim_type], num_boost_round=50, evals=[(dval_sets[claim_type], 'val')], xgb_model=model, early_stopping_rounds=10)

# Save fraud model
model.save_model(os.path.join(DATA_DIR, 'fraud_model.json'))
logger.info("Fraud model trained and saved")

# Predict on validation sets for fraud metrics
fraud_metrics = {}
for claim_type in X_val_sets:
    dval = xgb.DMatrix(X_val_sets[claim_type])
    y_pred_prob = model.predict(dval)
    y_pred = (y_pred_prob > 0.5).astype(int)
    fraud_metrics[claim_type] = {
        'precision': precision_score(y_val_sets[claim_type], y_pred),
        'recall': recall_score(y_val_sets[claim_type], y_pred),
        'f1_score': f1_score(y_val_sets[claim_type], y_pred),
        'auc_roc': roc_auc_score(y_val_sets[claim_type], y_pred_prob)
    }
logger.info("Fraud validation metrics: %s", fraud_metrics)

# Train reserve regressor
X_sets = {claim_type: data.drop(['is_fraudulent', 'reserve_amount'], axis=1) for claim_type, data in encoded_datasets.items()}
y_reserve_sets = {claim_type: data['reserve_amount'] for claim_type, data in encoded_datasets.items()}

dtrain_sets = {}
dval_sets = {}
X_val_sets = {}
y_val_sets = {}
for claim_type in X_sets:
    X_train, X_val, y_train, y_val = train_test_split(X_sets[claim_type], y_reserve_sets[claim_type], test_size=0.2, random_state=42)
    dtrain_sets[claim_type] = xgb.DMatrix(X_train, label=y_train)
    dval_sets[claim_type] = xgb.DMatrix(X_val, label=y_val)
    X_val_sets[claim_type] = X_val
    y_val_sets[claim_type] = y_val

params = {'objective': 'reg:squarederror', 'eval_metric': 'rmse', 'seed': 42, 'max_depth': 6, 'lambda': 1, 'learning_rate': 0.1}
model = None
for i, claim_type in enumerate(dtrain_sets):
    if model is None:
        model = xgb.train(params, dtrain_sets[claim_type], num_boost_round=50, evals=[(dval_sets[claim_type], 'val')], early_stopping_rounds=10)
    else:
        model = xgb.train(params, dtrain_sets[claim_type], num_boost_round=50, evals=[(dval_sets[claim_type], 'val')], xgb_model=model, early_stopping_rounds=10)

# Save reserve model
model.save_model(os.path.join(DATA_DIR, 'reserve_model.json'))
logger.info("Reserve model trained and saved")

# Predict on validation sets for reserve metrics
reserve_metrics = {}
for claim_type in X_val_sets:
    dval = xgb.DMatrix(X_val_sets[claim_type])
    y_pred = model.predict(dval)
    reserve_metrics[claim_type] = {
        'mse': mean_squared_error(y_val_sets[claim_type], y_pred),
        'rmse': np.sqrt(mean_squared_error(y_val_sets[claim_type], y_pred)),
        'mae': mean_absolute_error(y_val_sets[claim_type], y_pred),
        'r2': r2_score(y_val_sets[claim_type], y_pred)
    }
logger.info("Reserve validation metrics: %s", reserve_metrics)

# Save all metrics to a JSON file
metrics = {
    'fraud_metrics': fraud_metrics,
    'reserve_metrics': reserve_metrics
}
with open(os.path.join(DATA_DIR, 'metrics.json'), 'w') as f:
    json.dump(metrics, f, indent=4)
logger.info("Validation metrics saved to %s", os.path.join(DATA_DIR, 'metrics.json'))
