Backend Plan for AI-Powered Insurance Claim Processing System
This document outlines the backend plan for an AI-powered insurance claim processing and fraud detection system, designed as a class project prototype. The backend will be a RESTful API built with Flask, integrated with PostgreSQL for data storage, EasyOCR for PDF processing, spaCy for NLP, and XGBoost for machine learning tasks (fraud detection and reserve estimation). It includes authentication (JWT) for insurer access and reporting/model monitoring routes. The system processes uploaded claim PDFs, extracts structured data, predicts fraud likelihood, estimates reserves, and provides reporting/model performance insights.
1. Technology Stack

Framework: Flask with Flask-RESTful (lightweight, Python-native, ideal for ML integration).
Database: PostgreSQL with SQLAlchemy ORM (flexible, supports migrations via Alembic).
File Handling: Flask file uploads + pdfplumber for PDF parsing.
OCR: EasyOCR (better accuracy for scanned/handwritten docs, supports English/Swahili).
NLP: spaCy (entity recognition for fields like names, dates, amounts).
ML Libraries:
scikit-learn/XGBoost for fraud detection (classification) and reserve estimation (regression).
Optional: Hugging Face Transformers (BERT) for text-based fraud analysis.


Authentication: Flask-JWT-Extended for JWT-based insurer login.
Other Tools:
Joblib for saving/loading ML models.
Optional: Celery + Redis for background tasks (e.g., heavy OCR/ML processing).
CORS for frontend integration.


Environment: Virtualenv, requirements.txt for dependencies.

2. Project Structure
Modular structure for maintainability:
insurance_claim_backend/
├── app/
│   ├── __init__.py          # Flask app factory, registers blueprints
│   ├── config.py            # Config (DB URI, secret keys)
│   ├── models/              # DB models (User, Claim, Prediction, ModelStats)
│   │   └── __init__.py
│   ├── services/            # Business logic (OCR, ML, extraction, auth)
│   │   ├── ocr_service.py
│   │   ├── ml_service.py
│   │   ├── data_extraction.py
│   │   └── auth_service.py
│   ├── routes/              # API endpoints
│   │   ├── claims.py        # Claim routes
│   │   ├── auth.py          # Auth routes
│   │   ├── reports.py       # Reporting routes
│   │   └── models.py        # Model stats routes
│   └── utils/               # Helpers (feature engineering, metrics calc)
├── migrations/              # Alembic for DB migrations
├── ml_models/               # Saved models (e.g., fraud_classifier.pkl)
├── requirements.txt         # Dependencies
├── run.py                   # App entry point
└── tests/                   # Unit tests (pytest)

3. Database Schema
PostgreSQL tables via SQLAlchemy:

User (for authentication):

id (PK, integer)
username (string, unique)
password_hash (string, hashed with bcrypt)
role (enum: "admin", "insurer")
created_at (timestamp)


Claim:

id (PK, integer)
user_id (FK to User)
pdf_filename (string)
extracted_data (JSONB: e.g., {"claimant_name": "John Doe", "amount": 5000})
status (enum: "pending", "processed", "approved", "rejected")
created_at (timestamp)


Prediction (1:1 with Claim):

claim_id (FK)
fraud_score (float: 0-1)
is_fraudulent (boolean: fraud_score > 0.5)
reserve_estimate (float: predicted reserve)
model_version (string: track ML versions)


ModelStats (for model monitoring):

id (PK, integer)
model_name (string: e.g., "fraud_classifier_v1")
model_type (enum: "fraud", "reserve")
metrics (JSONB: e.g., {"accuracy": 0.92, "recall": 0.85, "precision": 0.88})
status (enum: "active", "inactive", "training")
trained_at (timestamp)



Initialize in app/__init__.py with db.create_all() (dev) or migrations (prod-like).
4. API Routes
Routes in routes/ under /api/v1 prefix. All routes except /auth/login require JWT.
Authentication Routes (routes/auth.py)

POST /auth/login

Description: Authenticate insurer, return JWT.
Request: JSON {"username": "insurer1", "password": "pass123"}
Response: JSON {"access_token": "..."}
Logic: Verify credentials with bcrypt, generate JWT.


POST /auth/register (admin only)

Description: Register new insurer.
Request: JSON {"username": "...", "password": "...", "role": "insurer"}
Response: JSON {"message": "User created"}



Claim Routes (routes/claims.py)

POST /claims/upload (JWT required)

Description: Upload PDF, run OCR + extraction + ML, store results.
Request: Multipart file (PDF) + JSON {"user_id": 123}
Response: JSON {claim_id, extracted_data, fraud_score, is_fraudulent, reserve_estimate}
Logic: Save file, OCR, extract data, predict, store in DB, clean up.


GET /claims (JWT required)

Description: List claims (paginated).
Query: ?page=1&limit=10&status=processed
Response: JSON array [claim1, claim2, ...].


GET /claims/{claim_id} (JWT required)

Description: Get claim details + predictions.
Response: JSON with all fields.


PUT /claims/{claim_id}/update (JWT required)

Description: Update status (e.g., approve/reject).
Request: JSON {"status": "approved"}
Response: Updated claim.


DELETE /claims/{claim_id} (admin only)

Description: Delete claim.



Report Routes (routes/reports.py)

GET /reports/claims (JWT required)

Description: Generate summary report of claims.
Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&status=processed
Response: JSON {"total_claims": 100, "fraudulent_count": 10, "avg_fraud_score": 0.3, "avg_reserve": 5000}
Logic: Aggregate Claim and Prediction data (e.g., count, averages).


GET /reports/fraud_trends (JWT required)

Description: Analyze fraud patterns (e.g., by amount, region).
Query: ?group_by=amount|region
Response: JSON {"trends": [{"range": "0-5000", "fraud_count": 5}, ...]}
Logic: Group claims by feature, count fraudulent ones.



Model Routes (routes/models.py)

GET /models (admin only)

Description: List all models and their stats.
Response: JSON array [{model_name, model_type, metrics, status, trained_at}, ...]
Logic: Query ModelStats table.


GET /models/{model_name} (admin only)

Description: Get detailed stats for a model.
Response: JSON {model_name, model_type, metrics: {accuracy, recall, precision, f1}, status, trained_at}
Logic: Fetch from ModelStats, include metrics like recall.


POST /models/retrain (admin only)

Description: Trigger model retraining (offline or via Celery).
Request: JSON {"model_name": "fraud_classifier_v1", "model_type": "fraud"}
Response: JSON {"message": "Retraining started"}
Logic: Update ModelStats status to "training", queue task.



Error handling: 401 (unauthorized), 400 (invalid input), 500 (server errors).
5. ML and OCR Integration
Core logic in services/ modules, called from routes.
OCR Pipeline (services/ocr_service.py)

Function: process_pdf(pdf_path) -> raw_text
Steps:
Use pdfplumber to extract images/pages.
EasyOCR: reader = easyocr.Reader(['en', 'sw']) (English/Swahili).
Per page: text = reader.readtext(image, detail=0).
Concatenate text, handle errors (e.g., rotate images).


Called in /claims/upload.

Data Extraction (services/data_extraction.py)

Function: extract_structured_data(raw_text) -> dict
spaCy: nlp = spacy.load('en_core_web_sm') for entities (PERSON, MONEY, DATE).
Regex fallback: e.g., r"Claim Amount: (\d+)".
Output: {"claimant_name": "...", "incident_date": "...", "amount_claimed": 5000, "description": "..."}
Called post-OCR.

ML Pipeline (services/ml_service.py)
Training (Offline)

Data:
Kaggle datasets (e.g., Vehicle Insurance Fraud Detection).
Synthetic data: Faker for names/amounts, add fraud patterns (e.g., high amounts).


Fraud Detection (XGBoost Classifier):
Features: amount_claimed, description_length, has_medical_terms, etc.
Train: model = xgb.XGBClassifier(); model.fit(X_train, y_train); joblib.dump(model, 'ml_models/fraud_model.pkl')
Metrics: Calculate accuracy, recall, precision, F1; store in ModelStats.


Reserve Estimation (XGBoost Regressor):
Features: Similar + historical averages.
Train: model = xgb.XGBRegressor(); model.fit(X_train, y_train); joblib.dump(model, 'ml_models/reserve_model.pkl')


Optional: BERT for text fraud (fine-tune on claim descriptions).

Inference (Runtime)

Function: predict_fraud_and_reserve(extracted_data) -> dict
Steps:
Feature Engineering: Convert dict to vector (one-hot, TF-IDF for description).
Load models: fraud_model = joblib.load('ml_models/fraud_model.pkl')
Predict: fraud_prob = fraud_model.predict_proba(features)[0][1]
Threshold: is_fraud = fraud_prob > 0.5
Reserve: reserve = reserve_model.predict(features)[0]
Store metrics in ModelStats for monitoring.


Output: {"fraud_score": 0.75, "is_fraudulent": True, "reserve_estimate": 4500}

Full Flow (/claims/upload)

Authenticate JWT.
Save PDF to temp folder.
OCR -> raw_text.
Extract -> structured_data.
ML -> predictions.
Store: Insert Claim (extracted_data), Prediction (ML results).
Return JSON to frontend.
Clean up temp file.


Optional: Use Celery for async processing (process_claim.delay(claim_id)).

6. Deployment and Testing

Local Dev: flask run --debug
Hosting: Heroku/Render (free tier); set env vars for DB URI, JWT_SECRET.
Testing: Pytest for routes (mock OCR), ML (mock predictions), auth (JWT validation).
Scalability: Docker optional for prod; keep simple for class.

7. Implementation Plan

Week 1: Set up Flask, PostgreSQL, SQLAlchemy, JWT auth.
Week 2: Implement OCR + data extraction pipeline.
Week 3: Train ML models (offline), integrate inference.
Week 4: Add reports/models routes, test, deploy to Heroku.

This plan ensures a secure, modular backend with auth, reporting, and model monitoring, realistic for a class project.