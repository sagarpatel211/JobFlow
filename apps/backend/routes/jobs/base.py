from flask import Blueprint, request, jsonify
from database.session import SessionLocal
from database.models import Job
from sqlalchemy import func
from routes.helpers import parse_boolean_param, parse_int_param
from services.job_service import (
    get_job_by_id, 
    apply_job_data_to_model, 
    serialize_job, 
    create_or_get_company
)
from services.query_service import (
    build_job_query,
    sort_job_query
)
from services.elasticsearch_service import (
    index_job_to_es,
    remove_job_from_es
)
import logging

logger = logging.getLogger(__name__)

# Create blueprint
jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

@jobs_bp.route("", methods=["GET"])
def get_jobs():
    """Get all jobs or search for jobs."""
    session = SessionLocal()
    try:
        # Parse query parameters
        show_archived = parse_boolean_param(request.args.get("show_archived", ""), False)
        show_priority = parse_boolean_param(request.args.get("show_priority", ""), False)
        filter_not_applied = parse_boolean_param(request.args.get("filter_not_applied", ""), False)
        filter_within_week = parse_boolean_param(request.args.get("filter_within_week", ""), False)
        filter_intern = parse_boolean_param(request.args.get("filter_intern", ""), False)
        filter_newgrad = parse_boolean_param(request.args.get("filter_newgrad", ""), False)
        search_query = request.args.get("query", None)
        page = parse_int_param(request.args.get("page", 1), 1, min_value=1)
        per_page = parse_int_param(request.args.get("per_page", 4), 4, min_value=1)
        sort_by = request.args.get("sort_by", "date")
        sort_order = request.args.get("sort_order", "desc")
        
        # Build base query with proper filters
        query = build_job_query(
            session=session,
            show_archived=show_archived,
            show_priority=show_priority,
            filter_not_applied=filter_not_applied,
            filter_within_week=filter_within_week,
            filter_intern=filter_intern,
            filter_newgrad=filter_newgrad,
            search_query=search_query
        )
        
        # Count total results (use more efficient COUNT() instead of fetch all rows)
        # Use a subquery to improve COUNT performance
        count_query = query.with_entities(func.count(Job.id))
        total_count = count_query.scalar()
        
        # Apply sorting
        query = sort_job_query(query, sort_by, sort_order)
        
        # Apply pagination efficiently
        total_pages = (total_count + per_page - 1) // per_page
        query = query.offset((page - 1) * per_page).limit(per_page)
        
        # Execute query and serialize results
        jobs = query.all()
        serialized_jobs = [serialize_job(job) for job in jobs]
        
        # Return response
        response = {
            "success": True,
            "jobs": serialized_jobs,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_count": total_count,
                "total_pages": total_pages
            }
        }
        
        session.close()
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error getting jobs: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("", methods=["POST"])
def create_job():
    """Create a new job."""
    data = request.json
    job_data = data.get("job", {})
    
    session = SessionLocal()
    try:
        # Create job and apply data
        job = Job()
        apply_job_data_to_model(job, job_data, session)
        
        # Add to session and commit
        session.add(job)
        session.commit()
        
        # Index to Elasticsearch
        index_job_to_es(job, session)
        
        # Serialize job data before closing the session
        job_data = serialize_job(job)
        session.close()
        
        logger.info(f"Successfully created job {job.id}")
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>", methods=["GET"])
def get_job(job_id):
    """Get a job by ID."""
    session = SessionLocal()
    try:
        # Get job
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
        
        # Serialize job data before closing the session
        job_data = serialize_job(job)
        session.close()
        
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    """Update an existing job."""
    data = request.json
    job_data = data.get("job", {})
    
    session = SessionLocal()
    try:
        # Get job
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
        
        # Apply updates
        apply_job_data_to_model(job, job_data, session)
        
        # Commit changes
        session.commit()
        
        # Update Elasticsearch index
        index_job_to_es(job, session)
        
        # Serialize job data before closing the session
        job_data = serialize_job(job)
        session.close()
        
        logger.info(f"Successfully updated job {job_id}")
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error updating job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>", methods=["DELETE"])
def delete_job(job_id):
    """Hard delete a job."""
    session = SessionLocal()
    try:
        # Get job
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
        
        # Remove from Elasticsearch
        remove_job_from_es(job)
        
        # Delete from database
        session.delete(job)
        session.commit()
        
        session.close()
        
        logger.info(f"Successfully deleted job {job_id}")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

# Import other route modules at the end to avoid circular imports
from routes.jobs import status, actions, bulk_actions 

# We don't need to import from jobs_ext - it imports from us
# The routes are already registered by the decorator in jobs_ext.py 