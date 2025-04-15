# app/routes/scraper.py
from flask import Blueprint, jsonify, request

scraper_bp = Blueprint("scraper", __name__)

@scraper_bp.route("", methods=["POST"])
def start_scrape():
    print("Starting job scrape (dummy)...")
    return jsonify({"success": True})

@scraper_bp.route("/cancel", methods=["POST"])
def cancel_scrape():
    print("Cancelling job scrape (dummy)...")
    return jsonify({"success": True})

@scraper_bp.route("/status", methods=["GET"])
def scrape_status():
    import random
    return jsonify({
        "scraping": random.choice([True, False]),
        "scrapeProgress": random.randint(0, 100),
        "estimatedSeconds": random.randint(10, 60)
    })
