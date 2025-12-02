
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
from dotenv import load_dotenv
from app import create_app, db

# Load environment variables from .env file
load_dotenv()

# Alembic Config object: provides access to values in alembic.ini
config = context.config

# Set the SQLAlchemy URL from the DATABASE_URL environment variable
config.set_main_option('sqlalchemy.url', os.getenv('DATABASE_URL'))

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target_metadata to the Flask-SQLAlchemy metadata for autogenerating migrations
app = create_app()
with app.app_context():
    target_metadata = db.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Uses just the database URL without creating an Engine.
    Emits SQL commands to script output, useful when DB isn't available.
    """
    url = config.get_main_option("sqlalchemy.url")
    with app.app_context():
        context.configure(
            url=url,
            target_metadata=target_metadata,
            literal_binds=True,
            dialect_opts={"paramstyle": "named"},
        )
        with context.begin_transaction():
            context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine from Flask-SQLAlchemy and runs migrations with a live DB connection.
    """
    with app.app_context():
        connectable = db.engine
        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata
            )
            with context.begin_transaction():
                context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
