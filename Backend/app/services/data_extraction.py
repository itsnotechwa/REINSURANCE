"""
Data extraction service for claim documents.
Supports both NLP-based extraction and mock data generation.
"""
import random
from datetime import datetime, timedelta
from werkzeug.exceptions import BadRequest
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to load spaCy, but don't fail if not available
try:
    import spacy
    import re
    nlp = spacy.load('en_core_web_sm')
    SPACY_AVAILABLE = True
except Exception as e:
    logger.warning("spaCy not available, using mock data extraction: %s", str(e))
    SPACY_AVAILABLE = False


def extract_structured_data_from_text(raw_text: str) -> dict:
    """Extract structured data from raw text using spaCy and regex."""
    if not raw_text or not isinstance(raw_text, str):
        raise BadRequest("Invalid or empty text provided")

    try:
        # Process text with spaCy
        doc = nlp(raw_text)
        
        # Initialize result
        extracted_data = {
            'claim_amount': None,
            'claim_date': None,
            'claimant_name': None,
            'claim_type': None
        }

        # Extract entities with spaCy
        for ent in doc.ents:
            if ent.label_ == 'MONEY':
                extracted_data['claim_amount'] = ent.text
            elif ent.label_ == 'DATE':
                extracted_data['claim_date'] = ent.text
            elif ent.label_ == 'PERSON':
                extracted_data['claimant_name'] = ent.text

        # Use regex for specific patterns (e.g., claim type)
        claim_type_pattern = r'\b(auto|health|home|life|property)\b'
        match = re.search(claim_type_pattern, raw_text, re.IGNORECASE)
        if match:
            extracted_data['claim_type'] = match.group(1).lower()

        # Log extracted data
        logger.info("Extracted data from text: %s", extracted_data)
        return extracted_data
    except Exception as e:
        logger.error("Error extracting data: %s", str(e))
        raise BadRequest(f"Failed to extract data: {str(e)}")


def extract_structured_data(source: str) -> dict:
    """
    Extract structured data from claim document.
    If spaCy is available and source looks like text, use NLP extraction.
    Otherwise, generate mock data.
    
    Args:
        source: Either raw text from OCR or filename
    """
    # If spaCy is available and source is long (likely text), try NLP extraction
    if SPACY_AVAILABLE and len(source) > 100:
        try:
            return extract_structured_data_from_text(source)
        except Exception as e:
            logger.warning("NLP extraction failed, using mock data: %s", str(e))
    
    # Generate mock data (useful for testing without OCR)
    logger.info("Generating mock extracted data for: %s", source[:50])
    
    claim_types = ['auto', 'health', 'property', 'home']
    claim_type = random.choice(claim_types)
    
    # Generate realistic claim amount based on type
    amount_ranges = {
        'auto': (1000, 50000),
        'health': (500, 100000),
        'property': (5000, 200000),
        'home': (2000, 150000)
    }
    
    min_amount, max_amount = amount_ranges.get(claim_type, (1000, 50000))
    claim_amount = round(random.uniform(min_amount, max_amount), 2)
    
    # Generate claimant info
    first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
    
    claimant_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    claimant_age = random.randint(25, 70)
    
    # Generate dates
    incident_date = (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d')
    claim_date = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
    
    # Generate description based on type
    descriptions = {
        'auto': [
            'Vehicle collision on highway',
            'Rear-end accident at intersection',
            'Single vehicle accident - hit guardrail',
            'Multi-vehicle pileup',
            'Vehicle theft and recovery damage'
        ],
        'health': [
            'Emergency room visit',
            'Surgical procedure',
            'Hospital admission',
            'Outpatient treatment',
            'Diagnostic imaging and tests'
        ],
        'property': [
            'Fire damage to commercial building',
            'Water damage from burst pipe',
            'Storm damage to roof',
            'Vandalism and theft',
            'Equipment malfunction damage'
        ],
        'home': [
            'Residential fire damage',
            'Flood damage',
            'Burglary and theft',
            'Tree fell on house',
            'Appliance malfunction damage'
        ]
    }
    
    description = random.choice(descriptions.get(claim_type, ['General claim']))
    
    return {
        'claim_type': claim_type,
        'claim_amount': claim_amount,
        'amount_claimed': claim_amount,  # Alias for compatibility
        'claimant_name': claimant_name,
        'claimant_age': claimant_age,
        'incident_date': incident_date,
        'claim_date': claim_date,
        'description': description,
        'policy_number': f"POL-{random.randint(100000, 999999)}"
    }
