# app/routes/tracker.py
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from ..models import Job, Tag

tracker_bp = Blueprint("tracker", __name__)

@tracker_bp.route("/tags", methods=["GET"])
def get_tags():
    tags = Tag.query.with_entities(Tag.id, Tag.name, func.count().label("job_count"))\
              .join(Tag.jobs)\
              .group_by(Tag.id, Tag.name).all()
    tags_list = [{"id": t.id, "name": t.name, "job_count": t.job_count} for t in tags]
    return jsonify({"tags": tags_list})

@tracker_bp.route("", methods=["GET"])
def get_tracker_data():
    # (For demonstration, return all jobs; integrate filtering, pagination as needed.)
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
    pagination = {"currentPage": 1, "itemsPerPage": len(jobs_list), "totalPages": 1, "totalJobs": len(jobs_list)}
    status_counts = {}  # Compute as needed.
    scrape_info = {"scraping": False, "scrapeProgress": 0, "estimatedSeconds": 0}
    health = {"isHealthy": True}
    return jsonify({
        "success": True,
        "trackerData": {
            "jobs": jobs_list,
            "pagination": pagination,
            "statusCounts": status_counts,
            "scrapeInfo": scrape_info,
            "health": health
        }
    })
