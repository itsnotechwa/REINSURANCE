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

    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'reinsurance.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_SAMESITE'] = "Lax"

    CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:3000'])

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

    # Create tables
    with app.app_context():
        db.create_all()

    return app
