import pandas as pd
from config import NUMERIC_FEATURES, CATEGORICAL_FEATURES, logger

def clean_data(data: pd.DataFrame) -> pd.DataFrame:
    """Clean data: handle missing values, ensure correct types, cap outliers."""
    logger.info("Cleaning data...")
    data = data.copy()
    
    # Handle missing values
    data[NUMERIC_FEATURES] = data[NUMERIC_FEATURES].fillna(data[NUMERIC_FEATURES].median())
    data[CATEGORICAL_FEATURES] = data[CATEGORICAL_FEATURES].fillna('unknown')
    
    # Ensure types
    for col in NUMERIC_FEATURES:
        data[col] = data[col].astype(float)
    for col in CATEGORICAL_FEATURES:
        data[col] = data[col].astype(str)
    data['is_fraudulent'] = data['is_fraudulent'].astype(int)
    data['reserve_amount'] = data['reserve_amount'].astype(float)
    
    # Cap outliers (99th percentile)
    for col in NUMERIC_FEATURES:
        cap = data[col].quantile(0.99)
        data[col] = data[col].clip(upper=cap)
    
    logger.info("Data cleaned. Shape: %s", data.shape)
    return data
