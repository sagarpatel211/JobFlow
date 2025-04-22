from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func, or_, and_, select
from datetime import datetime, timedelta
from ..config import db
from ..models import Job, Tag, Status, RoleType, Company, JobAttachment
from ..utils.es_client import search_jobs_fuzzy
from ..utils.minio_client import get_minio_client
import os

tracker_bp = Blueprint("tracker", __name__)


@tracker_bp.route("/tags", methods=["GET"])
def get_tags():
    # Aggregate tag counts via a select statement to avoid Query API
    session = db.session()
    stmt = select(
        Tag.id,
        Tag.name,
        func.count(Job.id).label("job_count")
    ).join(Tag.jobs).group_by(Tag.id, Tag.name)
    rows = session.execute(stmt).all()
    tags = [
        {"id": id_, "name": name, "job_count": count}
        for id_, name, count in rows
            ]
    return jsonify({"tags": tags})


def status_counts_query(base):
    # Create a copy of the query without any ordering
    # to avoid conflicts with GROUP BY
    base = base.order_by(None)
    
    counts = (
        base.with_entities(Job.status, func.count())
        .group_by(Job.status)
        .all()
    )
    return {s.value: c for s, c in counts}


@tracker_bp.route("", methods=["GET"])
def get_tracker_data():
    # determine if grouping by company
    group_by = request.args.get("group_by_company") == "1"
    q = Job.query.filter(Job.deleted.is_(False))

    # --- filters from query‑string ---
    if request.args.get("show_archived") != "1":
        q = q.filter(Job.archived.is_(False))
    if request.args.get("show_priority") == "1":
        q = q.filter(Job.priority.is_(True))
    if request.args.get("filter_not_applied") == "1":
        # Show only jobs that haven't been fully applied (nothing_done or applying)
        q = q.filter(Job.status.in_([Status.nothing_done, Status.applying]))
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
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
        job_list: list[dict] = []
        # Fuzzy ES search if query length >= 3
        ids, scores, fuzzy_total = search_jobs_fuzzy(search, page, per_page) if len(search) >= 3 else ([], [], 0)
        if ids:
            jobs_from_es = Job.query.filter(Job.id.in_(ids), Job.deleted.is_(False)).all()
            id_to_job = {j.id: j for j in jobs_from_es}
            for idx, job_id in enumerate(ids):
                j = id_to_job.get(job_id)
                if not j:
                    continue
                # Attachments
                # Query attachments for this job
                sess = db.session()
                atts = sess.query(JobAttachment).filter_by(job_id=job_id).all()
                bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
                client = get_minio_client()
                resume_att = next((a for a in atts if a.attachment_type=='resume'), None)
                cover_att = next((a for a in atts if a.attachment_type=='cover_letter'), None)
                resume_filename = resume_att.filename if resume_att else None
                resume_url = client.presigned_get_object(bucket, resume_att.object_key, expires=timedelta(seconds=3600)) if resume_att else None
                coverLetter_filename = cover_att.filename if cover_att else None
                coverLetter_url = client.presigned_get_object(bucket, cover_att.object_key, expires=timedelta(seconds=3600)) if cover_att else None
                job_list.append({
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
                    "notes": j.notes or "",
                    "tags": [t.name for t in j.tags],
                    "company_image_url": j.company.image_url if j.company and j.company.image_url else None,
                    "score": scores[idx],
                    "resumeFilename": resume_filename,
                    "resumeUrl": resume_url,
                    "coverLetterFilename": coverLetter_filename,
                    "coverLetterUrl": coverLetter_url
                })
        # Substring search in DB for title or company (case-insensitive), excluding ES results
        additional_total = 0
        if len(search) >= 3:
            substr_q = q.join(Job.company)
            substr_q = substr_q.filter(or_(
                func.lower(Job.title).contains(search.lower()),
                func.lower(Company.name).contains(search.lower())
            ))
            if ids:
                substr_q = substr_q.filter(~Job.id.in_(ids))
            additional_ids = [row[0] for row in substr_q.with_entities(Job.id).all()]
            additional_total = len(additional_ids)
            if additional_ids:
                jobs_additional = Job.query.filter(Job.id.in_(additional_ids), Job.deleted.is_(False)).all()
                for j in jobs_additional:
                    # Attachments for substring matches
                    sess2 = db.session()
                    atts2 = sess2.query(JobAttachment).filter_by(job_id=j.id).all()
                    resume_att2 = next((a for a in atts2 if a.attachment_type=='resume'), None)
                    cover_att2 = next((a for a in atts2 if a.attachment_type=='cover_letter'), None)
                    resume_filename2 = resume_att2.filename if resume_att2 else None
                    resume_url2 = client.presigned_get_object(bucket, resume_att2.object_key, expires=timedelta(seconds=3600)) if resume_att2 else None
                    coverLetter_filename2 = cover_att2.filename if cover_att2 else None
                    coverLetter_url2 = client.presigned_get_object(bucket, cover_att2.object_key, expires=timedelta(seconds=3600)) if cover_att2 else None
                    job_list.append({
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
                        "notes": j.notes or "",
                        "tags": [t.name for t in j.tags],
                        "company_image_url": j.company.image_url if j.company and j.company.image_url else None,
                        "score": None,
                        "resumeFilename": resume_filename2,
                        "resumeUrl": resume_url2,
                        "coverLetterFilename": coverLetter_filename2,
                        "coverLetterUrl": coverLetter_url2
                    })
        total_jobs = fuzzy_total + additional_total
        status_counts = status_counts_query(Job.query.filter(Job.deleted.is_(False)))
        return jsonify({
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
            }
        })

    # no search: fallback to original SQL-based pagination and sorting
    if group_by:
        # one company per page: return all jobs for that company
        page = int(request.args.get("page", 1))
        # count total distinct companies (no ordering to avoid SQL errors)
        distinct_ids_q = q.join(Company).with_entities(Company.id).distinct()
        total_companies = distinct_ids_q.count()
        # fetch single company per page, including name to allow ORDER BY
        paged_companies = (
            q.join(Company)
             .with_entities(Company.id, Company.name)
             .distinct()
             .order_by(Company.name)
             .offset((page - 1) * 1)
             .limit(1)
             .all()
        )
        company_ids = [cid for cid, _ in paged_companies]
        job_list = []
        for cid in company_ids:
            # fetch all jobs for this company
            jobs_for_company = q.filter(Job.company_id == cid).order_by(Job.posted_date.desc()).all()
            for j in jobs_for_company:
                atts = db.session().query(JobAttachment).filter_by(job_id=j.id).all()
                bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
                client = get_minio_client()
                resume_att = next((a for a in atts if a.attachment_type == 'resume'), None)
                cover_att = next((a for a in atts if a.attachment_type == 'cover_letter'), None)
                resume_filename = resume_att.filename if resume_att else None
                resume_url = client.presigned_get_object(bucket, resume_att.object_key, expires=timedelta(seconds=3600)) if resume_att else None
                coverLetter_filename = cover_att.filename if cover_att else None
                coverLetter_url = client.presigned_get_object(bucket, cover_att.object_key, expires=timedelta(seconds=3600)) if cover_att else None
                job_list.append({
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
                    "notes": j.notes or "",
                    "tags": [t.name for t in j.tags],
                    "company_image_url": j.company.image_url if j.company and j.company.image_url else None,
                    "resumeFilename": resume_filename,
                    "resumeUrl": resume_url,
                    "coverLetterFilename": coverLetter_filename,
                    "coverLetterUrl": coverLetter_url
                })
        status_counts = status_counts_query(q)
        return jsonify({
            "success": True,
            "trackerData": {
                "jobs": job_list,
                "pagination": {
                    "currentPage": page,
                    "itemsPerPage": len(job_list),
                    "totalPages": total_companies,
                    "totalJobs": total_companies,
                },
                "statusCounts": status_counts,
                "scrapeInfo": {"scraping": False, "scrapeProgress": 0, "estimatedSeconds": 0},
                "health": {"isHealthy": True},
            },
        })
    # --- sorting ---
    sort_by = request.args.get("sort_by", "date")
    sort_direction = request.args.get("sort_direction", "desc")
    
    # Map frontend sort fields to database columns
    sort_columns = {
        "date": Job.posted_date,
        "company": Company.name,
        "status": Job.status,
        "priority": Job.priority,
        "title": Job.title
    }
    
    # Get the column to sort by, default to posted_date if not found
    sort_column = sort_columns.get(sort_by, Job.posted_date)
    
    # Join with Company if sorting by company name
    if sort_by == "company":
        q = q.join(Job.company, isouter=True)
    
    # Apply sorting
    if sort_direction == "asc":
        q = q.order_by(sort_column.asc())
    else:
        q = q.order_by(sort_column.desc())
    
    # Secondary sort by date if primary sort isn't date
    if sort_by != "date":
        q = q.order_by(Job.posted_date.desc())

    # --- pagination ---
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    total_jobs = q.count()
    
    # Execute the query with pagination
    jobs = q.offset((page - 1) * per_page).limit(per_page).all()

    # FALLBACK: include attachments for paginated jobs
    job_list = []
    for j in jobs:
        # Fetch attachments
        atts = db.session().query(JobAttachment).filter_by(job_id=j.id).all()
        bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
        client = get_minio_client()
        resume_att = next((a for a in atts if a.attachment_type == 'resume'), None)
        cover_att = next((a for a in atts if a.attachment_type == 'cover_letter'), None)
        resume_filename = resume_att.filename if resume_att else None
        resume_url = client.presigned_get_object(bucket, resume_att.object_key, expires=timedelta(seconds=3600)) if resume_att else None
        coverLetter_filename = cover_att.filename if cover_att else None
        coverLetter_url = client.presigned_get_object(bucket, cover_att.object_key, expires=timedelta(seconds=3600)) if cover_att else None
        job_list.append({
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
            "notes": j.notes or "",
            "tags": [t.name for t in j.tags],
            "company_image_url": j.company.image_url if j.company and j.company.image_url else None,
            "resumeFilename": resume_filename,
            "resumeUrl": resume_url,
            "coverLetterFilename": coverLetter_filename,
            "coverLetterUrl": coverLetter_url
        })

    status_counts = status_counts_query(q)

    return jsonify({
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
    })
