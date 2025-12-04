# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Database configuration - use MySQL on Railway, SQLite locally
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Railway provides DATABASE_URL for MySQL
        # Handle different database URL formats
        if database_url.startswith("mysql://"):
            # Convert mysql:// to mysql+pymysql:// for SQLAlchemy with PyMySQL driver
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        elif database_url.startswith("postgres://"):
            # Support PostgreSQL if needed (convert postgres:// to postgresql://)
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Local development - use SQLite
        basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'reinsurance.db')}"
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_PATH'] = '/'
    # For cross-origin requests (Vercel to Railway), need SameSite=None and Secure=True
    # Check if we're in production (HTTPS) and have a frontend URL (cross-origin)
    is_production = os.getenv("FLASK_ENV") == "production"
    has_frontend_url = os.getenv("FRONTEND_URL") and os.getenv("FRONTEND_URL") != "http://localhost:5173"
    
    if is_production and has_frontend_url:
        # Cross-origin production: SameSite=None requires Secure=True
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = "None"
        # Don't set domain - let browser handle it for cross-origin
        app.config['SESSION_COOKIE_DOMAIN'] = None
    else:
        # Local development: SameSite=Lax is fine
        app.config['SESSION_COOKIE_SECURE'] = False
        app.config['SESSION_COOKIE_SAMESITE'] = "Lax"
        app.config['SESSION_COOKIE_DOMAIN'] = None

    # CORS configuration - allow frontend origin from environment variable
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    allowed_origins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://localhost:5173',
    ]
    
    # Add frontend URL from environment (Vercel deployment)
    if frontend_url:
        # Ensure URL has protocol
        if not frontend_url.startswith('http'):
            frontend_url = f"https://{frontend_url}"
        allowed_origins.append(frontend_url)
    
    # Add Vercel preview URLs if provided
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        vercel_full_url = f"https://{vercel_url}" if not vercel_url.startswith('http') else vercel_url
        allowed_origins.append(vercel_full_url)
    
    # Configure CORS - explicitly allow OPTIONS for preflight requests
    CORS(
        app, 
        supports_credentials=True, 
        origins=allowed_origins,
        methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
        expose_headers=['Content-Type']
    )

    db.init_app(app)

    # Import models
    from app.models import User, Claim, Prediction, ModelStats

    # Import blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.claim_routes import claim_bp
    from app.routes.ml_routes import ml_bp
    from app.routes.pdf_routes import pdf_bp

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(claim_bp, url_prefix='/claim')
    app.register_blueprint(ml_bp, url_prefix='/ml')
    app.register_blueprint(pdf_bp, url_prefix='/convert')  # <-- register PDF blueprint

    # Health check route for Railway/deployment monitoring
    @app.route('/')
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy',
            'service': 'Reinsurance Claims Management API',
            'version': '1.0.0'
        }, 200

    # Create tables
    with app.app_context():
        db.create_all()

    return app
