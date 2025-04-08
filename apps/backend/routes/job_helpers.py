from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from elasticsearch import Elasticsearch
from config import ELASTICSEARCH_URL
from database.models import Company, Job, RoleType, Status, Tag

es = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=60)

def serialize_job(job: Job) -> dict:
    """Convert a Job object to a dictionary for JSON responses."""
    return {
        "id": job.id,
        "company": job.company.name if job.company else "",
        "title": job.title,
        "role_type": job.role_type.name,
        "postedDate": job.posted_date.strftime("%d.%m.%Y") if job.posted_date else "",
        "link": job.link,
        "statusIndex": list(Status).index(job.status),  # or just job.status.name
        "priority": job.priority,
        "archived": job.archived,
        "deleted": job.deleted,
        "atsScore": 0,
        "tags": [t.name for t in job.tags],
    }

def create_or_get_company(session: Session, company_name: str) -> Company:
    """Get a Company if it exists, otherwise create it."""
    company = session.query(Company).filter_by(name=company_name).first()
    if not company:
        company = Company(name=company_name)
        session.add(company)
        session.commit()  # commit so company has an ID
    return company

def apply_job_data_to_model(job: Job, data: dict, session: Session):
    """
    Given a Job model and a dictionary from the request,
    update the job fields accordingly (company, title, etc.).
    """
    # Company
    if "company" in data and data["company"]:
        company_name = data["company"]
        comp = create_or_get_company(session, company_name)
        job.company_id = comp.id

    # Title
    if "title" in data:
        job.title = data["title"]

    # Role Type
    if "role_type" in data:
        job.role_type = RoleType(data["role_type"])  # intern, newgrad

    # Status
    if "status" in data:
        job.status = Status(data["status"])

    # Posted date
    if "postedDate" in data and data["postedDate"]:
        job.posted_date = datetime.strptime(data["postedDate"], "%d.%m.%Y")

    # Link
    if "link" in data:
        job.link = data["link"]

    # Priority
    if "priority" in data:
        job.priority = bool(data["priority"])

    # Archived
    if "archived" in data:
        job.archived = bool(data["archived"])

    # Deleted
    if "deleted" in data:
        job.deleted = bool(data["deleted"])

def index_job_to_es(job: Job, session: Session):
    """
    Index the job into Elasticsearch for searching by
    company name, job title, tags, etc.
    """
    session.refresh(job)  # Make sure we have the latest job fields
    tags_string = " ".join([t.name for t in job.tags])
    es_body = {
        "content": f"{job.title} {job.company.name} {tags_string}"
    }
    es.index(index="jobs", id=str(job.id), body=es_body)

def remove_job_from_es(job: Job):
    """Remove a job from the Elasticsearch index."""
    es.delete(index="jobs", id=str(job.id), ignore=[404])

def get_job_by_id(session: Session, job_id: int) -> Optional[Job]:
    """Fetch a job by ID (if it exists)."""
    return session.query(Job).filter(Job.id == job_id).first()
