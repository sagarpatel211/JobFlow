# app/routes/companies.py
# pylint: disable=E1101
from flask import Blueprint, request, jsonify, current_app
from ..models import Company
from ..config import db
import os
from werkzeug.utils import secure_filename
import uuid
from ..utils.minio_client import upload_fileobj, get_minio_client
from ..utils.redis_client import get_cache, set_cache, delete_cache
from io import BytesIO
import json

companies_bp = Blueprint("companies", __name__)

# Allowed file extensions for company logos
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "svg"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@companies_bp.route("/logo/<int:company_id>", methods=["POST"])
def upload_company_logo(company_id):
    company = Company.query.get_or_404(company_id)

    if "logo" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400

    file = request.files["logo"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        # Generate a secure filename with a UUID to avoid collisions
        filename = secure_filename(file.filename)
        filename = f"{uuid.uuid4()}_{filename}"
        bucket_name = "company-logos"
        object_name = f"logos/{company.name}/{filename}"
        try:
            # Upload file stream directly to Minio
            data = file.read()
            upload_fileobj(
                bucket_name, object_name, BytesIO(data), len(data), file.content_type
            )
            # Create a presigned URL for client access
            minio_client = get_minio_client()
            image_url = minio_client.presigned_get_object(
                bucket_name, object_name, expires=3600
            )
            # Update company record
            company.image_url = image_url
            db.session.commit()
            return jsonify({"success": True, "image_url": image_url})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({"success": False, "error": "File type not allowed"}), 400


@companies_bp.route("/<int:company_id>", methods=["GET"])
def get_company(company_id):
    cache_key = f"company:{company_id}"
    cached = get_cache(cache_key)
    if cached:
        return jsonify(cached)
    company = Company.query.get_or_404(company_id)
    data = {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name,
            "blacklisted": company.blacklisted,
            "follower_count": company.follower_count,
            "image_url": company.image_url,
        },
    }
    # Cache for 5 minutes
    set_cache(cache_key, data, 300)
    return jsonify(data)


@companies_bp.route("/whitelist/<string:company>", methods=["PUT"])
def whitelist_company(company):
    comp = Company.query.filter_by(name=company).first()
    if not comp:
        return jsonify({"success": False, "error": "Company not found"}), 404
    comp.blacklisted = False
    db.session.commit()
    delete_cache(f"company:{comp.id}")
    return jsonify({"success": True})


@companies_bp.route("/blacklist/<string:company>", methods=["PUT"])
def blacklist_company(company):
    comp = Company.query.filter_by(name=company).first()
    if not comp:
        return jsonify({"success": False, "error": "Company not found"}), 404
    comp.blacklisted = True
    db.session.commit()
    delete_cache(f"company:{comp.id}")
    return jsonify({"success": True})


@companies_bp.route("/followers/<string:company>", methods=["PUT"])
def update_followers(company):
    data = request.get_json() or {}
    followers = data.get("followers", 0)
    comp = Company.query.filter_by(name=company).first()
    if not comp:
        return jsonify({"success": False, "error": "Company not found"}), 404
    comp.follower_count = followers
    db.session.commit()
    delete_cache(f"company:{comp.id}")
    return jsonify({"success": True})
