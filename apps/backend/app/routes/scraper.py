# app/routes/scraper.py
from flask import Blueprint, jsonify, request
from ..scraper.manager import scrape_manager

scraper_bp = Blueprint("scraper", __name__)

@scraper_bp.route("", methods=["POST"])
def start_scrape():
    """Start the scraping process."""
    success = scrape_manager.start()
    return jsonify({"success": success})

@scraper_bp.route("/cancel", methods=["POST"])
def cancel_scrape():
    """Cancel an ongoing scraping process."""
    success = scrape_manager.cancel()
    return jsonify({"success": success})

@scraper_bp.route("/status", methods=["GET"])
def scrape_status():
    """Get current scrape status."""
    status = scrape_manager.get_status()
    return jsonify(status)
