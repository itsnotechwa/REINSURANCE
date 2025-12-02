from flask_restful import Resource, Api, reqparse
from flask import Blueprint
from app.services.auth_service import create_user, authenticate, logout, get_current_user, require_admin
from app.models import User, UserRole
from app import db
from werkzeug.exceptions import BadRequest, Unauthorized
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)
api = Api(auth_bp)

class Register(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True, help="Email cannot be blank")
        parser.add_argument('first_name', type=str, required=True, help="First name cannot be blank")
        parser.add_argument('last_name', type=str, required=True, help="Last name cannot be blank")
        parser.add_argument('password', type=str, required=True, help="Password cannot be blank")
        parser.add_argument('role', type=str, required=True, help="Role cannot be blank")
        args = parser.parse_args()

        try:
            user = create_user(
                email=args['email'],
                first_name=args['first_name'],
                last_name=args['last_name'],
                password=args['password'],
                role=args['role']
            )
            logger.info("User registered: %s", args['email'])
            return {
                'message': 'User created successfully',
                "user": user.to_dict()
            }, 201
        except BadRequest as e:
            logger.error("Registration error: %s", str(e))
            return {'message': str(e)}, 400

class Login(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=True, help="Email cannot be blank")
        parser.add_argument('password', type=str, required=True, help="Password cannot be blank")
        args = parser.parse_args()

        try:
            result = authenticate(args['email'], args['password'])
            logger.info("User logged in: %s", args['email'])
            return result, 200
        except Unauthorized as e:
            logger.error("Login error: %s", str(e))
            return {'message': str(e)}, 401

class Logout(Resource):
    def post(self):
        try:
            result = logout()
            logger.info("User logged out")
            return result, 200
        except Exception as e:
            logger.error("Logout error: %s", str(e))
            return {'message': str(e)}, 400

class Profile(Resource):
    def get(self):
        try:
            user = get_current_user()
            return {'user': user.to_dict()}, 200
        except Unauthorized as e:
            return {'message': str(e)}, 401

class UsersList(Resource):
    def get(self):
        try:
            user = require_admin()
        except Unauthorized as e:
            return {'message': str(e)}, 403
        
        users = User.query.all()
        return {'users': [u.to_dict() for u in users]}, 200

class UserDetail(Resource):
    def get(self, user_id):
        try:
            admin = require_admin()
        except Unauthorized as e:
            return {'message': str(e)}, 403
        
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        return {'user': user.to_dict()}, 200

    def patch(self, user_id):
        try:
            admin = require_admin()
        except Unauthorized as e:
            return {'message': str(e)}, 403
        
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        parser = reqparse.RequestParser()
        parser.add_argument('email', type=str, required=False)
        parser.add_argument('first_name', type=str, required=False)
        parser.add_argument('last_name', type=str, required=False)
        parser.add_argument('role', type=str, required=False)
        parser.add_argument('password', type=str, required=False)
        args = parser.parse_args()

        try:
            # Update fields if provided
            if args['email'] is not None:
                # Check if email is already taken by another user
                existing_user = User.query.filter_by(email=args['email']).first()
                if existing_user and existing_user.id != user_id:
                    return {'message': 'Email already in use'}, 400
                user.email = args['email']
            
            if args['first_name'] is not None:
                user.first_name = args['first_name']
            
            if args['last_name'] is not None:
                user.last_name = args['last_name']
            
            if args['role'] is not None:
                try:
                    user.role = UserRole(args['role'])
                except ValueError:
                    return {'message': "Role must be 'admin' or 'insurer'"}, 400
            
            if args['password'] is not None and args['password']:
                from app.services.auth_service import hash_password
                user.password_hash = hash_password(args['password']).decode('utf-8')
            
            db.session.commit()
            logger.info("User updated: %s", user.email)
            return {'message': 'User updated successfully', 'user': user.to_dict()}, 200
        
        except Exception as e:
            db.session.rollback()
            logger.error("Error updating user: %s", str(e))
            return {'message': f'Failed to update user: {str(e)}'}, 400

    def delete(self, user_id):
        try:
            admin = require_admin()
        except Unauthorized as e:
            return {'message': str(e)}, 403
        
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404
        
        # Prevent deleting yourself
        if user.id == admin.id:
            return {'message': 'Cannot delete your own account'}, 400
        
        try:
            email = user.email
            db.session.delete(user)
            db.session.commit()
            logger.info("User deleted: %s", email)
            return {'message': 'User deleted successfully'}, 200
        except Exception as e:
            db.session.rollback()
            logger.error("Error deleting user: %s", str(e))
            return {'message': f'Failed to delete user: {str(e)}'}, 400

# Add resources to API
api.add_resource(Register, '/register')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')
api.add_resource(Profile, '/profile')
api.add_resource(UsersList, '/users')
api.add_resource(UserDetail, '/users/<int:user_id>')
