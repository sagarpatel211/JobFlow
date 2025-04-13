from flask import Blueprint, request, jsonify
from database.session import SessionLocal
from database.models import Tag, Folder
from logger_config import get_logger

logger = get_logger(__name__)
# Use the existing jobs_bp from base.py
from routes.jobs.base import jobs_bp

@jobs_bp.route("/tags", methods=["GET"])
def get_tags():
    """
    GET /api/jobs/tags
    Get all available tags.
    """
    session = SessionLocal()
    try:
        tags = session.query(Tag).all()
        logger.debug(f"Retrieved {len(tags)} tags from database")
        return jsonify({
            "success": True,
            "tags": [{"id": tag.id, "name": tag.name} for tag in tags]
        })
    except Exception as e:
        logger.error(f"Error getting tags: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close()

@jobs_bp.route("/folders", methods=["GET"])
def get_folders():
    """
    GET /api/jobs/folders
    Get all available folders.
    """
    session = SessionLocal()
    try:
        folders = session.query(Folder).all()
        logger.debug(f"Retrieved {len(folders)} folders from database")
        return jsonify({
            "success": True,
            "folders": [{"id": folder.id, "name": folder.name, "color": folder.color} for folder in folders]
        })
    except Exception as e:
        logger.error(f"Error getting folders: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close() 