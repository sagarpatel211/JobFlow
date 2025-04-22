from flask import Flask
from ..config import DevelopmentConfig, ProductionConfig
from ..config import db, migrate
from flask_cors import CORS

def create_app(config_class=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    from .jobs import jobs_bp
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    from .scraper import scraper_bp
    app.register_blueprint(scraper_bp, url_prefix="/api/scrape")
    
    return app
