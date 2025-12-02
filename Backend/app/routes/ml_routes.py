from flask_restful import Resource, Api
from flask import Blueprint
from app.services.auth_service import require_admin
# from app.services.ml_service import train_fraud_model, train_reserve_model
from app.models import ModelStats, ModelType, ModelStatus
from app import db
import logging
# import pandas as pd
from werkzeug.exceptions import BadRequest, Unauthorized
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint for ML routes
ml_bp = Blueprint('ml', __name__)
api = Api(ml_bp)

# Path to CSV data
CSV_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "synthetic_claims.csv")


class TrainFraudModel(Resource):
    def post(self):
        return {"message": "ML training is currently disabled for quick startup. Please install scikit-learn and xgboost to enable training."}, 503


class TrainReserveModel(Resource):
    def post(self):
        return {"message": "ML training is currently disabled for quick startup. Please install scikit-learn and xgboost to enable training."}, 503


class ModelStatsResource(Resource):
    def get(self):
        try:
            user = require_admin()
        except Unauthorized as e:
            return {"message": str(e)}, 403

        try:
            # Return a mock response since the models are not trained
            return [{
                "id": 0,
                "model_name": "rule-based-fraud",
                "model_type": "fraud",
                "metrics": {"status": "active", "version": "1.0"},
                "status": "active",
                "trained_at": "2025-11-27T00:00:00"
            },
            {
                "id": 1,
                "model_name": "rule-based-reserve",
                "model_type": "reserve",
                "metrics": {"status": "active", "version": "1.0"},
                "status": "active",
                "trained_at": "2025-11-27T00:00:00"
            }], 200
        except Exception as e:
            logger.error("Error retrieving model stats: %s", str(e))
            return {"message": f"Failed to retrieve model stats: {str(e)}"}, 400


# Add resources to API
api.add_resource(TrainFraudModel, "/train-fraud")
api.add_resource(TrainReserveModel, "/train-reserve")
api.add_resource(ModelStatsResource, "/model-stats")


