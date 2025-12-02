from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Enum, Float, JSON, ForeignKey, DateTime, Boolean
from datetime import datetime
import enum
from app import db


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


class User(db.Model):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Return a safe, serializable dict representation."""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.value if self.role else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Claim(db.Model):
    __tablename__ = 'claim'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    pdf_filename = Column(String, nullable=False)
    extracted_data = Column(JSON, nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Prediction(db.Model):
    __tablename__ = 'prediction'

    claim_id = Column(Integer, ForeignKey('claim.id'), primary_key=True)
    fraud_score = Column(Float, nullable=False)
    is_fraudulent = Column(Boolean, nullable=False)
    reserve_estimate = Column(Float, nullable=False)
    model_version = Column(String, nullable=False)


class ModelStats(db.Model):
    __tablename__ = 'model_stats'

    id = Column(Integer, primary_key=True)
    model_name = Column(String, nullable=False)
    model_type = Column(Enum(ModelType), nullable=False)
    metrics = Column(JSON, nullable=False)
    status = Column(Enum(ModelStatus), default=ModelStatus.active, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)
