from flask_restful import Resource, Api, reqparse
from flask import Blueprint, request
from app.services.auth_service import require_auth, check_owner_or_admin
from app.services.data_extraction import extract_structured_data
from app.services.ml_service import predict_fraud_and_reserve
from app.models import Claim, ClaimStatus, Prediction as PredictionModel, UserRole
from app import db
import os
import logging
from werkzeug.utils import secure_filename
from werkzeug.exceptions import Unauthorized, BadRequest

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint for claim routes
claim_bp = Blueprint('claim', __name__)
api = Api(claim_bp)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


class UploadClaim(Resource):
    def options(self):
        """Handle CORS preflight for file upload."""
        return {}, 200
    
    def post(self):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        if 'file' not in request.files:
            return {'message': 'No file provided'}, 400
        
        file = request.files['file']
        if file.filename == '':
            return {'message': 'No file selected'}, 400
        
        if not allowed_file(file.filename):
            return {'message': 'Only PDF files are allowed'}, 400

        try:
            # Save file temporarily
            upload_folder = os.getenv('UPLOAD_FOLDER', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            filename = secure_filename(file.filename)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

            # Extract structured data
            extracted_data = extract_structured_data(filename)

            # Create claim with pending status
            claim = Claim(
                user_id=user.id,
                pdf_filename=filename,
                extracted_data=extracted_data,
                status=ClaimStatus.pending
            )
            db.session.add(claim)
            db.session.commit()

            # Predict fraud and reserve
            prediction = predict_fraud_and_reserve(claim.id, extracted_data)

            # Auto-update claim status based on fraud score
            fraud_score = prediction.get('fraud_score', 0)  # between 0 and 1
            if fraud_score > 0.5:
                claim.status = ClaimStatus.rejected
            else:
                claim.status = ClaimStatus.approved
            db.session.commit()

            logger.info("Claim uploaded and processed: %s", filename)
            return {
                'message': 'Claim processed successfully',
                'claim': {
                    'id': claim.id,
                    'user_id': claim.user_id,
                    'pdf_filename': claim.pdf_filename,
                    'status': claim.status.value,
                    'extracted_data': claim.extracted_data,
                    'created_at': claim.created_at.isoformat() if claim.created_at else None
                },
                'prediction': prediction
            }, 201
        except Exception as e:
            logger.error("Error processing claim: %s", str(e))
            return {'message': f"Failed to process claim: {str(e)}"}, 400


class ClaimsList(Resource):
    def get(self):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        try:
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 10))
            status = request.args.get('status')

            # Admin can view all claims, insurers only see their own
            if user.role == UserRole.admin:
                query = Claim.query
            else:
                query = Claim.query.filter_by(user_id=user.id)
            if status:
                try:
                    status_enum = ClaimStatus(status)
                    query = query.filter_by(status=status_enum)
                except ValueError:
                    pass
            
            total = query.count()
            claims = query.order_by(Claim.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
            
            claims_data = []
            for claim in claims:
                prediction = PredictionModel.query.filter_by(claim_id=claim.id).first()
                claim_dict = {
                    'id': claim.id,
                    'user_id': claim.user_id,
                    'pdf_filename': claim.pdf_filename,
                    'status': claim.status.value,
                    'created_at': claim.created_at.isoformat() if claim.created_at else None,
                    'extracted_data': claim.extracted_data
                }
                if prediction:
                    claim_dict['fraud_score'] = prediction.fraud_score
                    claim_dict['is_fraudulent'] = prediction.is_fraudulent
                    claim_dict['reserve_estimate'] = prediction.reserve_estimate
                claims_data.append(claim_dict)
            
            return {
                'claims': claims_data,
                'total': total,
                'page': page,
                'limit': limit
            }, 200
        except Exception as e:
            logger.error("Error retrieving claims: %s", str(e))
            return {'message': f"Failed to retrieve claims: {str(e)}"}, 400


class ClaimDetail(Resource):
    def get(self, claim_id: int):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        try:
            claim = Claim.query.get(claim_id)
            if not claim:
                return {'message': 'Claim not found'}, 404
            
            if claim.user_id != user.id and user.role.value != 'admin':
                return {'message': 'Unauthorized access to claim'}, 403
            
            prediction = PredictionModel.query.filter_by(claim_id=claim_id).first()
            
            result = {
                'id': claim.id,
                'user_id': claim.user_id,
                'pdf_filename': claim.pdf_filename,
                'status': claim.status.value,
                'created_at': claim.created_at.isoformat() if claim.created_at else None,
                'extracted_data': claim.extracted_data
            }
            if prediction:
                result['prediction'] = {
                    'fraud_score': prediction.fraud_score,
                    'is_fraudulent': prediction.is_fraudulent,
                    'reserve_estimate': prediction.reserve_estimate,
                    'model_version': prediction.model_version
                }
            return result, 200
        except Exception as e:
            logger.error("Error retrieving claim %d: %s", claim_id, str(e))
            return {'message': f"Failed to retrieve claim: {str(e)}"}, 400

    def patch(self, claim_id: int):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        parser = reqparse.RequestParser()
        parser.add_argument('status', type=str, required=True)
        args = parser.parse_args()

        try:
            claim = Claim.query.get(claim_id)
            if not claim:
                return {'message': 'Claim not found'}, 404
            
            if not check_owner_or_admin(user, claim):
                return {'message': 'Unauthorized access to claim'}, 403
            
            try:
                new_status = ClaimStatus(args['status'])
                claim.status = new_status
                db.session.commit()
                
                return {
                    'id': claim.id,
                    'status': claim.status.value,
                    'message': 'Claim status updated successfully'
                }, 200
            except ValueError:
                return {'message': 'Invalid status value'}, 400
        except Exception as e:
            logger.error("Error updating claim %d: %s", claim_id, str(e))
            return {'message': f"Failed to update claim: {str(e)}"}, 400

    def delete(self, claim_id: int):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        try:
            claim = Claim.query.get(claim_id)
            if not claim:
                return {'message': 'Claim not found'}, 404
            
            if not check_owner_or_admin(user, claim):
                return {'message': 'Unauthorized access to claim'}, 403
            
            PredictionModel.query.filter_by(claim_id=claim_id).delete()
            db.session.delete(claim)
            db.session.commit()
            
            return {'message': 'Claim deleted successfully'}, 200
        except Exception as e:
            logger.error("Error deleting claim %d: %s", claim_id, str(e))
            return {'message': f"Failed to delete claim: {str(e)}"}, 400


class Prediction(Resource):
    def get(self, claim_id: int):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        try:
            claim = Claim.query.get(claim_id)
            if not claim:
                return {'message': 'Claim not found'}, 404
            
            if not check_owner_or_admin(user, claim):
                return {'message': 'Unauthorized access to claim'}, 403
            
            prediction = PredictionModel.query.filter_by(claim_id=claim_id).first()
            if not prediction:
                return {'message': 'No prediction found for this claim'}, 404

            return {
                'claim_id': claim.id,
                'fraud_score': prediction.fraud_score,
                'is_fraudulent': prediction.is_fraudulent,
                'reserve_estimate': prediction.reserve_estimate,
                'model_version': prediction.model_version
            }, 200
        except Exception as e:
            logger.error("Error retrieving prediction for claim %d: %s", claim_id, str(e))
            return {'message': f"Failed to retrieve prediction: {str(e)}"}, 400


class ClaimsReport(Resource):
    def get(self):
        try:
            user = require_auth()
        except Unauthorized as e:
            return {'message': str(e)}, 401

        try:
            # Admin can view all claims, insurers only see their own
            if user.role == UserRole.admin:
                claims = Claim.query.all()
            else:
                claims = Claim.query.filter_by(user_id=user.id).all()
            total_claims = len(claims)
            claim_ids = [c.id for c in claims]
            predictions = PredictionModel.query.filter(PredictionModel.claim_id.in_(claim_ids)).all()
            
            fraudulent_count = sum(1 for p in predictions if p.is_fraudulent)
            avg_fraud_score = sum(p.fraud_score for p in predictions) / len(predictions) if predictions else 0
            avg_reserve = sum(p.reserve_estimate for p in predictions) / len(predictions) if predictions else 0
            
            status_breakdown = {}
            for claim in claims:
                status = claim.status.value
                status_breakdown[status] = status_breakdown.get(status, 0) + 1
            
            return {
                'total_claims': total_claims,
                'fraudulent_count': fraudulent_count,
                'avg_fraud_score': avg_fraud_score,
                'avg_reserve': avg_reserve,
                'status_breakdown': status_breakdown
            }, 200
        except Exception as e:
            logger.error("Error generating claims report: %s", str(e))
            return {'message': f"Failed to generate report: {str(e)}"}, 400


# Add resources to API
api.add_resource(UploadClaim, '/upload')
api.add_resource(ClaimsList, '/claims')
api.add_resource(ClaimDetail, '/claims/<int:claim_id>')
api.add_resource(Prediction, '/predictions/<int:claim_id>')
api.add_resource(ClaimsReport, '/report')
