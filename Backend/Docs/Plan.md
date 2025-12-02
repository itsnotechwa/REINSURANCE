# Building Plan for AI-Powered Insurance Claim Processing System Backend

This building plan outlines a step-by-step process to implement the backend from scratch, based on the previously outlined plan and documentation. It's designed for a class project, assuming you're using Python 3.10+ on a local machine (e.g., Linux/Mac/Windows). We'll focus on modularity, testing at each stage, and integration. The plan is divided into phases with estimated time (for a solo developer with intermediate experience), tasks, and checkpoints.

I'll use a checklist format so you can "tick" as you go. Each phase includes prerequisites, key commands/code snippets, and testing tips.

## Prerequisites
- Python 3.10+ installed.
- PostgreSQL installed and running (or use a cloud service like Supabase/Heroku Postgres for simplicity).
- Git for version control.
- A code editor (e.g., VS Code).
- Basic knowledge of Flask, SQLAlchemy, and ML libraries.

**Total Estimated Time:** 2-4 weeks (part-time).

## Phase 1: Project Setup and Environment (1-2 days)
- [ ] Create project directory: `mkdir insurance_claim_backend && cd insurance_claim_backend`
- [ ] Initialize Git: `git init`
- [ ] Set up virtual environment: `python -m venv venv` (activate: `source venv/bin/activate` on Linux/Mac, `venv\Scripts\activate` on Windows)
- [ ] Create `requirements.txt` with dependencies (from docs):
  ```
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
  bcrypt==4.0.1
  gunicorn==20.1.0  # For deployment
  ```
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Download spaCy model: `python -m spacy download en_core_web_sm`
- [ ] Create project structure (as per plan):
  ```
  mkdir -p app/{models,services,routes,utils}
  mkdir ml_models tests migrations
  touch app/__init__.py app/config.py run.py requirements.txt
  ```
- [ ] Set up environment variables (create `.env` file):
  ```
  FLASK_APP=run.py
  FLASK_ENV=development
  DATABASE_URL=postgresql://user:pass@localhost:5432/insurance_db
  JWT_SECRET_KEY=your-secret-key-here
  ```
  - Load with `python-dotenv` (add to requirements.txt if needed).
- [ ] Create the database: Use pgAdmin or CLI: `createdb insurance_db`
- **Checkpoint:** Run `flask --version` to confirm setup. Commit to Git: `git add . && git commit -m "Initial setup"`

## Phase 2: Database and Models (2-3 days)
- [ ] Install Alembic for migrations: Add `alembic==1.8.0` to requirements.txt and install.
- [ ] Initialize Alembic: `alembic init migrations`
- [ ] Configure Alembic in `alembic.ini` and `env.py` to use SQLAlchemy from `app`.
- [ ] In `app/models/__init__.py`, define DB models (User, Claim, Prediction, ModelStats) using SQLAlchemy:
  ```python
  from sqlalchemy import Column, Integer, String, Enum, Float, JSON, ForeignKey, DateTime
  from sqlalchemy.ext.declarative import declarative_base
  from datetime import datetime
  import enum

  Base = declarative_base()

  class UserRole(enum.Enum):
      admin = "admin"
      insurer = "insurer"

  class ClaimStatus(enum.Enum):
      pending = "pending"
      processed = "processed"
      approved = "approved"
      rejected = "rejected"

  class ModelType(enum.Enum):
      fraud = "fraud"
      reserve = "reserve"

  class ModelStatus(enum.Enum):
      active = "active"
      inactive = "inactive"
      training = "training"

  class User(Base):
      __tablename__ = 'user'
      id = Column(Integer, primary_key=True)
      email = Column(String, unique=True, nullable=False)
      first_name = Column(String, nullable=False)
      last_name = Column(String, nullable=False)
      password_hash = Column(String, nullable=False)
      role = Column(Enum(UserRole), nullable=False)
      created_at = Column(DateTime, default=datetime.utcnow)

  class Claim(Base):
      __tablename__ = 'claim'
      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
      pdf_filename = Column(String, nullable=False)
      extracted_data = Column(JSON, nullable=False)
      status = Column(Enum(ClaimStatus), default=ClaimStatus.pending)
      created_at = Column(DateTime, default=datetime.utcnow)

  class Prediction(Base):
      __tablename__ = 'prediction'
      claim_id = Column(Integer, ForeignKey('claim.id'), primary_key=True)
      fraud_score = Column(Float)
      is_fraudulent = Column(Boolean)
      reserve_estimate = Column(Float)
      model_version = Column(String)

  class ModelStats(Base):
      __tablename__ = 'model_stats'
      id = Column(Integer, primary_key=True)
      model_name = Column(String, nullable=False)
      model_type = Column(Enum(ModelType), nullable=False)
      metrics = Column(JSON, nullable=False)
      status = Column(Enum(ModelStatus), default=ModelStatus.active)
      trained_at = Column(DateTime, default=datetime.utcnow)
  ```
- [ ] In `app/__init__.py`, set up Flask app, SQLAlchemy, JWT:
  ```python
  from flask import Flask
  from flask_sqlalchemy import SQLAlchemy
  from flask_jwt_extended import JWTManager
  from dotenv import load_dotenv
  import os

  load_dotenv()
  db = SQLAlchemy()
  jwt = JWTManager()

  def create_app():
      app = Flask(__name__)
      app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
      app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
      db.init_app(app)
      jwt.init_app(app)
      # Register blueprints later
      with app.app_context():
          db.create_all()  # For dev; use migrations in prod
      return app
  ```
- [ ] Create initial migration: `alembic revision --autogenerate -m "Initial models"` then `alembic upgrade head`
- **Checkpoint:** Run `flask shell` and query `User.query.all()` to test DB. Commit to Git.

## Phase 3: Services Implementation (3-4 days)
- [ ] Implement auth service (`app/services/auth_service.py`):
  - Functions: `hash_password(password)`, `verify_password(hash, password)`, `create_user(email, first_name, last_name, password, role)`, `authenticate(email, password)`
  - Use bcrypt for hashing.
- [ ] Implement OCR service (`app/services/ocr_service.py`):
  - Function: `process_pdf(pdf_path)` using pdfplumber and easyocr.
- [ ] Implement data extraction (`app/services/data_extraction.py`):
  - Function: `extract_structured_data(raw_text)` using spaCy and regex.
- [ ] Implement ML service (`app/services/ml_service.py`):
  - Offline training functions: `train_fraud_model(data)`, `train_reserve_model(data)` – use Kaggle/synthetic data, save with joblib.
  - Inference: `predict_fraud_and_reserve(extracted_data)`
  - Feature engineering in `app/utils/feature_engineering.py`.
- [ ] Download/train initial models: Write a script `train_models.py` to run offline, save to `ml_models/`.
- **Checkpoint:** Test services individually (e.g., unit tests with pytest: `pip install pytest`, create `tests/test_services.py`). Commit.

## Phase 4: Routes and API Implementation (3-4 days)
- [ ] Set up blueprints in `app/routes/` (auth.py, claims.py, reports.py, models.py).
- [ ] Implement auth routes: Login (generate JWT), register (admin only, check role).
- [ ] Implement claim routes: Upload (handle file, call services, store DB), list, get, update, delete.
  - Use `@jwt_required()` decorator.
- [ ] Implement report routes: Aggregate queries on DB (e.g., using SQLAlchemy queries for summaries).
- [ ] Implement model routes: List/get stats from DB, retrain (optional Celery task).
- [ ] In `app/__init__.py`, register blueprints:
  ```python
  from app.routes.auth import auth_bp
  app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
  # Similarly for others
  ```
- [ ] In `run.py`:
  ```python
  from app import create_app
  app = create_app()
  if __name__ == '__main__':
      app.run(debug=True)
  ```
- **Checkpoint:** Use Postman/Insomnia to test routes (e.g., register user, login, upload fake PDF). Add error handling. Commit.

## Phase 5: Testing and Security (2 days)
- [ ] Write unit/integration tests in `tests/`:
  - Test auth: Mock DB, check JWT.
  - Test claims: Mock services, check responses.
  - Test ML: Mock models, check predictions.
- [ ] Add CORS: `from flask_cors import CORS; CORS(app)`
- [ ] Secure file uploads: Validate PDF, store temporarily.
- [ ] Role-based access: Use JWT claims for roles.
- **Checkpoint:** Run `pytest` with 80%+ coverage (add `pytest-cov`). Fix bugs. Commit.

## Phase 6: ML Training and Integration (2-3 days)
- [ ] Gather data: Download Kaggle dataset (e.g., insurance fraud CSV), generate synthetic with Faker.
- [ ] Train and save models in `ml_models/`.
- [ ] Integrate into upload route: If heavy, add Celery (optional: add to requirements, set up Redis).
- **Checkpoint:** Upload a sample PDF, verify predictions in response. Commit.

## Phase 7: Documentation and Deployment (1-2 days)
- [ ] Add README.md: Setup instructions, API usage.
- [ ] Include `backend_documentation.md` from previous.
- [ ] Deploy to Heroku/Render:
  - Create app, add Postgres add-on.
  - Set env vars.
  - Push: `git remote add heroku <url>; git push heroku main`
  - Use Gunicorn: Create `Procfile` with `web: gunicorn run:app`
- **Checkpoint:** Test deployed API. Final commit.

## Final Notes
- Version control: Commit after each phase.
- Debugging: Use Flask debug mode, log errors.
- Scaling: For class project, this is sufficient; add monitoring (e.g., Sentry) if extra.
- Next: Once backend is done, we can plan frontend.

Tick off as you complete, and let me know the next step!