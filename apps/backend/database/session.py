import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

max_retries = 5
for i in range(max_retries):
    try:
        engine = create_engine(DATABASE_URL)
        connection = engine.raw_connection()
        connection.close()
        break
    except Exception as e:
        print(f"Database connection failed, retrying ({i+1}/{max_retries})...")
        time.sleep(5)
else:
    raise Exception("Could not connect to the database after several retries")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
