from flask import request, jsonify
from database.session import SessionLocal
from services.job_service import (
    toggle_job_priority,
    toggle_job_archive,
    soft_delete_job,
    serialize_job
)
import logging

from routes.jobs.base import jobs_bp

logger = logging.getLogger(__name__)

@jobs_bp.route("/<int:job_id>/priority", methods=["PUT"])
def priority_job(job_id):
    """
    PUT /api/jobs/<job_id>/priority
    Toggle a job's priority status.
    """
    session = SessionLocal()
    try:
        job = toggle_job_priority(session, job_id)
        
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Store the priority value for the response
        priority_value = job.priority
        session.close()
        
        logger.info(f"Successfully toggled priority for job {job_id} to {priority_value}")
        return jsonify({"success": True, "priority": priority_value})
    except Exception as e:
        logger.error(f"Error toggling priority for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/archive", methods=["PUT"])
def archive_job(job_id):
    """
    PUT /api/jobs/<job_id>/archive
    Toggle a job's archived status.
    """
    session = SessionLocal()
    try:
        job = toggle_job_archive(session, job_id)
        
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Store the archived value for the response
        archived_value = job.archived
        session.close()
        
        logger.info(f"Successfully toggled archive for job {job_id} to {archived_value}")
        return jsonify({"success": True, "archived": archived_value})
    except Exception as e:
        logger.error(f"Error toggling archive for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/soft-delete", methods=["PUT"])
def soft_delete_job_route(job_id):
    """
    PUT /api/jobs/<job_id>/soft-delete
    Soft delete a job by setting its deleted flag to True.
    """
    session = SessionLocal()
    try:
        job = soft_delete_job(session, job_id)
        
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        session.close()
        
        logger.info(f"Successfully soft-deleted job {job_id}")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error soft-deleting job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500 