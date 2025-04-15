# app/routes/companies.py
from flask import Blueprint, request, jsonify
from ..models import Company
from ..extensions import db

companies_bp = Blueprint("companies", __name__)

@companies_bp.route("/whitelist/<string:company>", methods=["PUT"])
def whitelist_company(company):
    comp = Company.query.filter_by(name=company).first()
    if not comp:
        return jsonify({"success": False, "error": "Company not found"}), 404
    comp.blacklisted = False
    db.session.commit()
    return jsonify({"success": True})

@companies_bp.route("/blacklist/<string:company>", methods=["PUT"])
def blacklist_company(company):
    comp = Company.query.filter_by(name=company).first()
    if not comp:
        return jsonify({"success": False, "error": "Company not found"}), 404
    comp.blacklisted = True
    db.session.commit()
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
    return jsonify({"success": True})
