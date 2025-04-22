# app/__init__.py
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from .config import DevelopmentConfig  # Use ProductionConfig in production
from .config import db, migrate, init_cache, init_es

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS for all API endpoints
    CORS(app,
         resources={r"/api/.*": {"origins": "*"}},
         supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    app.extensions["redis"] = init_cache(app)
    # Initialize Elasticsearch client and attempt to set up index
    es = init_es(app)
    app.extensions["es"] = es
    try:
        # Only create the 'jobs' index if it doesn't already exist
        if not es.indices.exists(index="jobs"):
            es.indices.create(index="jobs", body={
                "mappings": {
                    "properties": {
                        "title": {"type": "text"},
                        "company": {"type": "text"},
                        "tags": {"type": "keyword"},
                        "notes": {"type": "text"}
                    }
                }
            })
    except Exception as e:
        # ES might not be available yet (e.g. container startup); log and continue
        app.logger.warning(f"Skipping Elasticsearch index setup: {e}")

    # Register blueprints
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
    
    # Register new applications blueprint
    from .routes.applications import applications_bp
    app.register_blueprint(applications_bp, url_prefix="/api/applications")

    return app
