# app/__init__.py
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from .config import DevelopmentConfig  # Use ProductionConfig in production
from .extensions import db, migrate, init_cache, init_es

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Enable CORS with explicit methods
    CORS(app, 
         resources={r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
         }},
         supports_credentials=True)
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    app.extensions["redis"] = init_cache(app)
    app.extensions["es"] = init_es(app)

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
