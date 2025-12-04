from flask import session
from app import db
from app.models import User, UserRole
import bcrypt
from werkzeug.exceptions import BadRequest, Unauthorized


def hash_password(password: str) -> bytes:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


def verify_password(password: str, password_hash: bytes) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash)


def create_user(email: str, first_name: str, last_name: str, password: str, role: str) -> User:
    """Create a new user with hashed password."""
    if User.query.filter_by(email=email).first():
        raise BadRequest(f"User with email {email} already exists")

    try:
        role_enum = UserRole(role)
    except ValueError:
        raise BadRequest("Role must be 'admin' or 'insurer'")

    hashed_password = hash_password(password)

    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        password_hash=hashed_password.decode('utf-8'),
        role=role_enum
    )
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> dict:
    """Authenticate a user and create a session."""
    user = User.query.filter_by(email=email).first()
    if not user:
        raise Unauthorized("Invalid email or password")

    if not verify_password(password, user.password_hash.encode('utf-8')):
        raise Unauthorized("Invalid email or password")

    # Create session
    session['user_id'] = user.id
    session['email'] = user.email
    session['role'] = user.role.value
    session.permanent = True  # Use permanent session
    session.modified = True  # Mark session as modified to ensure it's saved

    return {
        'message': 'Login successful',
        'user': user.to_dict()
    }


def logout():
    """Clear the session."""
    session.clear()
    return {'message': 'Logout successful'}


def get_current_user():
    """Get the current user from session."""
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug: log session contents
    logger.debug(f"Session contents: {dict(session)}")
    logger.debug(f"Session has user_id: {'user_id' in session}")
    
    user_id = session.get('user_id')
    if not user_id:
        logger.warning("No user_id in session - user not authenticated")
        raise Unauthorized("Not authenticated")
    
    user = User.query.get(user_id)
    if not user:
        logger.warning(f"User with id {user_id} not found in database")
        raise Unauthorized("User not found")
    
    return user


def require_auth():
    """Decorator helper to check authentication."""
    return get_current_user()


def require_admin():
    """Check if current user is admin."""
    user = get_current_user()
    if user.role != UserRole.admin:
        raise Unauthorized("Admin access required")
    return user


def check_owner_or_admin(user, claim):
    """Helper function to check if user owns claim or is admin."""
    return user.role == UserRole.admin or claim.user_id == user.id