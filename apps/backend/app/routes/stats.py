from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from ..config import db
from ..models import DailyStat, StatType

stats_bp = Blueprint("stats", __name__)

@stats_bp.route("", methods=["GET"])
@jwt_required()
def get_stats():
    """Retrieve today's statistics for the authenticated user."""
    user_id = int(get_jwt_identity())
    today = date.today()
    stats = DailyStat.query.filter_by(user_id=user_id, date=today).all()
    result = {stat.stat_type.value: stat.value for stat in stats}
    return jsonify(result), 200

@stats_bp.route("", methods=["POST"])
@jwt_required()
def set_stat():
    """Set or update a daily stat for the authenticated user, clamped between 1 and 10."""
    data = request.get_json() or {}
    stat_type = data.get('stat_type')
    value = data.get('value')
    if stat_type not in [e.value for e in StatType]:
        return jsonify({'msg': 'Invalid stat_type'}), 400
    try:
        value = int(value)
    except (TypeError, ValueError):
        return jsonify({'msg': 'Invalid value'}), 400
    # clamp between 0 and 10 (allow zero count)
    value = max(0, min(10, value))
    user_id = int(get_jwt_identity())
    today = date.today()
    stat = DailyStat.query.filter_by(user_id=user_id, stat_type=StatType(stat_type), date=today).first()
    if stat:
        stat.value = value
    else:
        stat = DailyStat(user_id=user_id, stat_type=StatType(stat_type), date=today, value=value)
        db.session.add(stat)
    db.session.commit()
    return jsonify({'stat_type': stat_type, 'value': value}), 200 