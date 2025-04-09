from flask import Blueprint

def register_blueprints(app):
    from .tracker import tracker_bp
    from .jobs import jobs_bp
    from .scrape import scrape_bp
    app.register_blueprint(tracker_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(scrape_bp)
