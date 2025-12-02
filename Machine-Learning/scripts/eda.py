import matplotlib.pyplot as plt
import seaborn as sns
from config import NUMERIC_FEATURES, EDA_DIR, logger
import pandas as pd
import os

def perform_eda(data: pd.DataFrame):
    """Perform EDA and save plots."""
    logger.info("Performing EDA...")
    
    # Summary stats
    logger.info("Summary statistics:\n%s", data.describe())
    logger.info("Fraud rate: %.2f%%", data['is_fraudulent'].mean() * 100)
    
    # Fraud distribution
    plt.figure(figsize=(6, 4))
    sns.countplot(x='is_fraudulent', data=data)
    plt.title('Fraud Distribution')
    plt.savefig(os.path.join(EDA_DIR, 'fraud_distribution.png'))
    plt.close()
    
    # Claim amount by fraud
    plt.figure(figsize=(8, 6))
    sns.boxplot(x='is_fraudulent', y='claim_amount', data=data)
    plt.title('Claim Amount by Fraud Status')
    plt.savefig(os.path.join(EDA_DIR, 'claim_amount_by_fraud.png'))
    plt.close()
    
    # Correlation heatmap (numeric only)
    plt.figure(figsize=(10, 8))
    sns.heatmap(data[NUMERIC_FEATURES + ['reserve_amount']].corr(), annot=True, cmap='coolwarm')
    plt.title('Correlation Heatmap')
    plt.savefig(os.path.join(EDA_DIR, 'correlation_heatmap.png'))
    plt.close()
    
    # Fraud by incident type
    plt.figure(figsize=(8, 6))
    sns.countplot(x='incident_type', hue='is_fraudulent', data=data)
    plt.title('Fraud by Incident Type')
    plt.savefig(os.path.join(EDA_DIR, 'fraud_by_incident_type.png'))
    plt.close()
    
    logger.info("EDA plots saved to %s", EDA_DIR)
