"""
Alembic environment configuration for database migrations
"""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

from alembic import context
from config import config
from database import Base
from db_models import *  # Import all models

# this is the Alembic Config object
alembic_cfg = context.config

# Interpret the config file for Python logging
if alembic_cfg.config_file_name is not None:
    fileConfig(alembic_cfg.config_file_name)

# Get database URL from config
def get_database_url():
    """Get database URL, converting to async format"""
    db_url = config.database.url
    
    # Convert sqlite:// to sqlite+aiosqlite:// for async
    if db_url.startswith("sqlite:///"):
        db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")
    # Convert postgresql:// to postgresql+asyncpg:// for async
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    # Convert mysql:// to mysql+aiomysql:// for async
    elif db_url.startswith("mysql://"):
        db_url = db_url.replace("mysql://", "mysql+aiomysql://")
    
    return db_url

# Set the SQLAlchemy URL
alembic_cfg.set_main_option("sqlalchemy.url", get_database_url())

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = alembic_cfg.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = create_async_engine(
        alembic_cfg.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
