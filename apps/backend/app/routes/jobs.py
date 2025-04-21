from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Job, Company, Status, RoleType  # Adjust the import paths accordingly
from sqlalchemy import select, update, delete, and_
from datetime import datetime, timedelta  # Add missing imports
import requests  # Add missing import for remove_dead_links

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("", methods=["GET"])
def get_jobs():
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
    } for job in jobs]
    return jsonify({"success": True, "jobs": jobs_list})


@jobs_bp.route("", methods=["POST"])
def create_job():
    data = request.get_json().get("job", {})
    company_data = data.get("company", {})
    company_name = company_data.get("name")

    if not company_name:
        return jsonify({"success": False, "error": "Company name is required"}), 400

    company = Company.query.filter_by(name=company_name).first()
    if not company:
        company = Company(name=company_name)
        db.session.add(company)
        db.session.commit()

    try:
        job = Job(
            company=company,
            title=data.get("title"),
            link=data.get("link"),
            posted_date=data.get("posted_date"),  # Make sure the date is parsed/formatted correctly
            status=Status(data.get("status", "nothing_done")),
            role_type=RoleType(data.get("role_type", "newgrad")),
            priority=data.get("priority", False),
            archived=data.get("archived", False),
            ats_score=data.get("ats_score", 0.0),
            notes=data.get("notes", "")
        )
        db.session.add(job)
        db.session.commit()

        return jsonify({"success": True, "job": {"id": job.id, "company": job.company.name}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    data = request.get_json().get("job")
    job = Job.query.get_or_404(job_id)
    if "company" in data and data["company"].get("name"):
        company = Company.query.filter_by(name=data["company"].get("name")).first()
        if company:
            job.company = company
    job.title = data.get("title", job.title)
    job.link = data.get("link", job.link)
    job.posted_date = data.get("posted_date", job.posted_date)
    if "status" in data:
        job.status = Status(data["status"])
    job.priority = data.get("priority", job.priority)
    job.archived = data.get("archived", job.archived)
    job.ats_score = data.get("ats_score", job.ats_score)
    db.session.commit()
    return jsonify({"success": True, "job": {"id": job.id}})

@jobs_bp.route("/<int:job_id>/archive", methods=["PUT"])
def archive_job(job_id):
    job = Job.query.get_or_404(job_id)
    job.archived = True
    db.session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/priority", methods=["PUT"])
def toggle_priority(job_id):
    job = Job.query.get_or_404(job_id)
    job.priority = not job.priority
    db.session.commit()
    return jsonify({"success": True, "priority": job.priority})

@jobs_bp.route("/<int:job_id>/soft-delete", methods=["PUT"])
def soft_delete_job(job_id):
    job = Job.query.get_or_404(job_id)
    job.deleted = True
    db.session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/status-arrow", methods=["PUT"])
def update_status_arrow(job_id):
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
    db.session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/delete-older-than/<int:months>", methods=["DELETE"])
def delete_older_than(months: int):
    cutoff = datetime.utcnow() - timedelta(days=30 * months)
    stmt = delete(Job).where(Job.posted_date < cutoff)
    deleted = db.session.execute(stmt).rowcount
    db.session.commit()
    return jsonify({"deleted_count": deleted})


@jobs_bp.route("/remove-dead-links", methods=["POST"])
def remove_dead_links():
    jobs = (
        db.session.execute(select(Job.id, Job.link).where(Job.deleted.is_(False)))
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
        db.session.execute(
            update(Job).where(Job.id.in_(dead_ids)).values(deleted=True)
        )
        db.session.commit()
    return jsonify({"removed_count": len(dead_ids)})


@jobs_bp.route("/archive-rejected", methods=["POST"])
def archive_rejected():
    stmt = (
        update(Job)
        .where(and_(Job.status == Status.rejected, Job.archived.is_(False)))
        .values(archived=True)
    )
    count = db.session.execute(stmt).rowcount
    db.session.commit()
    return jsonify({"archived_count": count})


@jobs_bp.route("/archive-applied-older-than/<int:months>", methods=["POST"])
def archive_applied_older(months: int):
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
    count = db.session.execute(stmt).rowcount
    db.session.commit()
    return jsonify({"archived_count": count})


@jobs_bp.route("/mark-oldest-as-priority", methods=["POST"])
def mark_oldest_as_priority():
    sub = (
        select(Job.id)
        .where(and_(Job.priority.is_(False), Job.deleted.is_(False)))
        .order_by(Job.posted_date.asc())
        .limit(50)
    )
    stmt = update(Job).where(Job.id.in_(sub)).values(priority=True)
    count = db.session.execute(stmt).rowcount
    db.session.commit()
    return jsonify({"marked_count": count})

@jobs_bp.route("/<int:job_id>/restore", methods=["PUT"])
def restore_job(job_id):
    job = Job.query.get_or_404(job_id)
    job.deleted = False
    db.session.commit()
    return jsonify({"success": True})

@jobs_bp.route("/<int:job_id>/permanent-delete", methods=["DELETE", "OPTIONS"])
def permanent_delete_job(job_id):
    # Handle OPTIONS request (preflight)
    if request.method == "OPTIONS":
        response = jsonify({"success": True})
        return response

    # Handle actual DELETE request
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    response = jsonify({"success": True})
    return response
