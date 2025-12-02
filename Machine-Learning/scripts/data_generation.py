import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from config import logger, DATA_DIR

# ----------------- Helpers -----------------
def round_nearest(x, base=100):
    return int(base * round(float(x) / base))

def generate_claim_amounts(distribution, size, min_val, max_val):
    claims = distribution(size)
    claims = np.clip(claims, min_val, max_val)
    # ensure ints and rounded to 100KES
    return [round_nearest(float(x), 100) for x in claims]

def random_dates_between(start_date, end_date, n, seed=None):
    """
    Return list of n datetimes uniformly between start_date and end_date.
    """
    if seed is not None:
        np.random.seed(seed)
    start_u = int(start_date.timestamp())
    end_u = int(end_date.timestamp())
    # use numpy for speed
    times = np.random.randint(start_u, end_u + 1, size=n)
    return [datetime.fromtimestamp(int(t)) for t in times]

# ----------------- Reserve function (final, realistic) -----------------
def calculate_reserve_row(row):
    """
    Realistic initial reserve calculation.
    Inputs (expected keys in row): claim_amount, incident_severity,
    policy_deductible, policy_annual_premium, policy_limit, policy_type,
    is_fraudulent, num_prior_claims, days_since_policy_inception.
    Returns integer reserve_amount in KES.
    """
    # ensure numeric extraction with safe defaults
    claim = float(row.get("claim_amount", 0.0))
    deductible = float(row.get("policy_deductible", 0.0))
    policy_limit = float(row.get("policy_limit", max(claim, 1.0)))
    premium = float(row.get("policy_annual_premium", max(3000.0, claim * 0.08)))
    ptype = str(row.get("policy_type", "auto")).lower()
    severity = str(row.get("incident_severity", "major")).lower()
    prior = int(row.get("num_prior_claims", 0))
    days_since_inception = int(row.get("days_since_policy_inception", 365))
    is_fraud = int(row.get("is_fraudulent", 0))

    # Base fraction by severity (conservative, explainable mapping)
    # Adjusted to higher bases for more realistic reserves
    sev_base = {"minor": 0.5, "major": 0.8, "total_loss": 1.0}
    base_frac = sev_base.get(severity, 0.75)

    # policy-type factor (health often negotiated; property may require rebuild)
    type_factor_map = {"auto": 1.0, "health": 0.9, "property": 1.0}
    type_factor = type_factor_map.get(ptype, 1.0)

    # Start with base reserve
    reserve = base_frac * claim * type_factor

    # Policy tenure effect: very new policies increase uncertainty slightly
    if days_since_inception < 30:
        reserve *= 1.10
    elif days_since_inception < 180:
        reserve *= 1.03

    # Prior claims bump: more prior claims => slightly higher conservative reserve
    if prior >= 3:
        reserve *= 1.08
    elif prior == 2:
        reserve *= 1.05
    elif prior == 1:
        reserve *= 1.02

    # Deductible reduces expected insurer payout
    reserve = max(0.0, reserve - deductible)

    # Cap by policy limit (insurer cannot pay more than policy limit)
    reserve = min(reserve, policy_limit)

    # Fraud behavior: if flagged fraudulent, insurers often withhold major amounts pending investigation.
    # We model that by reducing immediate reserve but not to zero (keep some amount for legitimate immediate costs).
    if is_fraud == 1:
        reserve *= np.random.uniform(0.30, 0.65)  # holdback range
    else:
        # small random upward adjustment for normal claims due to admin uncertainty
        reserve *= np.random.uniform(0.95, 1.08)

    # Add modest uncertainty noise (± up to 8%)
    noise = np.random.uniform(-0.08, 0.08)
    reserve *= (1.0 + noise)

    # Ensure reserve is not negative, not greater than claim, and not unreasonably small for valid claims
    reserve = max(0.0, min(reserve, claim))

    # Avoid zero reserves for claims with evidence: if not fraud and claim > small threshold, ensure minimal reserve
    if is_fraud == 0 and claim >= 10000 and reserve < 0.05 * claim:
        reserve = max(reserve, 0.05 * claim)

    # Final rounding to 100KES
    reserve = int(round(reserve / 100.0) * 100)

    return reserve

# ----------------- Main generator -----------------
def generate_synthetic_claims(num_samples_per_type=3000,
                              start_date=datetime(2020, 1, 1),
                              end_date=datetime(2025, 9, 15),
                              seed=42):
    """
    Generate a single unified claims CSV (auto, health, property).
    Returns: pandas.DataFrame and saves to DATA_DIR/unified_claims.csv
    """
    np.random.seed(seed)

    fraud_rate = 0.05
    normal_samples = int(num_samples_per_type * (1 - fraud_rate))
    fraud_samples = num_samples_per_type - normal_samples

    # Counties + weights (normalized)
    kenyan_counties = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Turkana',
                       'Kiambu', 'Kilifi', 'Uasin Gishu', 'Kakamega', 'Bungoma',
                       'Nyeri', 'Machakos', 'Kisii', 'Meru', 'Eldoret']
    county_weights = np.array([0.25, 0.10, 0.08, 0.06, 0.03,
                               0.07, 0.05, 0.06, 0.05, 0.04,
                               0.03, 0.04, 0.03, 0.03, 0.04])
    county_weights = county_weights / county_weights.sum()

    # Claim ranges per policy_type
    claim_ranges = {
        'auto': (50_000, 1_000_000),
        'health': (10_000, 500_000),
        'property': (100_000, 5_000_000)
    }

    # Gamma scales per type to ensure more variation and less clipping at min
    claim_scales = {
        'auto': 100_000,  # mean ~200k for gamma(shape=2)
        'health': 50_000,  # mean ~100k
        'property': 500_000  # mean ~1M
    }

    # Incident types per line (add boda boda for auto realism)
    incident_types = {
        'auto': ['single_vehicle_collision', 'multi_vehicle_collision', 'parked_vehicle', 'boda_boda_collision'],
        'health': ['emergency_visit', 'surgery', 'hospitalization'],
        'property': ['fire', 'flood', 'theft', 'burglary']
    }

    # Adjusted probabilities for auto to increase boda_boda realism
    auto_incident_probs = [0.5, 0.3, 0.1, 0.1]

    payment_methods = ['mpesa', 'bank_transfer', 'cash']
    payment_weights = [0.62, 0.31, 0.07]  # realistic split

    unified_frames = []

    for ptype in ['auto', 'health', 'property']:
        min_claim, max_claim = claim_ranges[ptype]
        scale = claim_scales[ptype]

        # generate base claim amounts (gamma for right skew)
        normal_claims = generate_claim_amounts(lambda n: np.random.gamma(2.0, scale, n), normal_samples, min_claim, max_claim)

        # policy_limit: scale with claim_range and policy_type to avoid absurd values
        # choose a multiplier sampled from a plausible band depending on policy type
        if ptype == 'auto':
            limit_multipliers = np.random.uniform(1.5, 4.0, normal_samples)  # typical auto limits
            max_limit = 2_000_000
        elif ptype == 'health':
            limit_multipliers = np.random.uniform(1.5, 6.0, normal_samples)  # health policies vary
            max_limit = 5_000_000
        else:  # property
            limit_multipliers = np.random.uniform(2.0, 8.0, normal_samples)  # property values higher
            max_limit = 20_000_000
        policy_limits = [round_nearest(max(min_claim, min(max_claim * 8, int(c * m))), 100) for c, m in zip(normal_claims, limit_multipliers)]
        # ensure policy_limit at least somewhat larger than claim; clip to sensible upper bound
        policy_limits = [int(min(max(100_000, pl), max_limit)) for pl in policy_limits]

        # deductibles by line (higher deductibles more common on commercial/property)
        if ptype == 'auto':
            deductibles = np.random.choice([0, 5_000, 10_000, 20_000], normal_samples, p=[0.05, 0.45, 0.35, 0.15])
        elif ptype == 'health':
            deductibles = np.random.choice([0, 2_000, 5_000, 10_000], normal_samples, p=[0.2, 0.5, 0.25, 0.05])
        else:  # property
            deductibles = np.random.choice([0, 10_000, 25_000, 50_000], normal_samples, p=[0.02, 0.3, 0.4, 0.28])

        # premiums correlated with policy_limit (insurers price against limit + risk)
        premiums = [round_nearest(max(3000, pl * np.random.uniform(0.006, 0.02)), 500) for pl in policy_limits]

        # severities
        severities = np.random.choice(['minor', 'major', 'total_loss'], normal_samples, p=[0.68, 0.27, 0.05])

        # policy inception dates (0 - 6 years before end_date)
        policy_inception_dates = []
        for _ in range(normal_samples):
            years_back = np.random.randint(0, 6)
            days_back = np.random.randint(0, 365)
            inception = end_date - relativedelta(years=years_back) - timedelta(days=int(days_back))
            policy_inception_dates.append(inception)

        # claim dates: ensure after inception
        claim_dates = []
        for inception in policy_inception_dates:
            start_for_claim = max(start_date, inception)
            days_possible = (end_date - start_for_claim).days
            if days_possible < 0:
                claim_date = start_for_claim  # fallback, though unlikely
            else:
                offset = np.random.randint(0, days_possible + 1)
                claim_date = start_for_claim + timedelta(days=offset)
            claim_dates.append(claim_date)

        # claim dates and report delays
        report_delays = np.random.randint(0, 15, normal_samples)  # normal reporting
        report_dates = [cd + timedelta(days=int(d)) for cd, d in zip(claim_dates, report_delays)]

        # other fields
        ages = np.random.randint(18, 75, normal_samples)
        genders = np.random.choice(['male', 'female', 'other'], normal_samples, p=[0.47, 0.47, 0.06])
        education = np.random.choice(['high_school', 'bachelors', 'masters'], normal_samples, p=[0.5, 0.35, 0.15])
        occupations = np.random.choice(['sales', 'tech', 'manual_labor', 'farmer', 'driver'], normal_samples)
        counties = np.random.choice(kenyan_counties, normal_samples, p=county_weights)
        payments = np.random.choice(payment_methods, normal_samples, p=payment_weights)
        prior_claims = np.random.poisson(0.6, normal_samples)
        incident_hours = np.random.randint(0, 24, normal_samples)
        police_reports = np.random.choice(['yes', 'no'], normal_samples, p=[0.75, 0.25])

        # assemble base df for this line
        base = pd.DataFrame({
            "policy_type": [ptype]*normal_samples,
            "claim_amount": normal_claims,
            "policy_limit": policy_limits,
            "policy_deductible": deductibles,
            "policy_annual_premium": premiums,
            "incident_severity": severities,
            "policy_inception_date": [d.date().isoformat() for d in policy_inception_dates],
            "claim_date": [d.date().isoformat() for d in claim_dates],
            "report_date": [d.date().isoformat() for d in report_dates],
            "days_since_policy_inception": [(claim_dates[i] - policy_inception_dates[i]).days for i in range(normal_samples)],
            "report_delay_days": report_delays,
            "insured_age": ages,
            "insured_gender": genders,
            "insured_education": education,
            "insured_occupation": occupations,
            "county": counties,
            "payment_method": payments,
            "num_prior_claims": prior_claims,
            "incident_hour": incident_hours,
            "police_report_available": police_reports,
            "is_fraudulent": 0
        })

        # add line-specific columns
        if ptype == "auto":
            base["bodily_injuries"] = np.random.choice([0, 1, 2], normal_samples, p=[0.75, 0.20, 0.05])
            base["witnesses"] = np.random.choice([0, 1, 2, 3], normal_samples, p=[0.15, 0.35, 0.35, 0.15])
            base["vehicle_type"] = np.random.choice(["saloon", "suv", "pickup", "matatu"], normal_samples, p=[0.45,0.2,0.15,0.2])
            base["incident_type"] = np.random.choice(incident_types["auto"], normal_samples, p=auto_incident_probs)
            base["garage_id"] = np.random.randint(200, 999, normal_samples)
        elif ptype == "health":
            base["diagnosis_code"] = np.random.choice(["D123", "H456", "M789", "S234"], normal_samples)
            base["treatment_type"] = np.random.choice(["surgery", "consultation", "medication"], normal_samples, p=[0.2,0.5,0.3])
            base["hospital_id"] = np.random.randint(1000, 1999, normal_samples)
            base["incident_type"] = np.random.choice(incident_types["health"], normal_samples)
        else:  # property
            base["property_type"] = np.random.choice(["residential", "commercial"], normal_samples, p=[0.8, 0.2])
            base["damage_cause"] = np.random.choice(incident_types["property"], normal_samples, p=[0.5,0.2,0.2,0.1])
            base["incident_type"] = base["damage_cause"]
            base["assessor_id"] = np.random.randint(3000, 3999, normal_samples)

        # compute reserve for normal claims
        base["reserve_amount"] = base.apply(lambda r: calculate_reserve_row(r.to_dict()), axis=1)

        # ---------- Fraud rows ----------
        fraud_idx = np.random.choice(range(normal_samples), fraud_samples, replace=False)  # no duplicates
        fraud = base.iloc[fraud_idx].copy().reset_index(drop=True)

        # Inflate claim_amount for fraud rows (but not beyond policy_limit)
        inflation = np.random.uniform(1.25, 1.9, fraud_samples)
        inflated_claims = []
        for orig, infl, pl in zip(fraud["claim_amount"].values, inflation, fraud["policy_limit"].values):
            val = int(min(int(round_nearest(orig * infl, 100)), int(pl)))  # cap at policy limit
            if val < orig:
                val = int(round_nearest(orig * 1.2, 100))
            inflated_claims.append(val)
        fraud["claim_amount"] = inflated_claims

        # Fraud indicators
        fraud["police_report_available"] = np.random.choice(['no', '?'], fraud_samples, p=[0.85, 0.15])
        fraud["report_delay_days"] = np.random.randint(7, 90, fraud_samples)
        fraud["report_date"] = [(pd.to_datetime(cd) + timedelta(days=int(d))).date().isoformat() for cd, d in zip(fraud["claim_date"].values, fraud["report_delay_days"].values)]
        fraud["num_prior_claims"] = fraud["num_prior_claims"] + np.random.randint(1, 4, fraud_samples)
        fraud["is_fraudulent"] = 1

        # suspicious provider IDs sometimes (set to out-of-range IDs to simulate unknown providers)
        if ptype == "health":
            mask = np.random.rand(fraud_samples) < 0.18
            fraud.loc[mask, "hospital_id"] = np.random.randint(3000, 9999, mask.sum())
        if ptype == "auto":
            mask = np.random.rand(fraud_samples) < 0.12
            fraud.loc[mask, "garage_id"] = np.random.randint(10000, 99999, mask.sum())
        if ptype == "property":
            mask = np.random.rand(fraud_samples) < 0.12
            fraud.loc[mask, "assessor_id"] = np.random.randint(10000, 99999, mask.sum())

        # Recompute reserve for fraud rows based on inflated claims, then reduce to model withholding during investigation
        fraud["reserve_amount"] = fraud.apply(lambda r: calculate_reserve_row(r.to_dict()), axis=1)
        fraud["reserve_amount"] = fraud["reserve_amount"].apply(lambda v: int(round_nearest(max(0, int(v * np.random.uniform(0.25, 0.6))), 100)))

        # Combine and shuffle
        combined = pd.concat([base, fraud], ignore_index=True).sample(frac=1.0, random_state=seed).reset_index(drop=True)
        unified_frames.append(combined)

    # merge lines
    full = pd.concat(unified_frames, ignore_index=True).reset_index(drop=True)

    # add global IDs
    full.insert(0, "claim_id", range(1, len(full) + 1))
    full.insert(1, "policy_id", np.random.randint(100000, 999999, len(full)))

    # enforce types for numeric columns and fill missing safe defaults
    int_cols = ["claim_id", "policy_id", "claim_amount", "policy_limit", "policy_deductible",
                "policy_annual_premium", "reserve_amount", "num_prior_claims", "report_delay_days", "insured_age"]
    for c in int_cols:
        if c in full.columns:
            full[c] = pd.to_numeric(full[c], errors='coerce').fillna(0).astype(int)

    # Ensure boolean-like textual columns are present and normalized
    if "police_report_available" in full.columns:
        full["police_report_available"] = full["police_report_available"].astype(str).str.lower().replace({"true":"yes","false":"no"})

    # Save CSV
    os.makedirs(DATA_DIR, exist_ok=True)
    out = os.path.join(DATA_DIR, "unified_claims.csv")
    full.to_csv(out, index=False)

    try:
        logger.info("Generated unified dataset rows=%d fraud_rate=%.2f%% saved=%s", len(full), full["is_fraudulent"].mean() * 100, out)
    except Exception:
        pass

    return full

# If executed directly, generate a default dataset
if __name__ == "__main__":
    df = generate_synthetic_claims(num_samples_per_type=3000)
    print("Rows:", len(df), "Fraud rate: {:.2f}%".format(df["is_fraudulent"].mean() * 100))
    print("Saved to:", os.path.join(DATA_DIR, "unified_claims.csv"))