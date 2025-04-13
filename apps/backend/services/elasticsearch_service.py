import logging
from typing import Optional, List, Dict, Any
from database.models import Job
from sqlalchemy.orm import Session
from config import ELASTICSEARCH_URL

logger = logging.getLogger(__name__)

# Initialize Elasticsearch client
es_client = None

try:
    from elasticsearch import Elasticsearch
    
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
except ImportError:
    logger.warning("Elasticsearch package not installed")
    es_client = None

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