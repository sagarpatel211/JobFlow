from flask import Blueprint, request, jsonify, current_app, send_file
from app.config import db
from app.models import Job, Company, Status, RoleType, Tag  # Added Tag for custom tags handling
from sqlalchemy import select, update, delete, and_
from datetime import datetime, timedelta  # Add missing imports
import requests  # Add missing import for remove_dead_links
import os
import io
from app.models import JobAttachment
from app.utils.minio_client import get_minio_client, upload_fileobj
from app.utils.redis_client import get_cache, set_cache
from app.utils.job_utils import parse_posted_date, get_or_create_company, get_or_create_tags, index_job_es

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("", methods=["GET"])
def get_jobs():
    # Try fetching cached jobs list
    cached = get_cache("jobs_list")
    if cached:
        return jsonify(cached)

    jobs = Job.query.all()
    jobs_list = [{
        "id": job.id,
        "company": job.company.name if job.company else None,
        "title": job.title,
        "link": job.link,
        "posted_date": job.posted_date.isoformat(),
        "status": job.status.value,
        "role_type": job.role_type.value,
        "priority": job.priority,
        "archived": job.archived,
        "atsScore": job.ats_score,
        "notes": job.notes or "",
        "tags": [t.name for t in job.tags],
        "company_image_url": job.company.image_url if job.company and job.company.image_url else None,
    } for job in jobs]
    data = {"success": True, "jobs": jobs_list}
    # Cache the response for 60 seconds
    set_cache("jobs_list", data, 60)
    return jsonify(data)


@jobs_bp.route("", methods=["POST"])
def create_job():
    session = db.session()
    data = request.get_json().get("job", {})
    company_name = data.get("company", {}).get("name")
    if not company_name:
        return jsonify({"success": False, "error": "Company name is required"}), 400
    # use helper to load or create company
    company = get_or_create_company(company_name)

    try:
        # parse posted_date using helper
        posted_date = parse_posted_date(data.get("posted_date"))
        
        # create job record
        job = Job(
            company=company,
            title=data.get("title"),
            link=data.get("link"),
            posted_date=posted_date,
            status=Status(data.get("status", "nothing_done")),
            role_type=RoleType(data.get("role_type", "newgrad")),
            priority=data.get("priority", False),
            archived=data.get("archived", False),
            ats_score=data.get("ats_score", 0.0),
            notes=data.get("notes", ""),
        )
        # attach tags using helper
        tags = get_or_create_tags(data.get("tags", []))
        job.tags = tags
        session.add(job)
        session.commit()

        # index job in Elasticsearch
        index_job_es(job)
        return jsonify({"success": True, "job": {"id": job.id, "company": job.company.name}}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    data = request.get_json().get("job")
    job = Job.query.get_or_404(job_id)
    if "company" in data and data["company"].get("name"):
        company_name = data["company"]["name"]
        job.company = get_or_create_company(company_name)
    
    # Process posted_date correctly
    job.posted_date = parse_posted_date(data.get("posted_date"))
    
    if "status" in data:
        job.status = Status(data["status"])
    job.priority = data.get("priority", job.priority)
    job.archived = data.get("archived", job.archived)
    job.ats_score = data.get("ats_score", job.ats_score)
    # Update personal notes if provided
    if "notes" in data:
        job.notes = data["notes"]
    # Update custom tags if provided
    if "tags" in data:
        tags = get_or_create_tags(data["tags"])
        job.tags = tags
    db.session.commit()

    # re-index job in Elasticsearch
    index_job_es(job)
    return jsonify({"success": True, "job": {"id": job.id}})

@jobs_bp.route("/<int:job_id>/archive", methods=["PUT"])
def archive_job(job_id):
    session = db.session()
    job = Job.query.get_or_404(job_id)
    job.archived = True
    session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/unarchive", methods=["PUT"])
def unarchive_job(job_id):
    # Set archived flag to False
    session = db.session()
    job = Job.query.get_or_404(job_id)
    job.archived = False
    session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/priority", methods=["PUT"])
def toggle_priority(job_id):
    session = db.session()
    job = Job.query.get_or_404(job_id)
    job.priority = not job.priority
    session.commit()
    return jsonify({"success": True, "priority": job.priority})

@jobs_bp.route("/<int:job_id>/soft-delete", methods=["PUT"])
def soft_delete_job(job_id):
    session = db.session()
    job = Job.query.get_or_404(job_id)
    job.deleted = True
    session.commit()

    # Remove job from Elasticsearch index
    es = current_app.extensions["es"]
    es.delete(index="jobs", id=job.id, ignore=[404])
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/status-arrow", methods=["PUT"])
def update_status_arrow(job_id):
    session = db.session()
    data = request.get_json()
    direction = data.get("direction", 0)
    job = Job.query.get_or_404(job_id)
    statuses = ["nothing_done", "applying", "applied", "oa", "interview", "offer", "rejected"]
    try:
        current_index = statuses.index(job.status.value)
    except ValueError:
        current_index = 0
    new_index = max(0, min(len(statuses) - 1, current_index + direction))
    job.status = Status(statuses[new_index])
    session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/delete-older-than/<int:months>", methods=["DELETE"])
def delete_older_than(months: int):
    session = db.session()
    cutoff = datetime.utcnow() - timedelta(days=30 * months)
    stmt = delete(Job).where(Job.posted_date < cutoff)
    deleted = session.execute(stmt).rowcount
    session.commit()
    return jsonify({"deleted_count": deleted})


@jobs_bp.route("/remove-dead-links", methods=["POST"])
def remove_dead_links():
    session = db.session()
    jobs = (
        session.execute(select(Job.id, Job.link).where(Job.deleted.is_(False)))
        .all()
    )
    dead_ids: list[int] = []
    for jid, link in jobs:
        try:
            r = requests.head(link, timeout=4)
            if r.status_code >= 400:
                dead_ids.append(jid)
        except Exception:
            dead_ids.append(jid)

    if dead_ids:
        session.execute(
            update(Job).where(Job.id.in_(dead_ids)).values(deleted=True)
        )
        session.commit()
    return jsonify({"removed_count": len(dead_ids)})


@jobs_bp.route("/archive-rejected", methods=["POST"])
def archive_rejected():
    session = db.session()
    stmt = (
        update(Job)
        .where(and_(Job.status == Status.rejected, Job.archived.is_(False)))
        .values(archived=True)
    )
    count = session.execute(stmt).rowcount
    session.commit()
    return jsonify({"archived_count": count})


@jobs_bp.route("/archive-applied-older-than/<int:months>", methods=["POST"])
def archive_applied_older(months: int):
    session = db.session()
    cutoff = datetime.utcnow() - timedelta(days=30 * months)
    stmt = (
        update(Job)
        .where(
            and_(
                Job.status == Status.applied,
                Job.posted_date < cutoff,
                Job.archived.is_(False),
            )
        )
        .values(archived=True)
    )
    count = session.execute(stmt).rowcount
    session.commit()
    return jsonify({"archived_count": count})


@jobs_bp.route("/mark-oldest-as-priority", methods=["POST"])
def mark_oldest_as_priority():
    session = db.session()
    sub = (
        select(Job.id)
        .where(and_(Job.priority.is_(False), Job.deleted.is_(False)))
        .order_by(Job.posted_date.asc())
        .limit(50)
    )
    stmt = update(Job).where(Job.id.in_(sub)).values(priority=True)
    count = session.execute(stmt).rowcount
    session.commit()
    return jsonify({"marked_count": count})

@jobs_bp.route("/<int:job_id>/restore", methods=["PUT"])
def restore_job(job_id):
    session = db.session()
    job = Job.query.get_or_404(job_id)
    job.deleted = False
    session.commit()

    # Re-index restored job in Elasticsearch
    es = current_app.extensions["es"]
    es.index(index="jobs", id=job.id, body={
        "title": job.title,
        "company": job.company.name,
        "tags": [t.name for t in job.tags],
        "notes": job.notes or ""
    })
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/permanent-delete", methods=["DELETE", "OPTIONS"])
def permanent_delete_job(job_id):
    # Handle OPTIONS request (preflight)
    if request.method == "OPTIONS":
        response = jsonify({"success": True})
        return response

    # Handle actual DELETE request
    session = db.session()
    job = Job.query.get_or_404(job_id)
    session.delete(job)
    session.commit()

    # Remove job from Elasticsearch index
    es = current_app.extensions["es"]
    es.delete(index="jobs", id=job_id, ignore=[404])
    response = jsonify({"success": True})
    return response

@jobs_bp.route("/<int:job_id>/attachment", methods=["POST", "OPTIONS"])
def upload_attachment(job_id: int):
    # Upload a resume or cover letter file for a job
    session = db.session()
    if 'file' not in request.files or 'attachment_type' not in request.form:
        return jsonify({"success": False, "error": "file and attachment_type are required"}), 400
    f = request.files['file']
    attachment_type = request.form['attachment_type']
    # Upload to Minio using helper
    bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
    object_key = f"{job_id}/{attachment_type}/{f.filename}"
    data = f.read()
    upload_fileobj(bucket, object_key, io.BytesIO(data), len(data), f.content_type)
    # Persist in database
    att = JobAttachment(job_id=job_id, filename=f.filename, content_type=f.content_type, object_key=object_key, attachment_type=attachment_type)
    session.add(att)
    session.commit()
    return jsonify({"success": True, "attachment": {"filename": att.filename, "attachment_type": att.attachment_type}})

@jobs_bp.route("/<int:job_id>/attachment/<string:attachment_type>", methods=["GET"])
def get_attachment(job_id: int, attachment_type: str):
    # Get a presigned URL for the requested attachment
    session = db.session()
    att = session.query(JobAttachment).filter_by(job_id=job_id, attachment_type=attachment_type).first()
    if not att:
        return jsonify({"success": False, "error": "Attachment not found"}), 404
    minio_client = get_minio_client()
    bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
    url = minio_client.presigned_get_object(bucket, att.object_key, expires=timedelta(minutes=10))
    return jsonify({"success": True, "url": url, "filename": att.filename})

@jobs_bp.route("/<int:job_id>/attachment/<string:attachment_type>/download", methods=["GET"])
def download_attachment_file(job_id: int, attachment_type: str):
    """Stream the attachment file through the API proxy."""
    session = db.session()
    att = session.query(JobAttachment).filter_by(job_id=job_id, attachment_type=attachment_type).first()
    if not att:
        return jsonify({"success": False, "error": "Attachment not found"}), 404
    bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
    client = get_minio_client()
    try:
        obj = client.get_object(bucket, att.object_key)
        data = obj.read()
        # Return as attachment
        import io as _io
        file_obj = _io.BytesIO(data)
        file_obj.seek(0)
        return send_file(
            file_obj,
            mimetype=att.content_type,
            as_attachment=True,
            download_name=att.filename
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
