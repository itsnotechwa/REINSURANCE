#from sklearn.linear_model import LogisticRegression
# from xgboost import XGBRegressor
# from sklearn.preprocessing import StandardScaler, OneHotEncoder
# from sklearn.compose import ColumnTransformer
# from sklearn.pipeline import Pipeline
# from sklearn.metrics import classification_report, mean_squared_error, accuracy_score, precision_score, recall_score, f1_score, r2_score, mean_absolute_error
# import joblib
import pandas as pd
import numpy as np
import os
from werkzeug.exceptions import BadRequest
import logging
from app import db
from app.models import Prediction
from app.utils.data_generator import generate_synthetic_claims

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model storage paths (relative to project root)
FRAUD_MODEL_PATH = os.getenv('FRAUD_MODEL_PATH', 'ml_models/fraud_model.pkl')
RESERVE_MODEL_PATH = os.getenv('RESERVE_MODEL_PATH', 'ml_models/reserve_model.pkl')

# Feature columns for ML models
NUMERIC_FEATURES = ['claim_amount', 'claimant_age', 'claim_length']
CATEGORICAL_FEATURES = ['claim_type']


def rule_based_fraud_detection(claim_amount: float, claim_type: str, claimant_age: int) -> tuple:
    """
    Rule-based fraud detection logic.
    Returns (fraud_score, is_fraudulent)
    """
    fraud_score = 0.0
    
    # Rule 1: High claim amounts are more suspicious
    if claim_amount > 50000:
        fraud_score += 0.3
    elif claim_amount > 30000:
        fraud_score += 0.2
    elif claim_amount > 10000:
        fraud_score += 0.1
    
    # Rule 2: Certain claim types have higher fraud rates
    high_risk_types = ['auto', 'property']
    if claim_type in high_risk_types:
        fraud_score += 0.15
    
    # Rule 3: Age-based risk (very young or very old claimants)
    if claimant_age < 25 or claimant_age > 70:
        fraud_score += 0.15
    
    # Rule 4: Combination of high amount and high-risk type
    if claim_amount > 40000 and claim_type in high_risk_types:
        fraud_score += 0.2
    
    # Normalize to [0, 1]
    fraud_score = min(fraud_score, 1.0)
    
    # Threshold for fraud classification
    is_fraudulent = fraud_score > 0.5
    
    return fraud_score, is_fraudulent


def rule_based_reserve_estimation(claim_amount: float, claim_type: str, is_fraudulent: bool) -> float:
    """
    Rule-based reserve estimation logic.
    Returns estimated reserve amount.
    """
    # Base reserve is a percentage of claim amount
    base_multiplier = 0.7
    
    # Adjust based on claim type
    type_multipliers = {
        'auto': 0.75,
        'health': 0.85,
        'property': 0.70,
        'home': 0.70,
        'life': 0.90
    }
    
    multiplier = type_multipliers.get(claim_type, base_multiplier)
    
    # Reduce reserve for fraudulent claims
    if is_fraudulent:
        multiplier *= 0.3  # Only reserve 30% for suspected fraud
    
    # Calculate reserve
    reserve = claim_amount * multiplier
    
    # Add some variance
    variance = np.random.uniform(0.9, 1.1)
    reserve *= variance
    
    return round(reserve, 2)


# def preprocess_data(data: pd.DataFrame) -> tuple:
#     """Preprocess data for training or prediction."""
#     X = data[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
#     preprocessor = ColumnTransformer(
#         transformers=[
#             ('num', StandardScaler(), NUMERIC_FEATURES),
#             ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), CATEGORICAL_FEATURES)
#         ]
#     )
#     return X, preprocessor


# def train_fraud_model(data: pd.DataFrame = None) -> dict:
#     """Train the fraud detection model using logistic regression."""
#     # ... (removed implementation)
#     pass


# def train_reserve_model(data: pd.DataFrame = None) -> dict:
#     """Train the reserve estimation model using XGBoost."""
#     # ... (removed implementation)
#     pass


def predict_fraud_and_reserve(claim_id: int, extracted_data: dict) -> dict:
    """
    Predict fraud score and reserve estimate.
    Uses rule-based logic only.
    """
    try:
        # Validate claim exists
        from app.models import Claim
        claim = Claim.query.get(claim_id)
        if not claim:
            raise BadRequest(f"Claim ID {claim_id} not found")
        
        # Extract features
        claim_amount = float(extracted_data.get('claim_amount', extracted_data.get('amount_claimed', 0.0)))
        claim_type = extracted_data.get('claim_type', 'auto').lower()
        claimant_age = int(extracted_data.get('claimant_age', 35))
        # claim_length = len(extracted_data.get('claim_date', extracted_data.get('incident_date', ''))) or 10
        
        logger.info("Using rule-based logic for prediction")
        # Use rule-based logic
        fraud_prob, is_fraudulent = rule_based_fraud_detection(claim_amount, claim_type, claimant_age)
        reserve_estimate = rule_based_reserve_estimation(claim_amount, claim_type, is_fraudulent)
        
        # Store prediction
        prediction = Prediction(
            claim_id=claim_id,
            fraud_score=fraud_prob,
            is_fraudulent=is_fraudulent,
            reserve_estimate=reserve_estimate,
            model_version='rule-based'
        )
        db.session.add(prediction)
        db.session.commit()
        
        result = {
            'claim_id': claim_id,
            'fraud_score': float(fraud_prob),
            'is_fraudulent': bool(is_fraudulent),
            'reserve_estimate': float(reserve_estimate),
            'model_version': 'rule-based'
        }
        logger.info("Prediction for claim %d: %s", claim_id, result)
        return result
    except Exception as e:
        logger.error("Error predicting for claim %d: %s", claim_id, str(e))
        raise BadRequest(f"Failed to predict: {str(e)}")