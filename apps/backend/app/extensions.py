# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from redis import Redis
from elasticsearch import Elasticsearch

db = SQLAlchemy()
migrate = Migrate()

def init_cache(app):
    return Redis.from_url(app.config["REDIS_URL"])

def init_es(app):
    return Elasticsearch([app.config["ELASTICSEARCH_URL"]])
