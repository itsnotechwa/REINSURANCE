Backend Documentation for AI-Powered Insurance Claim Processing System
This document provides comprehensive documentation for the backend of the AI-Powered Insurance Claim Processing and Fraud Detection System. The backend is a RESTful API built with Flask, integrated with PostgreSQL, EasyOCR, spaCy, and XGBoost for processing insurance claim PDFs, extracting data, detecting fraud, estimating reserves, and providing reports/model statistics. It includes JWT-based authentication using email, with first name and last name for registration.
Table of Contents

Overview
API Endpoints Summary
Detailed API Documentation
Authentication Routes
Claim Routes
Report Routes
Model Routes


Error Codes and Handling
Database Schema
Dependencies
Setup and Deployment

Overview
The backend is designed to:

Authenticate insurers via JWT using email, with first name and last name stored during registration.
Process uploaded claim PDFs using OCR and NLP to extract structured data.
Predict fraud likelihood and reserve amounts using ML models.
Store claims and predictions in PostgreSQL.
Provide reporting on claims and fraud trends.
Expose model performance metrics (e.g., accuracy, recall) for monitoring.

The API is prefixed with /api/v1. All routes except /auth/login and /auth/register require a valid JWT in the Authorization: Bearer <token> header.
API Endpoints Summary



Method
Endpoint
Description
Authentication



POST
/auth/login
Authenticate insurer, return JWT
None


POST
/auth/register
Register new insurer (admin only)
JWT (admin)


POST
/claims/upload
Upload PDF, process claim, return results
JWT


GET
/claims
List claims (paginated)
JWT


GET
/claims/{claim_id}
Get specific claim details
JWT


PUT
/claims/{claim_id}/update
Update claim status
JWT


DELETE
/claims/{claim_id}
Delete claim (admin only)
JWT (admin)


GET
/reports/claims
Summary report of claims
JWT


GET
/reports/fraud_trends
Analyze fraud patterns
JWT


GET
/models
List all ML models and stats
JWT (admin)


GET
/models/{model_name}
Get detailed stats for a model
JWT (admin)


POST
/models/retrain
Trigger model retraining
JWT (admin)


Detailed API Documentation
Authentication Routes
POST /api/v1/auth/login
Authenticate an insurer and return a JWT token.

Request:
Content-Type: application/json
Body:{
  "email": "insurer1@example.com",
  "password": "pass123"
}




Response:
200 OK:{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}


400 Bad Request: Missing email/password.{"error": "Missing email or password"}


401 Unauthorized: Invalid credentials.{"error": "Invalid email or password"}





POST /api/v1/auth/register
Register a new insurer (admin only).

Request:
Headers: Authorization: Bearer <admin_token>
Content-Type: application/json
Body:{
  "email": "insurer2@example.com",
  "password": "pass456",
  "first_name": "Jane",
  "last_name": "Doe",
  "role": "insurer"
}




Response:
201 Created:{"message": "User created successfully"}


400 Bad Request: Missing fields or email taken.{"error": "Email already exists"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


403 Forbidden: Non-admin user.{"error": "Admin access required"}





Claim Routes
POST /api/v1/claims/upload
Upload a claim PDF, process it (OCR, NLP, ML), and return results.

Request:
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body:
file: PDF file
Optional JSON: {"user_id": 123}




Response:
201 Created:{
  "claim_id": 1,
  "extracted_data": {
    "claimant_name": "John Doe",
    "incident_date": "2025-01-01",
    "amount_claimed": 5000,
    "description": "Car accident on highway"
  },
  "fraud_score": 0.75,
  "is_fraudulent": true,
  "reserve_estimate": 4500,
  "status": "processed"
}


400 Bad Request: Invalid/no file or unsupported format.{"error": "PDF file required"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


500 Internal Server Error: OCR/ML failure.{"error": "Processing failed"}





GET /api/v1/claims
List claims (paginated).

Request:
Headers: Authorization: Bearer <token>
Query Params:
page (default: 1)
limit (default: 10)
status (optional: "pending", "processed", "approved", "rejected")




Response:
200 OK:{
  "claims": [
    {
      "id": 1,
      "user_id": 123,
      "pdf_filename": "claim1.pdf",
      "status": "processed",
      "created_at": "2025-09-13T18:52:00Z",
      "fraud_score": 0.75,
      "is_fraudulent": true,
      "reserve_estimate": 4500
    },
    ...
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}





GET /api/v1/claims/{claim_id}
Get details of a specific claim.

Request:
Headers: Authorization: Bearer <token>
Path: claim_id (integer)


Response:
200 OK:{
  "id": 1,
  "user_id": 123,
  "pdf_filename": "claim1.pdf",
  "extracted_data": {
    "claimant_name": "John Doe",
    "incident_date": "2025-01-01",
    "amount_claimed": 5000,
    "description": "Car accident"
  },
  "status": "processed",
  "created_at": "2025-09-13T18:52:00Z",
  "fraud_score": 0.75,
  "is_fraudulent": true,
  "reserve_estimate": 4500
}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


404 Not Found: Claim not found.{"error": "Claim not found"}





PUT /api/v1/claims/{claim_id}/update
Update claim status.

Request:
Headers: Authorization: Bearer <token>
Path: claim_id (integer)
Content-Type: application/json
Body:{"status": "approved"}




Response:
200 OK:{
  "id": 1,
  "status": "approved",
  "updated_at": "2025-09-13T18:52:00Z"
}


400 Bad Request: Invalid status.{"error": "Invalid status"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


404 Not Found: Claim not found.{"error": "Claim not found"}





DELETE /api/v1/claims/{claim_id}
Delete a claim (admin only).

Request:
Headers: Authorization: Bearer <admin_token>
Path: claim_id (integer)


Response:
204 No Content: Claim deleted.
401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


403 Forbidden: Non-admin user.{"error": "Admin access required"}


404 Not Found: Claim not found.{"error": "Claim not found"}





Report Routes
GET /api/v1/reports/claims
Generate summary report of claims.

Request:
Headers: Authorization: Bearer <token>
Query Params:
start_date (optional, format: YYYY-MM-DD)
end_date (optional, format: YYYY-MM-DD)
status (optional: "pending", "processed", "approved", "rejected")




Response:
200 OK:{
  "total_claims": 100,
  "fraudulent_count": 10,
  "avg_fraud_score": 0.3,
  "avg_reserve": 5000,
  "status_breakdown": {
    "pending": 20,
    "processed": 50,
    "approved": 20,
    "rejected": 10
  }
}


400 Bad Request: Invalid date format.{"error": "Invalid date format"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}





GET /api/v1/reports/fraud_trends
Analyze fraud patterns.

Request:
Headers: Authorization: Bearer <token>
Query Params:
group_by (optional: "amount", "region")
start_date (optional, format: YYYY-MM-DD)
end_date (optional, format: YYYY-MM-DD)




Response:
200 OK:{
  "trends": [
    {"range": "0-5000", "fraud_count": 5, "total_count": 50},
    {"range": "5001-10000", "fraud_count": 3, "total_count": 30},
    ...
  ]
}


400 Bad Request: Invalid group_by or date format.{"error": "Invalid group_by parameter"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}





Model Routes
GET /api/v1/models
List all ML models and their stats (admin only).

Request:
Headers: Authorization: Bearer <admin_token>


Response:
200 OK:[
  {
    "model_name": "fraud_classifier_v1",
    "model_type": "fraud",
    "metrics": {
      "accuracy": 0.92,
      "recall": 0.85,
      "precision": 0.88,
      "f1": 0.86
    },
    "status": "active",
    "trained_at": "2025-09-10T10:00:00Z"
  },
  ...
]


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


403 Forbidden: Non-admin user.{"error": "Admin access required"}





GET /api/v1/models/{model_name}
Get detailed stats for a model (admin only).

Request:
Headers: Authorization: Bearer <admin_token>
Path: model_name (string, e.g., "fraud_classifier_v1")


Response:
200 OK:{
  "model_name": "fraud_classifier_v1",
  "model_type": "fraud",
  "metrics": {
    "accuracy": 0.92,
    "recall": 0.85,
    "precision": 0.88,
    "f1": 0.86
  },
  "status": "active",
  "trained_at": "2025-09-10T10:00:00Z"
}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


403 Forbidden: Non-admin user.{"error": "Admin access required"}


404 Not Found: Model not found.{"error": "Model not found"}





POST /api/v1/models/retrain
Trigger model retraining (admin only).

Request:
Headers: Authorization: Bearer <admin_token>
Content-Type: application/json
Body:{
  "model_name": "fraud_classifier_v1",
  "model_type": "fraud"
}




Response:
202 Accepted:{"message": "Retraining started"}


400 Bad Request: Invalid model_name/type.{"error": "Invalid model name or type"}


401 Unauthorized: Invalid/missing JWT.{"error": "Unauthorized"}


403 Forbidden: Non-admin user.{"error": "Admin access required"}





Error Codes and Handling



Code
Description
Example Response



200
OK
Successful response


201
Created
Resource created (e.g., claim)


202
Accepted
Request accepted (e.g., retraining)


204
No Content
Successful deletion


400
Bad Request
{"error": "Invalid input"}


401
Unauthorized
{"error": "Unauthorized"}


403
Forbidden
{"error": "Admin access required"}


404
Not Found
{"error": "Claim not found"}


500
Internal Server Error
{"error": "Processing failed"}



All errors return JSON with an error field.
500 errors logged server-side for debugging (e.g., OCR/ML failures).

Database Schema

User:

id (PK, integer)
email (string, unique)
first_name (string)
last_name (string)
password_hash (string, bcrypt)
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
is_fraudulent (boolean)
reserve_estimate (float)
model_version (string)


ModelStats:

id (PK, integer)
model_name (string: e.g., "fraud_classifier_v1")
model_type (enum: "fraud", "reserve")
metrics (JSONB: e.g., {"accuracy": 0.92, "recall": 0.85})
status (enum: "active", "inactive", "training")
trained_at (timestamp)



Dependencies

Flask==2.0.1
Flask-RESTful==0.3.9
Flask-SQLAlchemy==2.5.1
Flask-JWT-Extended==4.4.4
pdfplumber==0.7.4
easyocr==1.6.2
spacy==3.4.1
xgboost==1.6.2
scikit-learn==1.1.2
joblib==1.1.0
psycopg2-binary==2.9.3
python-jose==3.3.0 (for JWT)
bcrypt==4.0.1
Optional: celery==5.2.7, redis==4.3.4

Install via: pip install -r requirements.txt
Setup and Deployment

Local Setup:

Clone repo: git clone <repo_url>
Create virtualenv: python -m venv venv
Activate: source venv/bin/activate (Linux/Mac) or venv\Scripts\activate (Windows)
Install dependencies: pip install -r requirements.txt
Set env vars:
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/insurance_db
JWT_SECRET_KEY=your-secret-key


Initialize DB: flask db init (if using Alembic)
Run: flask run --debug


Deployment:

Host on Heroku/Render.
Set env vars in platform dashboard.
Use Gunicorn: gunicorn -w 4 run:app
PostgreSQL add-on for DB.


Testing:

Run pytest: pytest tests/
Test routes, auth, ML inference (mock OCR/ML for speed).



This documentation ensures the backend is production-ready, secure, and maintainable, with clear API specs for developers and frontend integration.