from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from ..config import db
from ..models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 409
    user = User(email=email, name=name)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"msg": "Email and password required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Bad credentials. Check your email and password."}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_onboarded": user.is_onboarded,
    })

@auth_bp.route("/onboard", methods=["PUT"])
@jwt_required()
def onboard():
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"msg": "Name required"}), 400
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    user.name = name
    user.is_onboarded = True
    db.session.commit()
    return jsonify({"msg": "User onboarded"}), 200 