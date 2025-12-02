
from data_generation import generate_synthetic_claims
from config import logger

def main():
    """Generate synthetic datasets for auto, health, and property claims in Kenya."""
    logger.info("Starting Phase 1: Data Generation at %s", "04:23 PM EAT, Monday, September 15, 2025")
    
    # Generate datasets with 5,000 samples per claim type
    datasets = generate_synthetic_claims(num_samples_per_type=5000)
    logger.info("Phase 1 completed. Generated datasets: auto, health, property with %d samples each", 5000)

if __name__ == "__main__":
    main()
