from flask import Flask, request, jsonify
from database.session import SessionLocal, engine
from database.models import Base, Company, Job, Tag, RoleType, Status
from jobscraper.scraper import run_fake_scrape
import math
from datetime import datetime, timedelta
from elasticsearch import Elasticsearch

app = Flask(__name__)
Base.metadata.create_all(bind=engine)
es = Elasticsearch(hosts=["elasticsearch:9200"], timeout=30)

@app.route("/api/tracker", methods=["GET"])
def get_jobs():
    page = int(request.args.get("page", 1))
    per_page = 4
    session = SessionLocal()
    query = session.query(Job).filter_by(deleted=False)
    search_term = request.args.get("search")
    if search_term:
        ids = es.search(index="jobs", body={"query": {"match": {"content": search_term}}})
        matched_ids = [int(h["_id"]) for h in ids["hits"]["hits"]]
        query = query.filter(Job.id.in_(matched_ids))
    show_not_applied = request.args.get("filter_not_applied")
    if show_not_applied:
        query = query.filter(Job.status != Status.applied).filter(Job.status != Status.offer).filter(Job.status != Status.rejected)
    posted_within_week = request.args.get("filter_within_week")
    if posted_within_week:
        cutoff = datetime.now() - timedelta(days=7)
        query = query.filter(Job.posted_date >= cutoff)
    filter_intern = request.args.get("filter_intern")
    if filter_intern:
        query = query.filter(Job.role_type == RoleType.intern)
    filter_newgrad = request.args.get("filter_newgrad")
    if filter_newgrad:
        query = query.filter(Job.role_type == RoleType.newgrad)
    sort_by = request.args.get("sort_by")
    if sort_by == "date":
        query = query.order_by(Job.posted_date.desc())
    elif sort_by == "status":
        query = query.order_by(Job.status)
    elif sort_by == "company":
        query = query.join(Company).order_by(Company.name)
    show_archived = request.args.get("show_archived")
    if not show_archived:
        query = query.filter_by(archived=False)
    show_priority = request.args.get("show_priority")
    if show_priority:
        query = query.filter_by(priority=True)
    total_jobs = query.count()
    total_pages = math.ceil(total_jobs / per_page)
    jobs_data = query.offset((page - 1) * per_page).limit(per_page).all()
    status_counts = {}
    for s in Status:
        status_counts[s.name] = session.query(Job).filter_by(status=s).filter(Job.deleted==False).count()
    session.close()
    return jsonify({
        "trackerData": {
            "jobs": [serialize_job(j) for j in jobs_data],
            "statusCounts": status_counts,
            "pagination": {
                "totalJobs": total_jobs,
                "currentPage": page,
                "itemsPerPage": per_page,
                "totalPages": total_pages
            },
            "scrapeInfo": {"scraping": False, "scrapeProgress": 0, "estimatedSeconds": 0},
            "health": {"isHealthy": True}
        }
    })

@app.route("/api/jobs", methods=["POST"])
def create_job():
    data = request.json.get("job")
    session = SessionLocal()
    company_name = data.get("company")
    comp = session.query(Company).filter_by(name=company_name).first()
    if not comp:
        comp = Company(name=company_name)
        session.add(comp)
        session.commit()
    j = Job(
        company_id=comp.id,
        title=data.get("title"),
        role_type=RoleType(data.get("role_type", "intern")),
        status=Status(data.get("status", "nothing_done")),
        link=data.get("link"),
        priority=data.get("priority", False),
        archived=data.get("archived", False),
        deleted=data.get("deleted", False),
    )
    if data.get("postedDate"):
        j.posted_date = datetime.strptime(data["postedDate"], "%d.%m.%Y")
    session.add(j)
    session.commit()
    index_to_es(j)
    session.close()
    return jsonify({"success": True, "job": serialize_job(j)})

@app.route("/api/jobs/<int:job_id>", methods=["PUT"])
def update_job(job_id):
    data = request.json.get("job")
    session = SessionLocal()
    job = session.query(Job).filter_by(id=job_id).first()
    if not job:
        session.close()
        return jsonify({"error": "Not found"}), 404
    if data.get("company"):
        company_name = data["company"]
        comp = session.query(Company).filter_by(name=company_name).first()
        if not comp:
            comp = Company(name=company_name)
            session.add(comp)
            session.commit()
        job.company_id = comp.id
    if data.get("title"):
        job.title = data["title"]
    if data.get("role_type"):
        job.role_type = RoleType(data["role_type"])
    if data.get("status"):
        job.status = Status(data["status"])
    if "archived" in data:
        job.archived = data["archived"]
    if "priority" in data:
        job.priority = data["priority"]
    if data.get("postedDate"):
        job.posted_date = datetime.strptime(data["postedDate"], "%d.%m.%Y")
    if data.get("link"):
        job.link = data["link"]
    if data.get("deleted") is not None:
        job.deleted = data["deleted"]
    session.commit()
    index_to_es(job)
    session.close()
    return jsonify({"success": True, "job": serialize_job(job)})

@app.route("/api/jobs/<int:job_id>/delete", methods=["POST"])
def delete_job(job_id):
    session = SessionLocal()
    job = session.query(Job).filter_by(id=job_id).first()
    if not job:
        session.close()
        return jsonify({"error": "Not found"}), 404
    job.deleted = True
    session.commit()
    remove_from_es(job)
    session.close()
    return jsonify({"success": True})

@app.route("/api/scrape", methods=["POST"])
def start_scrape():
    fake_jobs = run_fake_scrape()
    return jsonify({"success": True, "scraping": True, "data": fake_jobs})

@app.route("/api/scrape/cancel", methods=["POST"])
def cancel_scrape():
    return jsonify({"success": True, "scraping": False})

def index_to_es(job):
    es.index(index="jobs", id=str(job.id), body={"content": f"{job.title} {job.company.name}"})

def remove_from_es(job):
    es.delete(index="jobs", id=str(job.id), ignore=[404])

def serialize_job(j):
    return {
        "id": j.id,
        "company": j.company.name if j.company else "",
        "title": j.title,
        "role_type": j.role_type.name,
        "postedDate": j.posted_date.strftime("%d.%m.%Y") if j.posted_date else "",
        "link": j.link,
        "statusIndex": list(Status).index(j.status),
        "priority": j.priority,
        "archived": j.archived,
        "deleted": j.deleted,
        "atsScore": 0,
        "tags": [t.name for t in j.tags],
    }

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)