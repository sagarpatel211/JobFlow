# app/routes/health.py
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("", methods=["GET"])
def health_status():
    return jsonify({"isHealthy": True})
