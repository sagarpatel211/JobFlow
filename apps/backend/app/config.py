import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from redis import Redis
from elasticsearch import Elasticsearch
from datetime import timedelta


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/app_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
    ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER", "minioaccesskey")
    MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD", "miniosecretkey")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


db = SQLAlchemy()
migrate = Migrate()


def init_cache(app):
    return Redis.from_url(app.config["REDIS_URL"])


def init_es(app):
    return Elasticsearch([app.config["ELASTICSEARCH_URL"]])
