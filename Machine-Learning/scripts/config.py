import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories (relative to project root)
DATA_DIR = "/home/sjet/salim/reinsurance/Machine-Learning/data"
EDA_DIR = os.path.join('..', 'eda_plots')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EDA_DIR, exist_ok=True)

# Feature lists (updated dynamically if needed)
NUMERIC_FEATURES = [
    'claim_amount', 'claimant_age', 'claim_duration_days', 'policy_deductable',
    'policy_annual_premium', 'number_of_vehicles_involved', 'bodily_injuries',
    'witnesses', 'incident_hour_of_the_day', 'auto_year'
]
CATEGORICAL_FEATURES = [
    'claim_type', 'claimant_gender', 'region', 'incident_type',
    'incident_severity', 'police_report_available', 'insured_education_level',
    'insured_occupation'
]
