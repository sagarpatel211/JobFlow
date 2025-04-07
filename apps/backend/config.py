import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./jobs.db")
ELASTICSEARCH_URL = os.environ.get("ELASTICSEARCH_URL", "http://elasticsearch:9200")
SECRET_KEY = "CHANGE_THIS"
