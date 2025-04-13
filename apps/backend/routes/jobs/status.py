from flask import request, jsonify
from database.session import SessionLocal
from services.job_service import (
    update_job_status,
    serialize_job
)
from services.query_service import get_status_counts
import logging

from routes.jobs.base import jobs_bp

logger = logging.getLogger(__name__)

@jobs_bp.route("/<int:job_id>/status-arrow", methods=["PUT"])
def update_job_status_arrow(job_id):
    """
    PUT /api/jobs/<job_id>/status-arrow
    Update a job's application status by moving it one step in the given direction.
    
    Request body:
    {
        "direction": 1  # 1 for forward, -1 for backward
    }
    """
    data = request.json
    direction = data.get("direction", 0)
    
    if direction not in [-1, 1]:
        return jsonify({"error": "Direction must be 1 or -1", "success": False}), 400
    
    session = SessionLocal()
    try:
        job = update_job_status(session, job_id, direction)
        
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
        
        # Serialize job data before closing the session
        job_data = serialize_job(job)
        session.close()
        
        logger.info(f"Updated status for job {job_id} to {job_data['status']}")
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error updating status arrow for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/stats", methods=["GET"])
def get_job_stats():
    """
    GET /api/jobs/stats
    Get job statistics (counts by status, etc.).
    """
    session = SessionLocal()
    try:
        # Get status counts - exclude archived jobs from the charts
        status_counts = get_status_counts(session, include_archived=False)
        
        # Get role type counts
        role_type_counts = {}
        role_types = session.query(
            Job.role_type,
            func.count(Job.id)
        ).filter(
            Job.deleted == False
        ).group_by(
            Job.role_type
        ).all()
        
        for role_type, count in role_types:
            role_type_counts[role_type.value] = count
            
        # Total jobs
        total_jobs = session.query(func.count(Job.id)).filter(Job.deleted == False).scalar()
        
        # Priority jobs
        priority_jobs = session.query(func.count(Job.id)).filter(
            and_(Job.deleted == False, Job.priority == True)
        ).scalar()
        
        # Archived jobs
        archived_jobs = session.query(func.count(Job.id)).filter(
            and_(Job.deleted == False, Job.archived == True)
        ).scalar()
        
        # Recent jobs (posted within last week)
        one_week_ago = datetime.now() - timedelta(days=7)
        recent_jobs = session.query(func.count(Job.id)).filter(
            and_(Job.deleted == False, Job.posted_date >= one_week_ago)
        ).scalar()
        
        stats = {
            "status_counts": status_counts,
            "role_type_counts": role_type_counts,
            "total_jobs": total_jobs,
            "priority_jobs": priority_jobs,
            "archived_jobs": archived_jobs,
            "recent_jobs": recent_jobs
        }
        
        session.close()
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        logger.error(f"Error getting job stats: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

# Add imports needed by get_job_stats
from datetime import datetime, timedelta
from sqlalchemy import and_, func
from database.models import Job 