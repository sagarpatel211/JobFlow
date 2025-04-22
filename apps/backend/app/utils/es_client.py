# app/utils/es_client.py
from elasticsearch import Elasticsearch
import os

def get_es_client():
    return Elasticsearch([os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")])

def search_jobs_fuzzy(search: str, page: int, per_page: int) -> tuple[list[int], list[float], int]:
    """
    Perform a fuzzy multi_match search on the jobs index and return (
    list of job IDs, list of scores, total number of hits).
    """
    es = get_es_client()
    body = {
        "from": (page - 1) * per_page,
        "size": per_page,
        "query": {
            "multi_match": {
                "query": search,
                "fields": ["title^3", "company^2", "tags", "notes"],
                "fuzziness": "AUTO"
            }
        }
    }
    res = es.search(index="jobs", body=body)
    # Extract total hits
    total = res["hits"]["total"]["value"] if isinstance(res["hits"]["total"], dict) else res["hits"]["total"]
    hits = res["hits"]["hits"]
    ids = [int(hit["_id"]) for hit in hits]
    scores = [hit.get("_score", 0.0) for hit in hits]
    return ids, scores, total
