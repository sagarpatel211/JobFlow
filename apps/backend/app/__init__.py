from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import DevelopmentConfig, db, migrate, init_cache, init_es

# Instantiate the JWTManager
jwt = JWTManager()


def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(
        app,
        resources={r"/api/.*": {"origins": "http://localhost:3000"}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    db.init_app(app)
    migrate.init_app(app, db, directory="migrations")
    app.extensions["redis"] = init_cache(app)
    es = init_es(app)
    app.extensions["es"] = es
    try:
        if not es.indices.exists(index="jobs"):
            es.indices.create(
                index="jobs",
                body={
                    "mappings": {
                        "properties": {
                            "title": {"type": "text"},
                            "company": {"type": "text"},
                            "tags": {"type": "keyword"},
                            "notes": {"type": "text"},
                        }
                    }
                },
            )
    except Exception as e:
        app.logger.warning(f"Skipping Elasticsearch index setup: {e}")

    # Initialize JWTManager with the Flask app
    jwt.init_app(app)

    from .routes.jobs import jobs_bp

    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    from .routes.companies import companies_bp

    app.register_blueprint(companies_bp, url_prefix="/api/companies")

    from .routes.tracker import tracker_bp

    app.register_blueprint(tracker_bp, url_prefix="/api/tracker")

    from .routes.health import health_bp

    app.register_blueprint(health_bp, url_prefix="/api/health")

    from .routes.scraper import scraper_bp

    app.register_blueprint(scraper_bp, url_prefix="/api/scrape")

    from .routes.applications import applications_bp

    app.register_blueprint(applications_bp, url_prefix="/api/applications")

    from .routes.auth import auth_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Register billing (Stripe) endpoints
    from .routes.billing import billing_bp

    app.register_blueprint(billing_bp, url_prefix="/api/billing")

    # Register daily stats endpoints
    from .routes.stats import stats_bp

    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    return app
