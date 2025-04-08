from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import math

from sqlalchemy.orm import joinedload
from database.session import SessionLocal
from database.models import Job, Company, RoleType, Status
from routes.job_helpers import (
    serialize_job,
    remove_job_from_es,
    index_job_to_es,
    get_job_by_id,
)
from elasticsearch import Elasticsearch
from config import ELASTICSEARCH_URL

tracker_bp = Blueprint("tracker", __name__, url_prefix="/api/tracker")

es = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=60)

@tracker_bp.route("", methods=["GET"])
def get_jobs():
    """
    GET /api/tracker
    Query params can include:
      - page
      - search
      - sort_by = [date, status, company]
      - show_archived = 1/0
      - show_priority = 1/0
      - filter_not_applied = 1/0
      - filter_within_week = 1/0
      - filter_intern = 1/0
      - filter_newgrad = 1/0
      - group_by_company = 1/0  (optional demonstration)
      - exclude_blacklisted = 1/0
    """
    session = SessionLocal()
    page = int(request.args.get("page", 1))
    per_page = 4

    # Base query
    query = session.query(Job).options(joinedload(Job.company), joinedload(Job.tags))

    # Exclude deleted always
    query = query.filter(Job.deleted == False)

    # Possibly exclude blacklisted
    exclude_blacklisted = request.args.get("exclude_blacklisted", "1")  # default yes
    if exclude_blacklisted == "1":
        query = query.join(Company).filter(Company.blacklisted == False)

    # Searching via ES
    search_term = request.args.get("search")
    if search_term:
        # Query ES for job IDs matching the search text
        es_body = {
            "query": {
                "multi_match": {
                    "query": search_term,
                    "fields": ["content"]  # because we put everything in 'content'
                }
            }
        }
        result = es.search(index="jobs", body=es_body)
        matched_ids = [int(hit["_id"]) for hit in result["hits"]["hits"]]
        if matched_ids:
            query = query.filter(Job.id.in_(matched_ids))
        else:
            # No matches => return empty
            return jsonify({
                "trackerData": {
                    "jobs": [],
                    "statusCounts": {},
                    "pagination": {"totalJobs": 0, "currentPage": page, "itemsPerPage": per_page, "totalPages": 0},
                    "scrapeInfo": {"scraping": False, "scrapeProgress": 0, "estimatedSeconds": 0},
                    "health": {"isHealthy": True},
                }
            })

    # Filter not-applied (exclude applied, offer, rejected)
    if request.args.get("filter_not_applied") == "1":
        query = query.filter(Job.status.notin_([Status.applied, Status.offer, Status.rejected]))

    # Filter posted within the last week
    if request.args.get("filter_within_week") == "1":
        cutoff = datetime.now() - timedelta(days=7)
        query = query.filter(Job.posted_date >= cutoff)

    # Filter only interns
    if request.args.get("filter_intern") == "1":
        query = query.filter(Job.role_type == RoleType.intern)

    # Filter only new grads
    if request.args.get("filter_newgrad") == "1":
        query = query.filter(Job.role_type == RoleType.newgrad)

    # Show archived or not
    show_archived = request.args.get("show_archived", "0")
    if show_archived == "0":
        query = query.filter(Job.archived == False)

    # Show only priority
    show_priority = request.args.get("show_priority", "0")
    if show_priority == "1":
        query = query.filter(Job.priority == True)

    # Sorting
    sort_by = request.args.get("sort_by")
    if sort_by == "date":
        query = query.order_by(Job.posted_date.desc())
    elif sort_by == "status":
        query = query.order_by(Job.status)
    elif sort_by == "company":
        query = query.join(Company).order_by(Company.name)

    # GROUP BY (optional demonstration)
    group_by_company = request.args.get("group_by_company", "0")
    # If group_by_company == "1", you might want to restructure how you return data
    # For now, we'll simply do normal pagination. 
    # (If you truly want to group by companies, you'd do an aggregate or restructure your results.)

    # Pagination
    total_jobs = query.count()
    total_pages = math.ceil(total_jobs / per_page)

    jobs_data = query.offset((page - 1) * per_page).limit(per_page).all()

    # Status counts (for all non-deleted)
    status_counts = {}
    for s in Status:
        c = session.query(Job).filter(Job.status == s, Job.deleted == False).count()
        status_counts[s.name] = c

    # Example health check
    health = {"isHealthy": True}

    session.close()

    return jsonify({
        "trackerData": {
            "jobs": [serialize_job(j) for j in jobs_data],
            "statusCounts": status_counts,
            "pagination": {
                "totalJobs": total_jobs,
                "currentPage": page,
                "itemsPerPage": per_page,
                "totalPages": total_pages,
            },
            "scrapeInfo": {
                "scraping": False,  # You can manage your scraping logic here
                "scrapeProgress": 0,
                "estimatedSeconds": 0
            },
            "health": health
        }
    })
