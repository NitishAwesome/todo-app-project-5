import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker

# Load .env from fastapi-backend directory if present, or current working directory
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

logger = logging.getLogger("planova.database")

# Extract environment configuration
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST", "localhost")
db_port = int(os.getenv("DB_PORT", "3306"))
db_name = os.getenv("DB_NAME", "todo_app")

# Determine whether TLS/SSL is required (TiDB Cloud uses port 4000, or DB_SSL=true)
db_ssl_env = os.getenv("DB_SSL", "").strip().lower()
use_ssl = db_ssl_env in ("true", "1", "yes") or (db_port == 4000 and db_ssl_env != "false")

connect_args = {}
if use_ssl:
    import certifi
    # Enforce verified TLS connection using certifi's Mozilla root CA bundle
    connect_args["ssl"] = {
        "ca": certifi.where(),
        "check_hostname": True,
    }

DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=db_user,
    password=db_password,
    host=db_host,
    port=db_port,
    database=db_name
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Tests connection liveness before checking out from pool
    pool_recycle=300,        # Recycles idle connections after 5m to avoid cloud load-balancer drops
    pool_size=10,            # Conservative connection pool suited for free-tier database limits
    max_overflow=20,         # Maximum overflow connections during traffic bursts
    pool_timeout=30          # Wait up to 30s before throwing timeout error
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Safe logging without exposing credentials or internal connection strings
        logger.error(f"Database session error: {type(e).__name__}")
        raise
    finally:
        db.close()
