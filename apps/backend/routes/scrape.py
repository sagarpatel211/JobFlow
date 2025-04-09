from flask import Blueprint, request, jsonify
from jobscraper.scraper import (
    start_scrape_job,
    cancel_scrape_job,
    get_scrape_status
)
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

scrape_bp = Blueprint("scrape", __name__, url_prefix="/api/scrape")

@scrape_bp.route("", methods=["POST"])
def start_scrape():
    """
    POST /api/scrape
    Start a job scraping process.
    
    Request body:
    {
        "num_jobs": 20  # Optional, number of jobs to generate
    }
    """
    try:
        data = request.json or {}
        num_jobs = int(data.get("num_jobs", 20))
        
        # Limit max jobs to prevent resource issues
        num_jobs = min(max(1, num_jobs), 100)
        
        success = start_scrape_job(num_jobs)
        
        if success:
            logger.info(f"Started scrape job for {num_jobs} jobs")
            return jsonify({
                "success": True,
                "message": f"Started scraping {num_jobs} jobs",
                "scraping": True
            })
        else:
            logger.info("Scrape job already in progress")
            return jsonify({
                "success": False,
                "message": "Scrape job already in progress",
                "scraping": True
            })
            
    except Exception as e:
        logger.error(f"Error starting scrape job: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "scraping": False
        }), 500

@scrape_bp.route("/cancel", methods=["POST"])
def cancel_scrape():
    """
    POST /api/scrape/cancel
    Cancel the current scraping job if one is in progress.
    """
    try:
        cancelled = cancel_scrape_job()
        
        if cancelled:
            logger.info("Cancelled scrape job")
            return jsonify({
                "success": True,
                "message": "Scrape job cancelled",
                "scraping": False
            })
        else:
            logger.info("No scrape job in progress to cancel")
            return jsonify({
                "success": False,
                "message": "No scrape job in progress",
                "scraping": False
            })
            
    except Exception as e:
        logger.error(f"Error cancelling scrape job: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@scrape_bp.route("/status", methods=["GET"])
def get_status():
    """
    GET /api/scrape/status
    Get the current status of the scraping job.
    """
    try:
        status = get_scrape_status()
        return jsonify({
            "success": True,
            **status
        })
            
    except Exception as e:
        logger.error(f"Error getting scrape status: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
        "scraping": False,
        "scrapeProgress": 0,
        "estimatedSeconds": 0
        }), 500
