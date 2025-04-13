import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, select, case
import os

# Import Elasticsearch conditionally
try:
    from elasticsearch import Elasticsearch
except ImportError:
    logging.warning("Elasticsearch package not installed")
    # Create dummy Elasticsearch for type hints
    class Elasticsearch:
        def __init__(self, *args, **kwargs):
            pass
        def indices(self):
            return type('obj', (object,), {'exists': lambda index: False, 'create': lambda index, body: None})()
        def index(self, *args, **kwargs):
            return None
        def delete(self, *args, **kwargs):
            return None
        def search(self, *args, **kwargs):
            return {"hits": {"hits": []}}
        def ping(self):
            return False

# If you need Elasticsearch
# from routes.common import es
from database.models import Company, Job, RoleType, Status, Tag, JobAttachment, Folder
from database.session import SessionLocal
from sqlalchemy.orm import Session
from config import ELASTICSEARCH_URL, UPLOAD_FOLDER
import werkzeug
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

# Initialize Elasticsearch client
es_client = None
if ELASTICSEARCH_URL and ELASTICSEARCH_URL.strip() != "":
    try:
        # Only attempt to connect if URL is provided
        logger.info(f"Attempting to connect to Elasticsearch at {ELASTICSEARCH_URL}")
        es_client = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=10)
        
        # Check if ES is actually responsive before trying to use it
        if es_client.ping():
            logger.info("Elasticsearch connection successful")
            # Create index if it doesn't exist
            if not es_client.indices.exists(index="jobs"):
                es_client.indices.create(index="jobs", body={
                    "mappings": {
                        "properties": {
                            "id": {"type": "integer"},
                            "title": {"type": "text"},
                            "company_name": {"type": "text"},
                            "status": {"type": "keyword"},
                            "role_type": {"type": "keyword"},
                            "posted_date": {"type": "date"},
                            "priority": {"type": "boolean"},
                            "archived": {"type": "boolean"},
                            "deleted": {"type": "boolean"},
                            "tags": {"type": "keyword"},
                            "created_at": {"type": "date"},
                            "updated_at": {"type": "date"}
                        }
                    }
                })
                logger.info("Created Elasticsearch 'jobs' index with mappings")
        else:
            logger.warning("Elasticsearch ping failed, disabling search functionality")
            es_client = None
    except Exception as e:
        logger.warning(f"Elasticsearch initialization error: {str(e)}")
        es_client = None
else:
    logger.info("Elasticsearch URL not configured, search functionality will be limited")
    es_client = None

def create_or_get_company(session: Session, company_name: str) -> Company:
    """Find or create a company by name."""
    if not company_name:
        raise ValueError("Company name is required")
    
    # Handle case where company_name is actually a dict with name field
    if isinstance(company_name, dict) and 'name' in company_name:
        company_name = company_name['name']
        
    company = session.query(Company).filter(
        func.lower(Company.name) == func.lower(company_name)
    ).first()
    
    if not company:
        company = Company(name=company_name)
        session.add(company)
        session.flush()
    
    return company

def create_or_get_tag(session: Session, tag_name: str) -> Tag:
    """Find or create a tag by name."""
    if not tag_name:
        raise ValueError("Tag name is required")
        
    tag = session.query(Tag).filter(
        func.lower(Tag.name) == func.lower(tag_name)
    ).first()
    
    if not tag:
        tag = Tag(name=tag_name)
        session.add(tag)
        session.flush()
    
    return tag

def create_or_get_folder(session: Session, folder_data: dict) -> Folder:
    """Find or create a folder by name."""
    if not folder_data.get("name"):
        raise ValueError("Folder name is required")
        
    folder = session.query(Folder).filter(
        func.lower(Folder.name) == func.lower(folder_data["name"])
    ).first()
    
    if not folder:
        folder = Folder(name=folder_data["name"])
        if "color" in folder_data:
            folder.color = folder_data["color"]
        session.add(folder)
        session.flush()
    elif "color" in folder_data and folder.color != folder_data["color"]:
        folder.color = folder_data["color"]
        
    return folder

def apply_job_data_to_model(job: Job, data: dict, session: SessionLocal):
    # Company
    if "company" in data and data["company"]:
        company_data = data["company"]
        
        # Handle both string and dict formats
        if isinstance(company_data, dict) and "name" in company_data:
            company_name = company_data["name"]
        else:
            company_name = company_data
            
        if company_name:
            company = create_or_get_company(session, company_name)
            job.company_id = company.id

    # Title
    if "title" in data:
        job.title = data["title"]

    # Role Type
    if "role_type" in data:
        job.role_type = RoleType(data["role_type"])  # e.g. 'intern', 'newgrad'

    # Status (accept either status string or statusIndex)
    if "status" in data:
        job.status = Status(data["status"])
    elif "statusIndex" in data:
        status_index = int(data["statusIndex"])
        statuses = list(Status)
        if 0 <= status_index < len(statuses):
            job.status = statuses[status_index]

    # Posted date
    if "postedDate" in data and data["postedDate"]:
        for date_format in ("%d.%m.%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
            try:
                job.posted_date = datetime.strptime(data["postedDate"], date_format)
                break
            except ValueError:
                pass

    # Link
    if "link" in data:
        job.link = data["link"]

    # Priority, Archived, Deleted
    if "priority" in data:
        job.priority = bool(data["priority"])
    if "archived" in data:
        job.archived = bool(data["archived"])
    if "deleted" in data:
        job.deleted = bool(data["deleted"])

    # ATS score
    if "atsScore" in data:
        try:
            job.ats_score = float(data["atsScore"])
        except (TypeError, ValueError):
            logger.warning(f"Invalid ats_score value: {data['atsScore']}")

    # Tags
    if "tags" in data and isinstance(data["tags"], list):
        job.tags.clear()
        for tag_name in data["tags"]:
            t = create_or_get_tag(session, tag_name)
            job.tags.append(t)
            
    # Folders
    if "folders" in data and isinstance(data["folders"], list):
        job.folders.clear()
        for folder_data in data["folders"]:
            if isinstance(folder_data, str):
                folder_data = {"name": folder_data}
            f = create_or_get_folder(session, folder_data)
            job.folders.append(f)
            
    # Notes
    if "notes" in data:
        job.notes = data["notes"]

def serialize_job(job: Job) -> dict:
    try:
        ats_score = job.ats_score
    except:
        ats_score = 0

    try:
        status_index = list(Status).index(job.status)
    except:
        status_index = 0

    result = {
        "id": job.id,
        "company": job.company.name if job.company else "",
        "title": job.title,
        "role_type": job.role_type.value,
        "postedDate": job.posted_date.strftime("%d.%m.%Y") if job.posted_date else "",
        "link": job.link or "",
        "statusIndex": status_index,
        "status": job.status.value,
        "priority": job.priority,
        "archived": job.archived,
        "deleted": job.deleted,
        "atsScore": ats_score,
        "tags": [t.name for t in job.tags],
        "folders": [{"id": f.id, "name": f.name, "color": f.color} for f in job.folders],
        "notes": job.notes or "",
    }

    if getattr(job, 'created_at', None):
        result["created_at"] = job.created_at.isoformat()
    if getattr(job, 'updated_at', None):
        result["updated_at"] = job.updated_at.isoformat()

    return result

def get_job_by_id(session: Session, job_id: int) -> Optional[Job]:
    """Get a job by its ID, excluding deleted jobs."""
    return session.query(Job).filter(
        and_(Job.id == job_id, Job.deleted == False)
    ).first()

def get_job_with_relations(session: Session, job_id: int) -> Optional[Job]:
    """Get a job with eager-loaded relationships."""
    return session.query(Job).options(
        # Eager load related entities
    ).filter(
        and_(Job.id == job_id, Job.deleted == False)
    ).first()

def index_job_to_es(job: Job, session: Session) -> bool:
    """Index a job to Elasticsearch."""
    if not es_client:
        # Skip silently if ES is not configured 
        return False
        
    try:
        # Ensure job has relationships loaded
        if not job.company:
            session.refresh(job)
            
        doc = {
            "id": job.id,
            "title": job.title,
            "company_name": job.company.name if job.company else None,
            "status": job.status.value if job.status else None,
            "role_type": job.role_type.value if job.role_type else None,
            "posted_date": job.posted_date.isoformat() if job.posted_date else None,
            "priority": job.priority,
            "archived": job.archived,
            "deleted": job.deleted,
            "tags": [tag.name for tag in job.tags],
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None
        }
        
        es_client.index(index="jobs", id=job.id, body=doc)
        logger.debug(f"Indexed job {job.id} to Elasticsearch")
        return True
    except Exception as e:
        logger.error(f"Error indexing job {job.id} to Elasticsearch: {str(e)}")
        return False

def remove_job_from_es(job: Job) -> bool:
    """Remove a job from Elasticsearch."""
    if not es_client:
        # Skip silently if ES is not configured
        return False
        
    try:
        es_client.delete(index="jobs", id=job.id)
        logger.debug(f"Removed job {job.id} from Elasticsearch")
        return True
    except Exception as e:
        logger.error(f"Error removing job {job.id} from Elasticsearch: {str(e)}")
        return False

def search_jobs_by_query(query: str, size: int = 20) -> List[Dict[str, Any]]:
    """Search jobs in Elasticsearch by query."""
    if not es_client or not query:
        logger.info("Elasticsearch not available or empty query, returning empty results")
        return []
        
    try:
        logger.info(f"Searching ES for: {query}")
        results = es_client.search(index="jobs", body={
            "query": {
                "bool": {
                    "must": [
                        {"multi_match": {
                            "query": query,
                            "fields": ["title", "company_name", "tags"],
                            "fuzziness": "AUTO"
                        }}
                    ],
                    "must_not": [
                        {"term": {"deleted": True}}
                    ]
                }
            },
            "size": size
        })
        
        hits = results.get("hits", {}).get("hits", [])
        logger.info(f"Found {len(hits)} results in Elasticsearch")
        return [hit["_source"] for hit in hits]
    except Exception as e:
        logger.error(f"Error searching Elasticsearch: {str(e)}")
        return []

def build_job_query(
    session: Session,
    show_archived: bool = False,
    show_priority: bool = False,
    filter_not_applied: bool = False,
    filter_within_week: bool = False,
    filter_intern: bool = False,
    filter_newgrad: bool = False,
    search_query: str = None
) -> Any:
    """
    Builds the base SQLAlchemy query for jobs with common filters.
    Returns the query object.
    """
    
    # Start with base query, joining Company
    query = session.query(Job).options(joinedload(Job.company))
    
    # Always exclude deleted jobs unless specifically requested
    query = query.filter(Job.deleted == False)
    
    # Filter by archived status
    if not show_archived:
        query = query.filter(Job.archived == False)
    
    # Filter by priority status
    if show_priority:
        query = query.filter(Job.priority == True)
    
    # Filter: Only show jobs that are "Nothing Done"
    if filter_not_applied:
        query = query.filter(Job.status == Status.nothing_done)
        
    # Filter: Only show jobs posted within the last week
    if filter_within_week:
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        # Ensure posted_date is not null before comparing
        query = query.filter(and_(Job.posted_date != None, Job.posted_date >= one_week_ago))
        
    # Filter: Only show Internships (case-insensitive check on role_type)
    if filter_intern:
        query = query.filter(Job.role_type == RoleType.intern)
        
    # Filter: Only show New Grad (case-insensitive check on role_type)
    if filter_newgrad:
        query = query.filter(Job.role_type == RoleType.newgrad)
        
    # Handle search query using Elasticsearch if available, otherwise basic title/company search
    if search_query:
        if es_client:
            try:
                es_query = {
                    "bool": {
                        "should": [
                            {"match": {"title": {"query": search_query, "boost": 2}}},
                            {"match": {"company_name": {"query": search_query, "boost": 1}}},
                            {"term": {"tags": {"value": search_query, "boost": 0.5}}}
                        ],
                        "filter": [
                            # Add existing boolean filters to ES query as well
                            {"term": {"deleted": False}},
                            {"term": {"archived": False}} if not show_archived else None,
                            {"term": {"priority": True}} if show_priority else None,
                            {"term": {"status": "nothing_done"}} if filter_not_applied else None,
                            {"range": {"posted_date": {"gte": (datetime.utcnow() - timedelta(days=7)).isoformat()}}} if filter_within_week else None,
                            {"term": {"role_type": "intern"}} if filter_intern else None,
                            {"term": {"role_type": "newgrad"}} if filter_newgrad else None,
                        ]
                    }
                }
                # Remove None filters
                es_query["bool"]["filter"] = [f for f in es_query["bool"]["filter"] if f is not None]
                
                results = es_client.search(index="jobs", query=es_query, size=500) # Limit ES results
                job_ids = [hit['_source']['id'] for hit in results['hits']['hits']]
                
                if not job_ids:
                    # No ES results, return a query that yields nothing
                    query = query.filter(False)
                else:
                    # Filter the SQLAlchemy query by the job IDs found in ES
                    query = query.filter(Job.id.in_(job_ids))
                    
            except Exception as e:
                logger.error(f"Elasticsearch search failed: {e}")
                # Fallback to basic search on error
                query = query.filter(
                    or_(
                        Job.title.ilike(f"%{search_query}%"),
                        Company.name.ilike(f"%{search_query}%")
                    )
                )
        else:
            # Basic search if Elasticsearch is not available
            query = query.filter(
                or_(
                    Job.title.ilike(f"%{search_query}%"),
                    Company.name.ilike(f"%{search_query}%")
            )
        )
    
    return query

def sort_job_query(
    query: Any,
    sort_by: str = "date",
    sort_direction: str = "desc"
) -> Any:
    """Apply sorting to a job query."""
    logger.info(f"Sorting jobs by {sort_by} in {sort_direction} order")
    
    try:
        if sort_by == "date":
            order_field = Job.posted_date
        elif sort_by == "company":
            query = query.join(Job.company)
            order_field = Company.name
        elif sort_by == "status":
            # For debugging purposes, log the status enum values
            logger.info(f"Status enum values: {[status.value for status in Status]}")
            
            # Create a simpler case statement that directly maps enum values to integers
            whens = []
            whens.append((Job.status == Status.nothing_done, 1))
            whens.append((Job.status == Status.applying, 2))
            whens.append((Job.status == Status.applied, 3))
            whens.append((Job.status == Status.oa, 4))
            whens.append((Job.status == Status.interview, 5))
            whens.append((Job.status == Status.offer, 6))
            whens.append((Job.status == Status.rejected, 7))
            
            status_order = case(whens, else_=99)
            
            logger.info("Created status ordering expression")
            
            if sort_direction == "asc":
                query = query.order_by(status_order.asc())
            else:
                query = query.order_by(status_order.desc())
            
            # Return early as we've already applied ordering
            return query
        else:
            # Default to date
            logger.info(f"Unknown sort_by value: {sort_by}, using date as default")
            order_field = Job.posted_date
        
        if sort_direction == "asc":
            query = query.order_by(order_field.asc())
        else:
            query = query.order_by(order_field.desc())
        
        return query
    except Exception as e:
        # If there's an error, log it and fall back to sorting by ID
        logger.error(f"Error in sort_job_query: {str(e)}")
        # Return a simple sort by ID as a fallback
        return query.order_by(Job.id.desc() if sort_direction == "desc" else Job.id.asc())

def get_status_counts(session: Session, filter_deleted: bool = True, include_archived: bool = False) -> Dict[str, int]:
    """Get counts of jobs by status.
    
    Args:
        session: Database session
        filter_deleted: Whether to exclude deleted jobs
        include_archived: Whether to include archived jobs in the counts
    
    Returns:
        Dictionary with status counts
    """
    filters = []
    if filter_deleted:
        filters.append(Job.deleted == False)
    
    # Exclude archived jobs unless specifically requested
    if not include_archived:
        filters.append(Job.archived == False)
    
    # Use SQLAlchemy's func.count and group by
    results = session.query(
        Job.status, 
        func.count(Job.id)
    ).filter(
        *filters
    ).group_by(
        Job.status
    ).all()
    
    # Initialize counts with zeros
    counts = {status.value: 0 for status in Status}
    
    # Update with actual counts
    for status, count in results:
        counts[status.value] = count
    
    return counts

def handle_attachment_upload(
    file: werkzeug.datastructures.FileStorage, 
    job_id: int, 
    attachment_type: str
) -> Optional[JobAttachment]:
    """
    Handle file upload for job attachments.
    
    Args:
        file: The uploaded file
        job_id: ID of the job this attachment belongs to
        attachment_type: Type of attachment (resume, cover_letter, etc.)
        
    Returns:
        JobAttachment model if successful, None otherwise
    """
    if not file:
        return None
        
    try:
        # Ensure upload directory exists
        upload_dir = os.path.join(UPLOAD_FOLDER, f"job_{job_id}")
        Path(upload_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        original_filename = file.filename
        filename = f"{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        file.save(file_path)
        
        # Create and return attachment record
        attachment = JobAttachment(
            job_id=job_id,
            filename=original_filename,
            content_type=file.content_type,
            file_path=file_path,
            attachment_type=attachment_type
        )
        
        return attachment
    except Exception as e:
        logger.error(f"Error handling attachment upload: {str(e)}")
        return None

# --- Elasticsearch stuff, if you want to keep it ---
# def index_job_to_es(job: Job, session: SessionLocal):
#     if not es:
#         logger.warning("Elasticsearch not available")
#         return
#     # ...
#
# def remove_job_from_es(job: Job):
#     if not es:
#         logger.warning("Elasticsearch not available")
#         return
#     # ...
#
# def search_jobs_in_es(query: str) -> List[int]:
#     if not es:
#         logger.warning("Elasticsearch not available")
#         return []
#     # ...
