from flask import Blueprint, request, jsonify
from database.session import SessionLocal
from database.models import Job, Company, Tag, Status, RoleType
from sqlalchemy.orm import joinedload
from sqlalchemy import func, and_, or_
from routes.job_helpers import (
    serialize_job,
    build_job_query,
    sort_job_query,
    get_status_counts
)
from typing import Dict, List, Any
from logger_config import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)

tracker_bp = Blueprint("tracker", __name__, url_prefix="/api/tracker")

@tracker_bp.route("", methods=["GET"])
def get_tracker_data():
    """
    GET /api/tracker
    
    Get all data needed for the tracker page:
    - Jobs list with pagination and filtering
    - Status counts for charts
    - Scrape progress info (if scraping)
    - System health status
    
    Query parameters are the same as /api/jobs endpoint with pagination
    """
    try:
        # Get query parameters with defaults
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 4))  # Default per_page is 4 for tracker page
        sort_by = request.args.get("sort_by", "date")
        sort_direction = request.args.get("sort_direction", "desc")
        show_archived = request.args.get("show_archived", "0") == "1"
        show_priority = request.args.get("show_priority", "0") == "1"
        
        # Parse new boolean filters
        filter_not_applied = request.args.get("filter_not_applied", "0") == "1"
        filter_within_week = request.args.get("filter_within_week", "0") == "1"
        filter_intern = request.args.get("filter_intern", "0") == "1"
        filter_newgrad = request.args.get("filter_newgrad", "0") == "1"
        
        group_by_company = request.args.get("group_by_company", "0") == "1"
        
        # When grouping by company, always sort by company to avoid SQL errors
        if group_by_company:
            sort_by = "company"
            # Default to ascending for company sort (A-Z)
            sort_direction = "asc"
        
        search_query = request.args.get("search", None)
        
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = 4
        
        session = SessionLocal()
        try:
            # Build base query with filters
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
            
            # Special handling for group by company
            if group_by_company:
                # First, get a list of all company IDs that have matching jobs
                if sort_by == "company":
                    # For company sorting, directly join with Company table and include name in GROUP BY
                    company_subquery = (
                        query.join(Company, Job.company_id == Company.id)
                        .with_entities(
                            Job.company_id, 
                            Company.name.label('company_name'),
                            func.min(Job.id).label('first_job_id')
                        )
                        .group_by(Job.company_id, Company.name)
                    )
                    
                    # Apply company name sorting
                    if sort_direction == "asc":
                        company_subquery = company_subquery.order_by(Company.name.asc())
                    else:
                        company_subquery = company_subquery.order_by(Company.name.desc())
                elif sort_by == "date":
                    # For date sorting, get company_id and min/max date
                    company_subquery = query.with_entities(
                        Job.company_id,
                        func.min(Job.id).label('first_job_id')
                    ).group_by(Job.company_id)
                    
                    # Order by earliest or latest posted date
                    if sort_direction == "asc":
                        company_subquery = company_subquery.order_by(func.min(Job.posted_date).asc())
                    else:
                        company_subquery = company_subquery.order_by(func.max(Job.posted_date).desc())
                else:
                    # Default sorting by company ID
                    company_subquery = query.with_entities(
                        Job.company_id,
                        func.min(Job.id).label('first_job_id')
                    ).group_by(Job.company_id)
                    
                    # Apply default ordering
                    if sort_direction == "asc":
                        company_subquery = company_subquery.order_by(Job.company_id.asc())
                    else:
                        company_subquery = company_subquery.order_by(Job.company_id.desc())
                
                # Get total number of distinct companies for pagination
                all_companies = company_subquery.all()
                total_companies = len(all_companies)
                
                # Calculate pagination for companies
                total_pages = (total_companies + 0) // 1 if total_companies > 0 else 1  # One company per page
                
                # Get the specific company for the current page
                company_offset = page - 1
                if company_offset >= total_companies:
                    company_offset = 0
                    page = 1
                
                if company_offset < total_companies:
                    current_company_id = all_companies[company_offset][0]
                    
                    # Now query all jobs for the current company
                    query = query.filter(Job.company_id == current_company_id)
                    
                    # Apply sorting within the company
                    query = sort_job_query(query, sort_by, sort_direction)
                    
                    # Load all jobs for this company (no pagination within company)
                    query = query.options(
                        joinedload(Job.company),
                        joinedload(Job.tags),
                        joinedload(Job.attachments)
                    )
                    
                    # Get the total count of jobs for this company
                    total_count = query.count()
                    
                    # Execute query to get all jobs for this company
                    jobs = query.all()
                else:
                    # No companies found
                    jobs = []
                    total_count = 0
            else:
                # Non-grouped mode - get total count before pagination
                total_count = query.count()
                
                # Apply sorting
                query = sort_job_query(query, sort_by, sort_direction)
                
                # Calculate pagination
                total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1
                
                # Apply pagination
                query = query.options(
                    joinedload(Job.company),
                    joinedload(Job.tags),
                    joinedload(Job.attachments)
                )
                query = query.limit(per_page).offset((page - 1) * per_page)
                
                # Execute query
                jobs = query.all()
            
            # Get status counts for charts - always exclude archived jobs for charts
            status_counts = get_status_counts(session, include_archived=False)
            
            # Get scrape info (dummy for now)
            scrape_info = {
                "scraping": False,
                "scrapeProgress": 0,
                "estimatedSeconds": 0
            }
            
            # Check if system is healthy - simple check for now
            is_healthy = True
            
            # Serialize jobs
            serialized_jobs = [serialize_job(job) for job in jobs]
            
            # Build response data
            tracker_data = {
                "jobs": serialized_jobs,
                "statusCounts": status_counts,
                "pagination": {
                    "totalJobs": total_count,
                    "currentPage": page,
                    "itemsPerPage": per_page if not group_by_company else total_count,  # When grouped, we show all jobs for a company
                    "totalPages": total_pages
                },
                "scrapeInfo": scrape_info,
                "health": {
                    "isHealthy": is_healthy
                }
            }
            
            return jsonify({"success": True, "trackerData": tracker_data})
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Error getting tracker data: {str(e)}")
        return jsonify({
            "success": False, 
            "error": str(e),
            "trackerData": {
                "jobs": [],
                "statusCounts": {status.value: 0 for status in Status},
                "pagination": {
                    "totalJobs": 0,
                    "currentPage": 1,
                    "itemsPerPage": 4,
                    "totalPages": 1
                },
                "scrapeInfo": {
                    "scraping": False,
                    "scrapeProgress": 0,
                    "estimatedSeconds": 0
                },
                "health": {
                    "isHealthy": False
                }
            }
        }), 500

def get_scrape_info():
    """Get current scrape status info."""
    return {
        "scraping": is_scraping,
        "scrapeProgress": scrape_progress,
        "estimatedSeconds": estimated_seconds
    }

@tracker_bp.route("/tags", methods=["GET"])
def get_tags():
    """
    GET /api/tracker/tags
    Get all available tags for filtering.
    """
    session = SessionLocal()
    try:
        tags = session.query(Tag).all()
        return jsonify({
            "success": True,
            "tags": [{"id": t.id, "name": t.name} for t in tags]
        })
    except Exception as e:
        logger.error(f"Error getting tags: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close()

@tracker_bp.route("/companies", methods=["GET"])
def get_companies():
    """
    GET /api/tracker/companies
    Get all companies and their blacklist status.
    """
    session = SessionLocal()
    try:
        companies = session.query(Company).all()
        return jsonify({
            "companies": [
                {
                    "id": c.id, 
                    "name": c.name, 
                    "blacklisted": c.blacklisted,
                    "jobCount": session.query(Job).filter(
                        Job.company_id == c.id, 
                        Job.deleted == False
                    ).count()
                } 
                for c in companies
            ]
        })
    except Exception as e:
        logger.error(f"Error getting companies: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@tracker_bp.route("/companies/<int:company_id>/blacklist", methods=["PUT"])
def toggle_blacklist(company_id):
    """
    PUT /api/tracker/companies/{company_id}/blacklist
    Toggle a company's blacklist status.
    """
    session = SessionLocal()
    try:
        company = session.query(Company).filter(Company.id == company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404
        
        company.blacklisted = not company.blacklisted
        session.commit()
        
        return jsonify({
            "success": True,
            "company": {
                "id": company.id,
                "name": company.name,
                "blacklisted": company.blacklisted
            }
        })
    except Exception as e:
        session.rollback()
        logger.error(f"Error toggling company blacklist: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@tracker_bp.route("/status-counts", methods=["GET"])
def get_status_counts_only():
    """
    GET /api/tracker/status-counts
    Get only the status counts for charts.
    This is a lightweight endpoint for updating charts without fetching all tracker data.
    """
    try:
        session = SessionLocal()
        try:
            # Get status counts for charts - always exclude archived jobs for charts
            status_counts = get_status_counts(session, include_archived=False)
            
            return jsonify({
                "success": True,
                "statusCounts": status_counts
            })
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Error getting status counts: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "statusCounts": {status.value: 0 for status in Status}
        }), 500
