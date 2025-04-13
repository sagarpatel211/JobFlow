from flask import Blueprint, request, jsonify, abort, send_file
from database.session import SessionLocal
from database.models import Job, RoleType, Status, Tag, Company, JobAttachment, Folder
from sqlalchemy.orm import joinedload
from routes.job_helpers import (
    serialize_job,
    create_or_get_company,
    create_or_get_tag,
    apply_job_data_to_model,
    index_job_to_es,
    remove_job_from_es,
    get_job_by_id,
    build_job_query,
    sort_job_query,
    get_status_counts,
    handle_attachment_upload
)
from routes.common import db_session
import logging
import os
from typing import Dict, List, Any, Optional, Tuple
from werkzeug.utils import secure_filename
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import socket

logger = logging.getLogger(__name__)
jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

@jobs_bp.route("", methods=["GET"])
def get_jobs():
    """Get all jobs or search for jobs."""
    session = SessionLocal()
    try:
        # Parse query parameters
        show_archived = request.args.get("show_archived", "").lower() == "true"
        show_priority = request.args.get("show_priority", "").lower() == "true"
        filter_not_applied = request.args.get("filter_not_applied", "").lower() == "true"
        filter_within_week = request.args.get("filter_within_week", "").lower() == "true"
        filter_intern = request.args.get("filter_intern", "").lower() == "true"
        filter_newgrad = request.args.get("filter_newgrad", "").lower() == "true"
        search_query = request.args.get("query", None)
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 4))  # Configurable page size
        sort_by = request.args.get("sort_by", "id")
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
        
        # Eager load relationships to avoid N+1 query problem
        query = query.options(
            joinedload(Job.company),
            joinedload(Job.tags)
        )
        
        jobs = query.all()
        
        # Serialize jobs
        jobs_data = [serialize_job(job) for job in jobs]
        
        return jsonify({
            "success": True, 
            "jobs": jobs_data,
            "pagination": {
                "total": total_count,
                "page": page,
                "pages": total_pages,
                "per_page": per_page
            }
        })
    except Exception as e:
        logger.exception(f"Error getting jobs: {e}")
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close()

@jobs_bp.route("", methods=["POST"])
def create_job():
    """
    POST /api/jobs
    Create a new job.
    """
    data = request.json.get("job", {})
    logger.info(f"Creating new job with data: {data}")
    
    try:
        with db_session() as session:
            # Create new Job object
            new_job = Job()
            
            # Set default values if missing
            if "role_type" not in data or not data["role_type"]:
                data["role_type"] = RoleType.newgrad.value
                
            # Apply data fields
            apply_job_data_to_model(new_job, data, session)
            session.add(new_job)
            session.flush()  # Flush to get the ID but don't commit yet

            # Index to ES
            index_job_to_es(new_job, session)
            
            # Prepare response with serialized job data
            job_data = serialize_job(new_job)
            
            logger.info(f"Successfully created job with ID: {new_job.id}")
            return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>", methods=["GET"])
def get_job(job_id):
    """
    GET /api/jobs/<job_id>
    Get a single job by ID.
    """
    session = SessionLocal()
    try:
        job = session.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.tags),
            joinedload(Job.attachments)
        ).filter(
            and_(Job.id == job_id, Job.deleted == False)
        ).first()
        
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
            
        job_data = serialize_job(job)
        session.close()
        
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    """
    PUT /api/jobs/<job_id>
    Update an existing job (company, title, role, status, etc.).
    """
    data = request.json.get("job", {})
    logger.info(f"Updating job {job_id} with data: {data}")
    
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        apply_job_data_to_model(job, data, session)
        session.commit()

        # Refresh the job to get updated relationships
        session.refresh(job)
        
        # Re-index in ES
        index_job_to_es(job, session)
        
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
    """
    DELETE /api/jobs/<job_id>
    Permanently delete a job.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Delete from ES first
        remove_job_from_es(job)
        
        # Delete the job
        session.delete(job)
        session.commit()
        
        logger.info(f"Successfully deleted job {job_id}")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/soft-delete", methods=["PUT"])
def soft_delete_job(job_id):
    """
    PUT /api/jobs/<job_id>/soft-delete
    Mark the job as deleted, remove from ES.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        job.deleted = True
        session.commit()

        remove_job_from_es(job)
        session.close()
        
        logger.info(f"Successfully marked job {job_id} as deleted")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error soft deleting job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/archive", methods=["PUT"])
def archive_job(job_id):
    """
    PUT /api/jobs/<job_id>/archive
    Toggle a job's archive status.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Toggle archived status
        job.archived = not job.archived
        
        # Store the new archive value before committing and closing the session
        new_archived_value = job.archived
        
        session.commit()
        
        # update index
        index_job_to_es(job, session)
        session.close()
        
        logger.info(f"Successfully toggled archive for job {job_id} to {new_archived_value}")
        return jsonify({"success": True, "archived": new_archived_value})
    except Exception as e:
        logger.error(f"Error toggling archive for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/priority", methods=["PUT"])
def priority_job(job_id):
    """
    PUT /api/jobs/<job_id>/priority
    Toggle a job's priority status.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Toggle priority
        job.priority = not job.priority
        
        # Store the new priority value before committing
        new_priority_value = job.priority
        
        # Must refresh job before committing to ensure it's bound to the session
        session.flush()
        session.refresh(job)
        session.commit()

        # update index - use the job object from session after commit
        index_job_to_es(job, session)
        
        # Close the session after all operations are complete
        session.close()
        
        logger.info(f"Successfully toggled priority for job {job_id} to {new_priority_value}")
        return jsonify({"success": True, "priority": new_priority_value})
    except Exception as e:
        logger.error(f"Error toggling priority for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/status", methods=["PUT"])
def update_job_status(job_id):
    """
    PUT /api/jobs/<job_id>/status
    Update a job's application status.
    """
    data = request.json
    new_status = data.get("status")
    
    if not new_status:
        return jsonify({"error": "Status value is required", "success": False}), 400
    
    try:
        status = Status(new_status)
    except ValueError:
        return jsonify({"error": f"Invalid status value: {new_status}", "success": False}), 400
    
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Update status
        job.status = status
        session.commit()

        # update index
        index_job_to_es(job, session)
        
        job_data = serialize_job(job)
        session.close()
        
        logger.info(f"Successfully updated status for job {job_id} to {status.value}")
        return jsonify({"success": True, "job": job_data})
    except Exception as e:
        logger.error(f"Error updating status for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

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
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Get all statuses
        statuses = list(Status)
        current_status_index = statuses.index(job.status)
        
        # Calculate new status index, ensuring it stays within bounds
        new_status_index = max(0, min(len(statuses) - 1, current_status_index + direction))
        
        # Only update if the status actually changed
        if new_status_index != current_status_index:
            job.status = statuses[new_status_index]
            session.commit()

            # update index
            index_job_to_es(job, session)
        
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

@jobs_bp.route("/<int:job_id>/attachments", methods=["POST"])
def add_attachment(job_id):
    """
    POST /api/jobs/<job_id>/attachments
    Add an attachment (resume, cover letter) to a job.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part", "success": False}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file", "success": False}), 400
        
    attachment_type = request.form.get('type', 'other')
    if attachment_type not in ['resume', 'cover_letter', 'other']:
        return jsonify({"error": "Invalid attachment type", "success": False}), 400
    
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Handle file upload
        attachment = handle_attachment_upload(file, job_id, attachment_type)
        if not attachment:
            session.close()
            return jsonify({"error": "Failed to upload file", "success": False}), 500
            
        # Add attachment to job
        job.attachments.append(attachment)
        session.commit()
        
        # Return the attachment info
        attachment_data = {
            "id": attachment.id,
            "filename": attachment.filename,
            "attachment_type": attachment.attachment_type,
            "created_at": attachment.created_at.isoformat() if attachment.created_at else None
        }
        
        session.close()
        logger.info(f"Successfully added attachment to job {job_id}")
        return jsonify({"success": True, "attachment": attachment_data})
    except Exception as e:
        logger.error(f"Error adding attachment to job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/attachments/<int:attachment_id>", methods=["GET"])
def get_attachment(job_id, attachment_id):
    """
    GET /api/jobs/<job_id>/attachments/<attachment_id>
    Get an attachment file.
    """
    session = SessionLocal()
    try:
        # Check if job exists and user has access
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
            
        # Find the attachment
        attachment = session.query(JobAttachment).filter(
            JobAttachment.id == attachment_id,
            JobAttachment.job_id == job_id
        ).first()
        
        if not attachment:
            session.close()
            return jsonify({"error": "Attachment not found", "success": False}), 404
            
        # Check if file exists
        if not os.path.exists(attachment.file_path):
            session.close()
            return jsonify({"error": "Attachment file not found", "success": False}), 404
            
        session.close()
        return send_file(
            attachment.file_path,
            mimetype=attachment.content_type,
            as_attachment=True,
            download_name=attachment.filename
        )
    except Exception as e:
        logger.error(f"Error getting attachment {attachment_id} for job {job_id}: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/attachments/<int:attachment_id>", methods=["DELETE"])
def delete_attachment(job_id, attachment_id):
    """
    DELETE /api/jobs/<job_id>/attachments/<attachment_id>
    Delete an attachment.
    """
    session = SessionLocal()
    try:
        # Check if job exists and user has access
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404
            
        # Find the attachment
        attachment = session.query(JobAttachment).filter(
            JobAttachment.id == attachment_id,
            JobAttachment.job_id == job_id
        ).first()
        
        if not attachment:
            session.close()
            return jsonify({"error": "Attachment not found", "success": False}), 404
            
        # Delete the file if it exists
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
            
        # Delete the attachment record
        session.delete(attachment)
        session.commit()
        
        session.close()
        logger.info(f"Successfully deleted attachment {attachment_id} from job {job_id}")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error deleting attachment {attachment_id} from job {job_id}: {str(e)}")
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
        # Get status counts - exclude archived jobs for charts
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

@jobs_bp.route("/tags", methods=["GET"])
def get_tags():
    """
    GET /api/jobs/tags
    Get all available tags.
    """
    session = SessionLocal()
    try:
        tags = session.query(Tag).all()
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

@jobs_bp.route("/companies", methods=["GET"])
def get_companies():
    """
    GET /api/jobs/companies
    Get all companies.
    """
    session = SessionLocal()
    try:
        companies = session.query(Company).all()
        return jsonify({
            "success": True,
            "companies": [
                {
                    "id": company.id, 
                    "name": company.name,
                    "blacklisted": company.blacklisted,
                    "follower_count": company.follower_count
                } 
                for company in companies
            ]
        })
    except Exception as e:
        logger.error(f"Error getting companies: {str(e)}")
        session.close()
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close()

@jobs_bp.route("/companies/<int:company_id>", methods=["PUT"])
def update_company(company_id):
    """
    PUT /api/jobs/companies/<company_id>
    Update a company (blacklist status, etc.).
    """
    data = request.json
    
    session = SessionLocal()
    try:
        company = session.query(Company).filter(Company.id == company_id).first()
        if not company:
            session.close()
            return jsonify({"error": "Company not found", "success": False}), 404
            
        # Update fields
        if "blacklisted" in data:
            company.blacklisted = bool(data["blacklisted"])
            
        if "name" in data and data["name"]:
            # Check for uniqueness
            existing = session.query(Company).filter(
                and_(
                    func.lower(Company.name) == func.lower(data["name"]),
                    Company.id != company_id
                )
            ).first()
            
            if existing:
                session.close()
                return jsonify({
                    "error": f"Company name '{data['name']}' is already in use", 
                    "success": False
                }), 400
                
            company.name = data["name"]
            
        if "follower_count" in data and data["follower_count"] is not None:
            try:
                company.follower_count = int(data["follower_count"])
            except (ValueError, TypeError):
                pass
            
        session.commit()
        
        # Return updated company
        result = {
            "id": company.id,
            "name": company.name,
            "blacklisted": company.blacklisted,
            "follower_count": company.follower_count
        }
        
        session.close()
        return jsonify({"success": True, "company": result})
    except Exception as e:
        logger.error(f"Error updating company {company_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/delete-older-than/<int:months>", methods=["DELETE"])
def delete_older_than(months):
    """
    DELETE /api/jobs/delete-older-than/<months>
    Delete all jobs older than the specified number of months.
    """
    try:
        # Calculate the cutoff date
        cutoff_date = datetime.utcnow() - timedelta(days=30 * months)
        
        with db_session() as session:
            # Find jobs older than the cutoff date
            old_jobs = session.query(Job).filter(
                and_(
                    Job.posted_date < cutoff_date,
                    Job.deleted == False  # Only consider non-deleted jobs
                )
            ).all()
            
            deleted_count = 0
            
            # Mark jobs as deleted and remove from search index
            for job in old_jobs:
                job.deleted = True
                
                # Remove from Elasticsearch if configured
                remove_job_from_es(job)
                
                deleted_count += 1
            
            # Commit changes
            session.commit()
            
            logger.info(f"Successfully deleted {deleted_count} jobs older than {months} months")
            return jsonify({
                "success": True,
                "deleted_count": deleted_count,
                "message": f"Successfully deleted {deleted_count} jobs older than {months} months"
            })
    except Exception as e:
        logger.error(f"Error deleting jobs older than {months} months: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/remove-dead-links", methods=["POST"])
def remove_dead_links():
    """
    POST /api/jobs/remove-dead-links
    Identify and mark jobs with dead links (404s) as having broken URLs.
    """
    try:
        # Import these modules inside the function to avoid potential circular imports
        from urllib.request import Request, urlopen
        from urllib.error import HTTPError, URLError
        import socket
        
        with db_session() as session:
            # Get all non-deleted jobs with links
            jobs_with_links = session.query(Job).filter(
                and_(
                    Job.deleted == False,
                    Job.link.isnot(None),
                    Job.link != ""
                )
            ).all()
            
            removed_count = 0
            
            for job in jobs_with_links:
                try:
                    # Skip jobs without valid URLs
                    if not job.link or not job.link.startswith(('http://', 'https://')):
                        continue
                    
                    # Create a request with a timeout and user agent
                    req = Request(
                        job.link,
                        headers={'User-Agent': 'Mozilla/5.0 (JobFlow URL Checker)'}
                    )
                    
                    try:
                        # Try to open the URL with a timeout
                        urlopen(req, timeout=5)
                    except HTTPError as e:
                        if e.code == 404:  # Not Found
                            # Mark the job's link as broken
                            job.link = f"[BROKEN] {job.link}"
                            job.notes = (job.notes or "") + f"\n[Auto] Link marked as broken on {datetime.now().strftime('%Y-%m-%d')}."
                            removed_count += 1
                    except (URLError, socket.timeout):
                        # Connection issues - might be temporary, mark as potentially broken
                        job.link = f"[POTENTIALLY BROKEN] {job.link}"
                        job.notes = (job.notes or "") + f"\n[Auto] Link might be broken (connection issue) on {datetime.now().strftime('%Y-%m-%d')}."
                        removed_count += 1
                        
                except Exception as e:
                    # Log the error but continue checking other links
                    logger.error(f"Error checking link for job {job.id}: {str(e)}")
                    continue
            
            # Commit all changes
            session.commit()
            
            logger.info(f"Successfully identified {removed_count} broken links")
            return jsonify({
                "success": True,
                "removed_count": removed_count,
                "message": f"Successfully identified {removed_count} broken links"
            })
    except Exception as e:
        logger.error(f"Error removing dead links: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/archive-rejected", methods=["POST"])
def archive_rejected():
    """
    POST /api/jobs/archive-rejected
    Archive all jobs with 'rejected' status.
    """
    try:
        with db_session() as session:
            # Find all non-archived rejected jobs
            rejected_jobs = session.query(Job).filter(
                and_(
                    Job.status == Status.rejected,
                    Job.archived == False,
                    Job.deleted == False
                )
            ).all()
            
            archived_count = 0
            
            # Archive all rejected jobs
            for job in rejected_jobs:
                job.archived = True
                archived_count += 1
            
            # Commit changes
            session.commit()
            
            logger.info(f"Successfully archived {archived_count} rejected job applications")
            return jsonify({
                "success": True,
                "archived_count": archived_count,
                "message": f"Successfully archived {archived_count} rejected job applications"
            })
    except Exception as e:
        logger.error(f"Error archiving rejected jobs: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/archive-applied-older-than/<int:months>", methods=["POST"])
def archive_applied_older_than(months):
    """
    POST /api/jobs/archive-applied-older-than/<months>
    Archive all 'applied' status jobs older than the specified number of months.
    """
    try:
        # Calculate the cutoff date
        cutoff_date = datetime.utcnow() - timedelta(days=30 * months)
        
        with db_session() as session:
            # Find applied jobs older than the cutoff date
            old_applied_jobs = session.query(Job).filter(
                and_(
                    Job.status == Status.applied,
                    Job.posted_date < cutoff_date,
                    Job.archived == False,
                    Job.deleted == False
                )
            ).all()
            
            archived_count = 0
            
            # Archive the jobs
            for job in old_applied_jobs:
                job.archived = True
                job.notes = (job.notes or "") + f"\n[Auto] Archived on {datetime.now().strftime('%Y-%m-%d')} because applied status was older than {months} months."
                archived_count += 1
            
            # Commit changes
            session.commit()
            
            logger.info(f"Successfully archived {archived_count} applied jobs older than {months} months")
            return jsonify({
                "success": True,
                "archived_count": archived_count,
                "message": f"Successfully archived {archived_count} applied jobs older than {months} months"
            })
    except Exception as e:
        logger.error(f"Error archiving applied jobs: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/mark-oldest-as-priority", methods=["POST"])
def mark_oldest_as_priority():
    """
    POST /api/jobs/mark-oldest-as-priority
    Mark the oldest 50 non-priority jobs as priority.
    """
    try:
        with db_session() as session:
            # Find the oldest 50 non-priority jobs that are not archived or deleted
            oldest_jobs = session.query(Job).filter(
                and_(
                    Job.priority == False,
                    Job.archived == False,
                    Job.deleted == False
                )
            ).order_by(Job.posted_date.asc()).limit(50).all()
            
            marked_count = 0
            
            # Mark jobs as priority
            for job in oldest_jobs:
                job.priority = True
                job.notes = (job.notes or "") + f"\n[Auto] Marked as priority on {datetime.now().strftime('%Y-%m-%d')} because it was one of the oldest 50 jobs."
                marked_count += 1
            
            # Commit changes
            session.commit()
            
            logger.info(f"Successfully marked {marked_count} oldest jobs as priority")
            return jsonify({
                "success": True,
                "marked_count": marked_count,
                "message": f"Successfully marked {marked_count} oldest jobs as priority"
            })
    except Exception as e:
        logger.error(f"Error marking oldest jobs as priority: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/<int:job_id>/follow", methods=["PUT"])
def follow_job(job_id):
    """
    PUT /api/jobs/<job_id>/follow
    Toggle a job's follow status.
    """
    session = SessionLocal()
    try:
        job = get_job_by_id(session, job_id)
        if not job:
            session.close()
            return jsonify({"error": "Job not found", "success": False}), 404

        # Toggle follow status
        job.following = not job.following
        
        # Store the new follow value before committing and closing the session
        new_following_value = job.following
        
        session.commit()
        
        # update index
        index_job_to_es(job, session)
        session.close()
        
        logger.info(f"Successfully toggled follow for job {job_id} to {new_following_value}")
        return jsonify({"success": True, "following": new_following_value})
    except Exception as e:
        logger.error(f"Error toggling follow for job {job_id}: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/reset", methods=["POST"])
def reset_database():
    """
    POST /api/jobs/reset
    Resets the database by dropping all tables and recreating them.
    This endpoint is for testing purposes only and should not be used in production.
    """
    try:
        # First check if we're in development/testing mode
        # This is a safety check to prevent accidental resets in production
        env = os.environ.get("FLASK_ENV", "development")
        if env == "production":
            return jsonify({
                "success": False,
                "error": "This endpoint is disabled in production mode"
            }), 403
            
        from database.models import Base
        from database.session import engine, SessionLocal
        
        # Drop all tables
        logger.info("Dropping all tables")
        Base.metadata.drop_all(bind=engine)
        
        # Recreate all tables
        logger.info("Recreating all tables")
        Base.metadata.create_all(bind=engine)
        
        # Run migrations to ensure indexes and any other schema changes
        from database.schema_migrator import run_migration
        run_migration()
        
        return jsonify({
            "success": True,
            "message": "Database has been reset successfully"
        })
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
