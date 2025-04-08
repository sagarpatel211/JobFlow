import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://jobflowuser:jobflowpass@localhost:5432/jobflow")
ELASTICSEARCH_URL = os.environ.get("ELASTICSEARCH_URL", "http://elasticsearch:9200")
SECRET_KEY = os.environ.get("SECRET_KEY", "your_secret_key")
