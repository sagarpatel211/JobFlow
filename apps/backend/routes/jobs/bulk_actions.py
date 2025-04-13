from flask import request, jsonify
from database.session import SessionLocal
from database.models import Job, Status
from sqlalchemy import and_, or_, func
from services.job_service import bulk_delete_older_than
from services.elasticsearch_service import index_job_to_es, remove_job_from_es
from datetime import datetime, timedelta
import logging
import requests

from routes.jobs.base import jobs_bp

logger = logging.getLogger(__name__)

@jobs_bp.route("/delete-older-than/<int:months>", methods=["DELETE"])
def delete_older_than(months):
    """
    DELETE /api/jobs/delete-older-than/<months>
    Delete all jobs older than the specified number of months.
    """
    if months <= 0:
        return jsonify({"error": "Months must be greater than 0", "success": False}), 400
    
    session = SessionLocal()
    try:
        deleted_count = bulk_delete_older_than(session, months)
        
        session.close()
        
        logger.info(f"Successfully deleted {deleted_count} jobs older than {months} months")
        return jsonify({"success": True, "deleted_count": deleted_count})
    except Exception as e:
        logger.error(f"Error deleting jobs older than {months} months: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/remove-dead-links", methods=["POST"])
def remove_dead_links():
    """
    POST /api/jobs/remove-dead-links
    Remove all jobs with dead links.
    """
    session = SessionLocal()
    try:
        # Get all jobs with links
        jobs_with_links = session.query(Job).filter(
            and_(
                Job.deleted == False,
                Job.link.isnot(None),
                Job.link != ""
            )
        ).all()
        
        logger.info(f"Checking {len(jobs_with_links)} jobs for dead links")
        
        removed_count = 0
        
        # Check each link
        for job in jobs_with_links:
            try:
                # Make a HEAD request to check if the link is alive
                response = requests.head(job.link, timeout=5)
                
                # If the response status code is 4xx or 5xx, the link is dead
                if response.status_code >= 400:
                    logger.info(f"Dead link found for job {job.id}: {job.link} (status: {response.status_code})")
                    
                    # Mark the job as deleted
                    job.deleted = True
                    removed_count += 1
                    
                    # Remove from Elasticsearch
                    remove_job_from_es(job)
            except Exception as e:
                # If the request fails, the link is probably dead
                logger.info(f"Dead link found for job {job.id}: {job.link} (error: {str(e)})")
                
                # Mark the job as deleted
                job.deleted = True
                removed_count += 1
                
                # Remove from Elasticsearch
                remove_job_from_es(job)
        
        session.commit()
        session.close()
        
        logger.info(f"Successfully removed {removed_count} jobs with dead links")
        return jsonify({"success": True, "removed_count": removed_count})
    except Exception as e:
        logger.error(f"Error removing jobs with dead links: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/archive-rejected", methods=["POST"])
def archive_rejected():
    """
    POST /api/jobs/archive-rejected
    Archive all rejected jobs.
    """
    session = SessionLocal()
    try:
        # Get all rejected jobs that are not archived
        rejected_jobs = session.query(Job).filter(
            and_(
                Job.deleted == False,
                Job.archived == False,
                Job.status == Status.rejected
            )
        ).all()
        
        archived_count = 0
        
        # Archive each job
        for job in rejected_jobs:
            job.archived = True
            archived_count += 1
            
            # Update Elasticsearch index
            index_job_to_es(job, session)
        
        session.commit()
        session.close()
        
        logger.info(f"Successfully archived {archived_count} rejected jobs")
        return jsonify({"success": True, "archived_count": archived_count})
    except Exception as e:
        logger.error(f"Error archiving rejected jobs: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/archive-applied-older-than/<int:months>", methods=["POST"])
def archive_applied_older_than(months):
    """
    POST /api/jobs/archive-applied-older-than/<months>
    Archive all applied jobs older than the specified number of months.
    """
    if months <= 0:
        return jsonify({"error": "Months must be greater than 0", "success": False}), 400
    
    session = SessionLocal()
    try:
        # Calculate cutoff date
        cutoff_date = datetime.now() - timedelta(days=months * 30)
        
        # Get all applied jobs that are not archived and older than the cutoff date
        applied_jobs = session.query(Job).filter(
            and_(
                Job.deleted == False,
                Job.archived == False,
                Job.status == Status.applied,
                Job.posted_date < cutoff_date
            )
        ).all()
        
        archived_count = 0
        
        # Archive each job
        for job in applied_jobs:
            job.archived = True
            archived_count += 1
            
            # Update Elasticsearch index
            index_job_to_es(job, session)
        
        session.commit()
        session.close()
        
        logger.info(f"Successfully archived {archived_count} applied jobs older than {months} months")
        return jsonify({"success": True, "archived_count": archived_count})
    except Exception as e:
        logger.error(f"Error archiving applied jobs older than {months} months: {str(e)}")
        session.rollback()
        session.close()
        return jsonify({"error": str(e), "success": False}), 500

@jobs_bp.route("/mark-oldest-as-priority", methods=["POST"])
def mark_oldest_as_priority():
    """
    POST /api/jobs/mark-oldest-as-priority
    Mark the 50 oldest jobs as priority.
    """
    session = SessionLocal()
    try:
        # Get the 50 oldest jobs that are not marked as priority
        oldest_jobs = session.query(Job).filter(
            and_(
                Job.deleted == False,
                Job.archived == False,
                Job.priority == False
            )
        ).order_by(Job.posted_date.asc()).limit(50).all()
        
        marked_count = 0
        
        # Mark each job as priority
        for job in oldest_jobs:
            job.priority = True
            marked_count += 1
            
            # Update Elasticsearch index
            index_job_to_es(job, session)
        
        session.commit()
        session.close()
        
        logger.info(f"Successfully marked {marked_count} oldest jobs as priority")
        return jsonify({"success": True, "marked_count": marked_count})
    except Exception as e:
        logger.error(f"Error marking oldest jobs as priority: {str(e)}")
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
        import os
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