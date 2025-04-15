from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Job, Company, Status, RoleType  # Adjust the import paths accordingly

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
