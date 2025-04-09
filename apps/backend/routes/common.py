"""
Common utilities for routes.
"""
import logging
from typing import Dict, Any, Optional, Generator
import math
from config import ELASTICSEARCH_URL
from elasticsearch import Elasticsearch
import contextlib
from sqlalchemy.orm import Session

from database.session import SessionLocal

logger = logging.getLogger(__name__)

# Elasticsearch client (if configured)
es = None
if ELASTICSEARCH_URL:
    try:
        es = Elasticsearch(hosts=[ELASTICSEARCH_URL], request_timeout=30)
        logger.info(f"Initialized Elasticsearch client: {ELASTICSEARCH_URL}")
    except Exception as e:
        logger.warning(f"Failed to initialize Elasticsearch: {str(e)}")

def get_health_info() -> Dict[str, Any]:
    """
    Get system health status.
    
    Returns:
        dict: Health status information
    """
    is_healthy = True
    
    # Check Elasticsearch if configured
    es_status = "not_configured"
    if ELASTICSEARCH_URL:
        try:
            if es and es.ping():
                cluster_health = es.cluster.health()
                es_status = cluster_health.get("status", "unknown")
                # If ES is yellow or red, but still responding, we're degraded but not unhealthy
                if es_status == "red":
                    is_healthy = False
            else:
                es_status = "not_responding"
                is_healthy = False
        except Exception as e:
            logger.warning(f"Elasticsearch health check failed: {str(e)}")
            es_status = "error"
            is_healthy = False

    return {
        "isHealthy": is_healthy,
        "components": {
            "elasticsearch": es_status
        }
    }

def get_pagination_info(total_items: int, page: int, per_page: int) -> Dict[str, Any]:
    total_pages = max(1, math.ceil(total_items / per_page))
    page = max(1, min(page, total_pages))

    return {
        "totalJobs": total_items,
        "currentPage": page,
        "itemsPerPage": per_page,
        "totalPages": total_pages,
    }

# def check_elasticsearch_connection() -> bool:
#     if not es:
#         return False
#     try:
#         health = es.cluster.health()
#         return health["status"] in ["green", "yellow"]
#     except Exception:
#         return False

@contextlib.contextmanager
def db_session() -> Generator[Session, Any, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception(f"Database error: {str(e)}")
        raise
    finally:
        session.close()
