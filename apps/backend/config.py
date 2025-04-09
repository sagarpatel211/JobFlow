#!/usr/bin/env python3

import os
from dotenv import load_dotenv

load_dotenv('.env.local')

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

ELASTICSEARCH_URL = os.environ.get("ELASTICSEARCH_URL", "")
FOLDER_PATH = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.environ.get(
    "UPLOAD_FOLDER", os.path.join(
        FOLDER_PATH, "uploads"))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
