# API Testing Plan for Insurance Claim Processing System

This guide outlines how to test all API routes in Postman to verify the backend functionality (auth, OCR, data extraction, ML, and database integration). Ensure the Flask app is running (`flask run --debug`) at `http://127.0.0.1:5000`, and you have a test PDF (`test.pdf`) ready.

## Prerequisites
- **Base URL**: `http://127.0.0.1:5000`
- **Headers** (for authenticated routes):
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json` (or `multipart/form-data` for file uploads)
- **Test PDF**: A PDF with claim details (e.g., "Claim Amount: $5000, Type: Auto, Date: 2025-01-01").
- **Database**: Ensure migrations are applied (`alembic upgrade head`).
- **JWT**: Save tokens from `/auth/login` for authenticated requests.

## Routes to Test

### 1. POST /auth/register
- **Purpose**: Create a new user (admin or insurer).
- **Test Cases**:
  - Register an admin user.
  - Register an insurer user.
  - Try registering with duplicate email (should fail).
- **Request**:
  - **Method**: POST
  - **URL**: `http://127.0.0.1:5000/auth/register`
  - **Headers**: `Content-Type: application/json`
  - **Body** (raw, JSON):
    ```json
    {
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User",
      "password": "securepassword",
      "role": "admin"
    }
    ```
    - Repeat for insurer: `{"email": "insurer@example.com", ..., "role": "insurer"}`
    - Duplicate email: Use same email as above.
- **Expected Response**:
  - Success (201):
    ```json
    {
      "message": "User created successfully",
      "user": {
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
      }
    }
    ```
  - Duplicate email (400):
    ```json
    {"message": "User with email admin@example.com already exists"}
    ```
- **Troubleshooting**:
  - **400 Error**: Check JSON format, ensure `role` is `admin` or `insurer`.
  - **Database error**: Verify `alembic upgrade head`.

### 2. POST /auth/login
- **Purpose**: Authenticate a user and get a JWT token.
- **Test Cases**:
  - Login with valid admin credentials.
  - Login with valid insurer credentials.
  - Login with wrong password (should fail).
- **Request**:
  - **Method**: POST
  - **URL**: `http://127.0.0.1:5000/auth/login`
  - **Headers**: `Content-Type: application/json`
  - **Body** (raw, JSON):
    ```json
    {
      "email": "admin@example.com",
      "password": "securepassword"
    }
    ```
    - Repeat for insurer: `{"email": "insurer@example.com", "password": "securepassword"}`
    - Wrong password: `{"email": "admin@example.com", "password": "wrong"}`
- **Expected Response**:
  - Success (200):
    ```json
    {
      "access_token": "eyJ...",
      "user": {
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin"
      }
    }
    ```
    - Save `access_token` for authenticated requests.
  - Invalid credentials (401):
    ```json
    {"message": "Invalid email or password"}
    ```
- **Troubleshooting**:
  - **401 Error**: Ensure user exists (`SELECT * FROM user;` in psql).
  - **500 Error**: Check `JWT_SECRET_KEY` in `.env`.

### 3. POST /ml/train-fraud
- **Purpose**: Train the fraud detection model (admin only).
- **Test Cases**:
  - Train with synthetic data (empty payload).
  - Train with invalid data (should fail).
- **Request**:
  - **Method**: POST
  - **URL**: `http://127.0.0.1:5000/ml/train-fraud`
  - **Headers**:
    - `Authorization: Bearer <admin_access_token>`
    - `Content-Type: application/json`
  - **Body** (raw, JSON):
    ```json
    []
    ```
    - Invalid data: `{"invalid": "data"}`
- **Expected Response**:
  - Success (200):
    ```json
    {
      "message": "Fraud model trained successfully",
      "model_stats_id": 1
    }
    ```
  - Non-admin (403):
    ```json
    {"message": "Admin access required"}
    ```
  - Invalid data (400):
    ```json
    {"message": "Invalid or empty training data"}
    ```
- **Troubleshooting**:
  - **403 Error**: Use admin token (from `admin@example.com` login).
  - **400 Error**: Check `ml_models/` directory permissions.
  - **File not found**: Ensure `FRAUD_MODEL_PATH` in `.env`.

### 4. POST /ml/train-reserve
- **Purpose**: Train the reserve estimation model (admin only).
- **Test Cases**:
  - Train with synthetic data.
  - Try with insurer token (should fail).
- **Request**:
  - **Method**: POST
  - **URL**: `http://127.0.0.1:5000/ml/train-reserve`
  - **Headers**:
    - `Authorization: Bearer <admin_access_token>`
    - `Content-Type: application/json`
  - **Body** (raw, JSON):
    ```json
    []
    ```
- **Expected Response**:
  - Success (200):
    ```json
    {
      "message": "Reserve model trained successfully",
      "model_stats_id": 2
    }
    ```
  - Non-admin (403):
    ```json
    {"message": "Admin access required"}
    ```
- **Troubleshooting**:
  - **403 Error**: Use admin token.
  - **400 Error**: Verify `RESERVE_MODEL_PATH` in `.env`.

### 5. GET /ml/model-stats
- **Purpose**: Retrieve ML model stats (admin only).
- **Test Cases**:
  - Get stats after training both models.
  - Try with insurer token (should fail).
- **Request**:
  - **Method**: GET
  - **URL**: `http://127.0.0.1:5000/ml/model-stats`
  - **Headers**:
    - `Authorization: Bearer <admin_access_token>`
- **Expected Response**:
  - Success (200):
    ```json
    [
      {
        "id": 1,
        "model_name": "fraud_model",
        "model_type": "fraud",
        "metrics": {"status": "trained", "timestamp": "..."},
        "status": "active",
        "trained_at": "2025-09-14T..."
      },
      ...
    ]
    ```
  - Non-admin (403):
    ```json
    {"message": "Admin access required"}
    ```
- **Troubleshooting**:
  - **404 Error**: Ensure models were trained (run `/ml/train-fraud`, `/ml/train-reserve`).
  - **Empty list**: Verify `model_stats` table in psql (`SELECT * FROM model_stats;`).

### 6. POST /claim/upload-claim
- **Purpose**: Upload a PDF, process it (OCR, data extraction, ML), and store claim/prediction.
- **Test Cases**:
  - Upload a valid PDF with admin token.
  - Upload a valid PDF with insurer token.
  - Upload a non-PDF file (should fail).
- **Request**:
  - **Method**: POST
  - **URL**: `http://127.0.0.1:5000/claim/upload-claim`
  - **Headers**:
    - `Authorization: Bearer <access_token>` (admin or insurer)
    - `Content-Type: multipart/form-data`
  - **Body** (form-data):
    - Key: `file`, Value: `test.pdf` (select file)
- **Expected Response**:
  - Success (201):
    ```json
    {
      "message": "Claim processed successfully",
      "claim": {
        "id": 1,
        "user_id": 1,
        "pdf_filename": "test.pdf",
        "status": "pending",
        "prediction": {
          "claim_id": 1,
          "fraud_score": 0.65,
          "is_fraudulent": true,
          "reserve_estimate": 7500.0,
          "model_version": "v1.0"
        }
      }
    }
    ```
  - Invalid file (400):
    ```json
    {"message": "Only PDF files are allowed"}
    ```
- **Troubleshooting**:
  - **400 Error**: Ensure `test.pdf` exists and contains claim-like text.
  - **401 Error**: Verify `Authorization` header.
  - **Models not found**: Run `/ml/train-fraud` and `/ml/train-reserve` first.
  - **File not saved**: Check `UPLOAD_FOLDER` in `.env` and `uploads/` permissions.

### 7. GET /claim/predictions/<claim_id>
- **Purpose**: Retrieve prediction details for a claim.
- **Test Cases**:
  - Get prediction for own claim (insurer).
  - Get any claim as admin.
  - Try accessing another user’s claim as insurer (should fail).
- **Request**:
  - **Method**: GET
  - **URL**: `http://127.0.0.1:5000/claim/predictions/1`
  - **Headers**:
    - `Authorization: Bearer <access_token>`
- **Expected Response**:
  - Success (200):
    ```json
    {
      "claim_id": 1,
      "fraud_score": 0.65,
      "is_fraudulent": true,
      "reserve_estimate": 7500.0,
      "model_version": "v1.0"
    }
    ```
  - Non-existent claim (404):
    ```json
    {"message": "No prediction found for this claim"}
    ```
  - Unauthorized access (403):
    ```json
    {"message": "Unauthorized access to claim"}
    ```
- **Troubleshooting**:
  - **404 Error**: Ensure claim exists (`SELECT * FROM claim;` in psql).
  - **403 Error**: Use correct user token or admin token.

## Post-Test Verification
- **Check database**: