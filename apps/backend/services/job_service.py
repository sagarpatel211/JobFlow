import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import and_, or_, func, select, case
from sqlalchemy.orm import Session
from database.models import Job, Company, Tag, RoleType, Status
from services.elasticsearch_service import index_job_to_es, remove_job_from_es

logger = logging.getLogger(__name__)

def get_job_by_id(session: Session, job_id: int) -> Optional[Job]:
    """Get a job by its ID, excluding deleted jobs."""
    return session.query(Job).filter(
        and_(Job.id == job_id, Job.deleted == False)
    ).first()

def get_job_with_relations(session: Session, job_id: int) -> Optional[Job]:
    """Get a job with eager-loaded relationships."""
    return session.query(Job).options(
        # Eager load related entities if needed
    ).filter(
        and_(Job.id == job_id, Job.deleted == False)
    ).first()

def create_or_get_company(session: Session, company_name: str) -> Company:
    """Find or create a company by name."""
    if not company_name:
        raise ValueError("Company name is required")
    
    # Handle case where company_name is actually a dict with name field
    if isinstance(company_name, dict) and 'name' in company_name:
        company_name = company_name['name']
        
    company = session.query(Company).filter(
        func.lower(Company.name) == func.lower(company_name)
    ).first()
    
    if not company:
        company = Company(name=company_name)
        session.add(company)
        session.flush()
    
    return company

def create_or_get_tag(session: Session, tag_name: str) -> Tag:
    """Find or create a tag by name."""
    if not tag_name:
        raise ValueError("Tag name is required")
        
    tag = session.query(Tag).filter(
        func.lower(Tag.name) == func.lower(tag_name)
    ).first()
    
    if not tag:
        tag = Tag(name=tag_name)
        session.add(tag)
        session.flush()
    
    return tag

def apply_job_data_to_model(job: Job, data: dict, session: Session):
    """Apply data from a request to a Job model."""
    # Company
    if "company" in data and data["company"]:
        company_data = data["company"]
        
        # Handle both string and dict formats
        if isinstance(company_data, dict) and "name" in company_data:
            company_name = company_data["name"]
        else:
            company_name = company_data
            
        if company_name:
            company = create_or_get_company(session, company_name)
            job.company_id = company.id

    # Title
    if "title" in data:
        job.title = data["title"]

    # Role Type
    if "role_type" in data:
        job.role_type = RoleType(data["role_type"])  # e.g. 'intern', 'newgrad'

    # Status (accept either status string or statusIndex)
    if "status" in data:
        job.status = Status(data["status"])
    elif "statusIndex" in data:
        status_index = int(data["statusIndex"])
        statuses = list(Status)
        if 0 <= status_index < len(statuses):
            job.status = statuses[status_index]

    # Posted date
    if "posted_date" in data and data["posted_date"]:
        for date_format in ("%d.%m.%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
            try:
                job.posted_date = datetime.strptime(data["posted_date"], date_format)
                break
            except ValueError:
                pass

    # Link
    if "link" in data:
        job.link = data["link"]

    # Priority, Archived, Deleted
    if "priority" in data:
        job.priority = bool(data["priority"])
    if "archived" in data:
        job.archived = bool(data["archived"])
    if "deleted" in data:
        job.deleted = bool(data["deleted"])

    # ATS score
    if "atsScore" in data:
        try:
            job.ats_score = float(data["atsScore"])
        except (TypeError, ValueError):
            logger.warning(f"Invalid ats_score value: {data['atsScore']}")

    # Tags
    if "tags" in data and isinstance(data["tags"], list):
        job.tags.clear()
        for tag_name in data["tags"]:
            t = create_or_get_tag(session, tag_name)
            job.tags.append(t)

def serialize_job(job: Job) -> dict:
    """Convert a Job model to a dictionary for API responses."""
    try:
        ats_score = job.ats_score
    except:
        ats_score = 0

    try:
        status_index = list(Status).index(job.status)
    except:
        status_index = 0

    result = {
        "id": job.id,
        "company": job.company.name if job.company else "",
        "title": job.title,
        "role_type": job.role_type.value,
        "postedDate": job.posted_date.strftime("%d.%m.%Y") if job.posted_date else "",
        "link": job.link or "",
        "statusIndex": status_index,
        "status": job.status.value,
        "priority": job.priority,
        "archived": job.archived,
        "deleted": job.deleted,
        "atsScore": ats_score,
        "tags": [t.name for t in job.tags],
    }

    if getattr(job, 'created_at', None):
        result["created_at"] = job.created_at.isoformat()
    if getattr(job, 'updated_at', None):
        result["updated_at"] = job.updated_at.isoformat()

    return result

def update_job_status(session: Session, job_id: int, direction: int) -> Optional[Job]:
    """Update a job's status by moving it one step in the given direction."""
    job = get_job_by_id(session, job_id)
    if not job:
        return None

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
    
    return job

def toggle_job_priority(session: Session, job_id: int) -> Optional[Job]:
    """Toggle a job's priority status."""
    job = get_job_by_id(session, job_id)
    if not job:
        return None

    # Toggle priority
    job.priority = not job.priority
    
    # Store the new priority value before committing
    new_priority_value = job.priority
    
    # Must refresh job before committing to ensure it's bound to the session
    session.flush()
    session.refresh(job)
    session.commit()

    # update index
    index_job_to_es(job, session)
    
    return job

def toggle_job_archive(session: Session, job_id: int) -> Optional[Job]:
    """Toggle a job's archived status."""
    job = get_job_by_id(session, job_id)
    if not job:
        return None

    # Toggle archived status
    job.archived = not job.archived
    session.commit()

    # update index
    index_job_to_es(job, session)
    
    return job

def soft_delete_job(session: Session, job_id: int) -> Optional[Job]:
    """Soft delete a job by setting its deleted flag to True."""
    job = get_job_by_id(session, job_id)
    if not job:
        return None

    # Mark as deleted
    job.deleted = True
    session.commit()

    # Remove from Elasticsearch
    remove_job_from_es(job)
    
    return job

def bulk_delete_older_than(session: Session, months: int) -> int:
    """Soft delete jobs older than the specified number of months."""
    cutoff_date = datetime.now() - timedelta(days=months * 30)
    
    # Get jobs to delete
    jobs_to_delete = session.query(Job).filter(
        and_(
            Job.posted_date < cutoff_date,
            Job.deleted == False
        )
    ).all()
    
    deleted_count = 0
    
    # Soft delete each job
    for job in jobs_to_delete:
        job.deleted = True
        remove_job_from_es(job)
        deleted_count += 1
    
    session.commit()
    
    return deleted_count 