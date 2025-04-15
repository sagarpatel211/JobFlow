# app/utils/es_client.py
from elasticsearch import Elasticsearch
import os

def get_es_client():
    return Elasticsearch([os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")])
