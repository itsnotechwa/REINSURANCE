# Reinsurance Application - Integration Guide

## Overview

This document describes the complete integration of the frontend, backend, and ML components of the reinsurance application. The application has been successfully integrated with the following key changes:

## Major Changes Implemented

### 1. Database Migration (PostgreSQL → SQLite)

**Why**: Easier deployment, no external database server required, perfect for development and small-scale deployments.

**Changes Made**:
- Updated `Backend/app/__init__.py` to use SQLite connection string
- Removed PostgreSQL dependency (`psycopg2-binary`)
- Database file created at: `Backend/reinsurance.db`

**Configuration**:
```python
# SQLite database path
SQLALCHEMY_DATABASE_URI = 'sqlite:///reinsurance.db'
```

### 2. Authentication System (JWT → HTTP-Only Cookies)

**Why**: More secure for browser-based applications, prevents XSS attacks, simpler client-side code.

**Changes Made**:
- Removed Flask-JWT-Extended dependency
- Implemented Flask session-based authentication
- Updated all route handlers to use session authentication
- Added CORS configuration with credentials support

**Key Files Modified**:
- `Backend/app/services/auth_service.py` - Session management
- `Backend/app/routes/auth_routes.py` - Login/logout endpoints
- `Backend/app/routes/claim_routes.py` - Protected claim endpoints
- `Backend/app/routes/ml_routes.py` - Protected ML endpoints

**Session Configuration**:
```python
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set True in production with HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
```

### 3. Machine Learning Integration (Rule-Based + ML Models)

**Why**: Immediate functionality without training data, with option to upgrade to ML models later.

**Implementation**:
- **Rule-Based System** (Active by default):
  - Fraud detection based on claim amount, type, and claimant age
  - Reserve estimation based on claim characteristics
  - No training required, works immediately

- **ML Models** (Optional upgrade):
  - Fraud detection: Logistic Regression
  - Reserve estimation: XGBoost Regressor
  - Automatically used when models are trained

**Key Features**:
- Automatic fallback to rule-based if models not available
- Synthetic data generation for training
- Model performance metrics tracking

**Files**:
- `Backend/app/services/ml_service.py` - ML and rule-based logic
- `Backend/app/utils/data_generator.py` - Synthetic data generation

### 4. Frontend API Integration

**Changes Made**:
- Created real API client replacing dummy implementation
- Updated AuthContext to use real backend authentication
- Configured CORS and credentials for cookie-based auth
- Added environment variable for API URL

**Key Files**:
- `Frontend/client/src/lib/api.ts` - API client
- `Frontend/client/src/contexts/AuthContext.tsx` - Authentication context
- `Frontend/.env` - Environment configuration

### 5. Dashboard Enhancements

**Added Beautiful Graphs**:
- **Pie Chart**: Claims by status distribution
- **Bar Chart**: Fraud vs legitimate claims comparison
- **Line Chart**: Claims trend over time
- **Stat Cards**: Key metrics at a glance

**Technologies Used**:
- Recharts library for data visualization
- Responsive design for all screen sizes
- Real-time data from backend API

**File**: `Frontend/client/src/pages/Dashboard.tsx`

## Project Structure

```
reinsurance/
├── Backend/
│   ├── app/
│   │   ├── __init__.py          # App factory with SQLite & CORS
│   │   ├── models/              # Database models
│   │   ├── routes/              # API endpoints (cookie auth)
│   │   ├── services/            # Business logic
│   │   └── utils/               # Helper functions
│   ├── ml_models/               # Trained models (optional)
│   ├── uploads/                 # Uploaded claim files
│   ├── reinsurance.db          # SQLite database
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                   # Application entry point
│   ├── start.sh                 # Startup script
│   └── .env                     # Environment variables
├── Frontend/
│   ├── client/
│   │   └── src/
│   │       ├── lib/api.ts       # Real API client
│   │       ├── contexts/        # React contexts
│   │       ├── pages/           # Application pages
│   │       └── components/      # Reusable components
│   ├── package.json
│   └── .env                     # Frontend config
└── Machine-Learning/
    ├── scripts/                 # Training scripts
    └── data/                    # Training datasets
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and create session
- `POST /auth/logout` - Logout and clear session
- `GET /auth/profile` - Get current user profile

### Claims Management
- `POST /claim/upload` - Upload and process claim PDF
- `GET /claim/claims` - List all claims (paginated)
- `GET /claim/claims/<id>` - Get specific claim details
- `PATCH /claim/claims/<id>` - Update claim status
- `DELETE /claim/claims/<id>` - Delete claim
- `GET /claim/predictions/<id>` - Get fraud prediction for claim
- `GET /claim/report` - Get claims statistics and report

### Machine Learning (Admin Only)
- `POST /ml/train-fraud` - Train fraud detection model
- `POST /ml/train-reserve` - Train reserve estimation model
- `GET /ml/model-stats` - Get model performance metrics

## Database Schema

### User Table
- `id` (Integer, Primary Key)
- `email` (String, Unique)
- `first_name` (String)
- `last_name` (String)
- `password_hash` (String)
- `role` (Enum: 'admin', 'insurer')
- `created_at` (DateTime)

### Claim Table
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key)
- `pdf_filename` (String)
- `extracted_data` (JSON)
- `status` (Enum: 'pending', 'processed', 'approved', 'rejected')
- `created_at` (DateTime)

### Prediction Table
- `claim_id` (Integer, Primary Key, Foreign Key)
- `fraud_score` (Float)
- `is_fraudulent` (Boolean)
- `reserve_estimate` (Float)
- `model_version` (String)

### ModelStats Table
- `id` (Integer, Primary Key)
- `model_name` (String)
- `model_type` (Enum: 'fraud', 'reserve')
- `metrics` (JSON)
- `status` (Enum: 'active', 'inactive', 'training')
- `trained_at` (DateTime)

## Running the Application

### Backend Setup

1. **Install Dependencies**:
```bash
cd Backend
sudo pip3 install Flask Flask-RESTful Flask-SQLAlchemy Flask-CORS bcrypt python-dotenv scikit-learn joblib xgboost
```

2. **Start Backend**:
```bash
cd Backend
python3.11 run.py
```

The backend will start on `http://127.0.0.1:5000`

### Frontend Setup

1. **Install Dependencies**:
```bash
cd Frontend
pnpm install
```

2. **Start Frontend**:
```bash
cd Frontend
pnpm dev
```

The frontend will start on `http://localhost:5173`

## Testing the Integration

### 1. Test Backend API

```bash
# Register a user
curl -X POST http://127.0.0.1:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User","role":"insurer"}'

# Login and save cookie
curl -c cookies.txt -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile with cookie
curl -b cookies.txt http://127.0.0.1:5000/auth/profile

# Get claims report
curl -b cookies.txt http://127.0.0.1:5000/claim/report
```

### 2. Test Frontend

1. Open browser to `http://localhost:5173`
2. Register a new account
3. Login with credentials
4. Navigate to Dashboard to see graphs
5. Upload a claim (PDF file)
6. View claims list
7. Check claim details and predictions

## Current Status

### ✅ Completed
- Database migrated to SQLite
- HTTP-only cookie authentication implemented
- Rule-based ML logic working
- Frontend connected to backend
- Dashboard with beautiful graphs
- All API endpoints functional
- CORS configured properly
- Session management working

### ⚠️ Limitations
- OCR functionality disabled (spaCy not installed)
  - Currently using mock data extraction
  - Can be enabled by installing: `sudo pip3 install spacy easyocr pdfplumber`
- ML models not trained yet (using rule-based logic)
- Mock trend data in dashboard (needs historical data)

### 🔄 Ready for Enhancement
- Train ML models with real data
- Enable OCR for real PDF processing
- Add more sophisticated fraud detection rules
- Implement real-time fraud trend analysis
- Add user management for admins

## Security Considerations

1. **Session Security**:
   - HTTP-only cookies prevent XSS attacks
   - Set `SESSION_COOKIE_SECURE=True` in production with HTTPS
   - Session data stored server-side

2. **Password Security**:
   - Passwords hashed with bcrypt
   - Never stored in plain text

3. **CORS Configuration**:
   - Configured for development (localhost)
   - Update origins for production deployment

4. **File Upload Security**:
   - Only PDF files allowed
   - Filenames sanitized with `secure_filename()`
   - Files stored in dedicated upload directory

## Environment Variables

### Backend (.env)
```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
FRAUD_MODEL_PATH=ml_models/fraud_model.pkl
RESERVE_MODEL_PATH=ml_models/reserve_model.pkl
UPLOAD_FOLDER=uploads
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use: `netstat -tuln | grep 5000`
- Verify all dependencies installed: `pip3 list | grep -i flask`
- Check for errors in terminal output

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS configuration in `Backend/app/__init__.py`
- Ensure `VITE_API_URL` is set correctly in `Frontend/.env`

### Authentication not working
- Clear browser cookies
- Check session configuration in backend
- Verify credentials are correct

### Database errors
- Delete `Backend/reinsurance.db` and restart backend to recreate
- Check file permissions on database file

## Next Steps

See `ML_TRAINING_PLAN.md` for detailed instructions on training machine learning models with real data.
