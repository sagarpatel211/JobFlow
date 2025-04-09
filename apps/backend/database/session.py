import time
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from config import DATABASE_URL

logger = logging.getLogger(__name__)
max_retries = 5
engine = None

# Configure connection pooling parameters
pool_size = 10  # Adjust based on expected concurrent connections
max_overflow = 20  # Allow up to this many connections beyond pool_size
pool_timeout = 30  # Seconds to wait for a connection from the pool
pool_recycle = 1800  # Recycle connections after 30 minutes

for i in range(max_retries):
    try:
        # Create engine with connection pooling
        engine = create_engine(
            DATABASE_URL,
            poolclass=QueuePool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_timeout=pool_timeout,
            pool_recycle=pool_recycle,
            pool_pre_ping=True
        )
        connection = engine.raw_connection()
        connection.close()

        logger.info(f"DB connection established with pool_size={pool_size}, max_overflow={max_overflow}")
        break
    except Exception as e:
        logger.warning(f"Database connection failed, retrying ({i+1}/{max_retries}): {str(e)}")
        time.sleep(5)
else:
    ERROR_MSG = "Could not connect to the database after several retries"
    logger.error(ERROR_MSG)
    raise Exception(ERROR_MSG)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
