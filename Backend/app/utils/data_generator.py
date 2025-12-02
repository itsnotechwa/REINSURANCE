import pandas as pd
from pathlib import Path
from datetime import datetime
import numpy as np
import random
from datetime import timedelta

def generate_synthetic_claims(num_samples: int = 1000) -> pd.DataFrame:
    """Generate synthetic claim data for training ML models."""
    random.seed(42)
    np.random.seed(42)
    
    claim_types = ['auto', 'health', 'home', 'life']
    statuses = ['pending', 'processed', 'approved', 'rejected']
    
    data = {
        'claim_id': range(1, num_samples + 1),
        'claim_amount': np.random.uniform(100, 100000, num_samples),
        'claim_type': [random.choice(claim_types) for _ in range(num_samples)],
        'claim_date': [(datetime.now() - timedelta(days=random.randint(1, 365))).strftime('%Y-%m-%d') for _ in range(num_samples)],
        'claimant_age': np.random.randint(18, 80, num_samples),
        'claim_length': np.random.randint(1, 30, num_samples),  # Days to process
        'is_fraudulent': [random.choice([0, 1]) for _ in range(num_samples)],
        'reserve_amount': np.random.uniform(0, 50000, num_samples)
    }
    
    df = pd.DataFrame(data)
    df.loc[df['claim_amount'] > 50000, 'is_fraudulent'] = df.loc[df['claim_amount'] > 50000, 'is_fraudulent'].apply(
        lambda x: 1 if random.random() > 0.3 else x
    )
    df['reserve_amount'] = df['claim_amount'] * np.random.uniform(0.5, 1.5, num_samples)
    
    return df


if __name__ == "__main__":
    output_dir = Path(__file__).resolve().parent.parent / "data"
    output_dir.mkdir(exist_ok=True)
    
    file_path = output_dir / "synthetic_claims.csv"
    df = generate_synthetic_claims(2000)
    df.to_csv(file_path, index=False)
    
    print(f"Synthetic claims data saved to {file_path}")
