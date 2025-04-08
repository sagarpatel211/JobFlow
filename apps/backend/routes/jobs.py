from flask import Blueprint, request, jsonify
from database.session import SessionLocal
from database.models import Job
from routes.job_helpers import (
    serialize_job,
    create_or_get_company,
    apply_job_data_to_model,
    index_job_to_es,
    remove_job_from_es,
    get_job_by_id,
)

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

@jobs_bp.route("", methods=["POST"])
def create_job():
    """
    POST /api/jobs
    Create a new job.
    """
    data = request.json.get("job", {})
    session = SessionLocal()
    try:
        # Create new Job object
        new_job = Job()
        # Apply data fields
        apply_job_data_to_model(new_job, data, session)
        session.add(new_job)
        session.commit()

        # Eager load tags (forces the relationship so tags are accessible)
        _ = list(new_job.tags)

        # Index to ES
        index_job_to_es(new_job, session)
        session.close()

        return jsonify({"success": True, "job": serialize_job(new_job)})
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    """
    PUT /api/jobs/<job_id>
    Update an existing job (company, title, role, status, etc.).
    """
    data = request.json.get("job", {})
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Not found"}), 404

        apply_job_data_to_model(job, data, session)
        session.commit()

        # Eager load tags
        _ = list(job.tags)
        # Re-index in ES
        index_job_to_es(job, session)
        session.close()

        return jsonify({"success": True, "job": serialize_job(job)})
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>/delete", methods=["PUT"])
def delete_job(job_id):
    """
    PUT /api/jobs/<job_id>/delete
    Mark the job as deleted, remove from ES.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Not found"}), 404

        job.deleted = True
        session.commit()

        remove_job_from_es(job)
        session.close()
        return jsonify({"success": True})
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>/archive", methods=["PUT"])
def archive_job(job_id):
    """
    PUT /api/jobs/<job_id>/archive
    Mark the job as archived (but not deleted).
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Not found"}), 404

        job.archived = True
        session.commit()

        # update index
        index_job_to_es(job, session)
        session.close()
        return jsonify({"success": True})
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>/priority", methods=["PUT"])
def priority_job(job_id):
    """
    PUT /api/jobs/<job_id>/priority
    Toggle or set a job's priority to True.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Not found"}), 404

        job.priority = True
        session.commit()

        # update index
        index_job_to_es(job, session)
        session.close()
        return jsonify({"success": True})
    except Exception as e:
        session.rollback()
        session.close()
        return jsonify({"error": str(e)}), 500
