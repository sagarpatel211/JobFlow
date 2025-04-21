from flask import Blueprint, request, jsonify
from sqlalchemy import func, or_, and_
from datetime import datetime, timedelta
from ..extensions import db
from ..models import Job, Tag, Status, RoleType

tracker_bp = Blueprint("tracker", __name__)


@tracker_bp.route("/tags", methods=["GET"])
def get_tags():
    rows = (
        db.session.query(
            Tag.id, Tag.name, func.count(Job.id).label("job_count")
        )
        .join(Tag.jobs)
        .group_by(Tag.id)
        .all()
    )
    return jsonify(
        {
            "tags": [
                {"id": r.id, "name": r.name, "job_count": r.job_count} for r in rows
            ]
        }
    )


def status_counts_query(base):
    counts = (
        base.with_entities(Job.status, func.count())
        .group_by(Job.status)
        .all()
    )
    return {s.value: c for s, c in counts}


@tracker_bp.route("", methods=["GET"])
def get_tracker_data():
    q = Job.query.filter(Job.deleted.is_(False))

    # --- filters from query‑string ---
    if request.args.get("show_archived") != "1":
        q = q.filter(Job.archived.is_(False))
    if request.args.get("show_priority") == "1":
        q = q.filter(Job.priority.is_(True))
    if request.args.get("filter_not_applied") == "1":
        q = q.filter(Job.status != Status.applied)
    if request.args.get("filter_within_week") == "1":
        q = q.filter(Job.posted_date >= datetime.utcnow() - timedelta(days=7))
    if request.args.get("filter_intern") == "1":
        q = q.filter(Job.role_type == RoleType.intern)
    if request.args.get("filter_newgrad") == "1":
        q = q.filter(Job.role_type == RoleType.newgrad)

    tag = request.args.get("selected_tag")
    if tag:
        q = q.join(Job.tags).filter(Tag.name == tag)

    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Job.title.ilike(like), Job.company.has(name=search)))

    # --- pagination ---
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    total_jobs = q.count()
    jobs = (
        q.order_by(Job.posted_date.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    job_list = [
        {
            "id": j.id,
            "company": j.company.name,
            "title": j.title,
            "link": j.link,
            "posted_date": j.posted_date.isoformat(),
            "status": j.status.value,
            "role_type": j.role_type.value,
            "priority": j.priority,
            "archived": j.archived,
            "atsScore": j.ats_score,
            "tags": [t.name for t in j.tags],
        }
        for j in jobs
    ]

    status_counts = status_counts_query(q)

    return jsonify(
        {
            "success": True,
            "trackerData": {
                "jobs": job_list,
                "pagination": {
                    "currentPage": page,
                    "itemsPerPage": per_page,
                    "totalPages": (total_jobs + per_page - 1) // per_page,
                    "totalJobs": total_jobs,
                },
                "statusCounts": status_counts,
                "scrapeInfo": {"scraping": False, "scrapeProgress": 0, "estimatedSeconds": 0},
                "health": {"isHealthy": True},
            },
        }
    )
