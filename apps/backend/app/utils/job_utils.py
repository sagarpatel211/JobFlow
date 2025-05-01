from datetime import datetime
from typing import List, Optional
from flask import current_app
from app.config import db
from app.models import Company, Tag, Job, JobAttachment


def parse_posted_date(date_str: Optional[str]) -> datetime:
    """Parse an ISO or YYYY-MM-DD date string, defaulting to now on error or missing."""
    if date_str:
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            try:
                return datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                pass
    return datetime.utcnow()


def get_or_create_company(name: str) -> Company:
    """Retrieve a Company by name or create it if missing."""
    comp = Company.query.filter_by(name=name).first()
    if not comp:
        comp = Company(name=name)
        db.session.add(comp)
        db.session.commit()
    return comp


def get_or_create_tags(names: List[str]) -> List[Tag]:
    """Retrieve or create Tag records for the given names."""
    created = False
    for name in names:
        if not Tag.query.filter_by(name=name).first():
            db.session.add(Tag(name=name))
            created = True
    if created:
        db.session.commit()
    # return all tags matching
    return Tag.query.filter(Tag.name.in_(names)).all()


def index_job_es(job: Job) -> None:
    """Index (or re-index) a job document in Elasticsearch."""
    es = current_app.extensions.get("es")
    if not es:
        return
    es.index(
        index="jobs",
        id=job.id,
        body={
            "title": job.title,
            "company": job.company.name if job.company else None,
            "tags": [t.name for t in job.tags],
            "notes": job.notes or "",
        },
    )
