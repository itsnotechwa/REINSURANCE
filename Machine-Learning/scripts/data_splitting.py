
import pandas as pd
from sklearn.model_selection import train_test_split
from config import NUMERIC_FEATURES, CATEGORICAL_FEATURES, DATA_DIR, logger
import os

def split_data(data: pd.DataFrame):
    """Split data into train, validation, and test sets."""
    logger.info("Splitting data...")
    
    # Features and targets
    X = data[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_fraud = data['is_fraudulent']
    y_reserve = data['reserve_amount']
    
    # Train/val/test split (70/15/15)
    X_temp, X_test, y_fraud_temp, y_fraud_test = train_test_split(
        X, y_fraud, test_size=0.15, random_state=42, stratify=y_fraud
    )
    X_train, X_val, y_fraud_train, y_fraud_val = train_test_split(
        X_temp, y_fraud_temp, test_size=0.1765, random_state=42, stratify=y_fraud_temp
    )
    y_reserve_train = y_reserve[X_train.index]
    y_reserve_val = y_reserve[X_val.index]
    y_reserve_test = y_reserve[X_test.index]
    
    # Save splits
    train_data = pd.concat([X_train, y_fraud_train.rename('is_fraudulent'), y_reserve_train.rename('reserve_amount')], axis=1)
    val_data = pd.concat([X_val, y_fraud_val.rename('is_fraudulent'), y_reserve_val.rename('reserve_amount')], axis=1)
    test_data = pd.concat([X_test, y_fraud_test.rename('is_fraudulent'), y_reserve_test.rename('reserve_amount')], axis=1)
    
    train_data.to_csv(os.path.join(DATA_DIR, 'train_data.csv'), index=False)
    val_data.to_csv(os.path.join(DATA_DIR, 'val_data.csv'), index=False)
    test_data.to_csv(os.path.join(DATA_DIR, 'test_data.csv'), index=False)
    
    logger.info("Data splits saved: Train=%d, Val=%d, Test=%d", len(train_data), len(val_data), len(test_data))
    return train_data, val_data, test_data
