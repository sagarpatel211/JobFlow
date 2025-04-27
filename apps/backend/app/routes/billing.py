"""Handle billing and Stripe integration."""
import os
import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User

billing_bp = Blueprint("billing", __name__)

@billing_bp.before_app_request
# Ensure the Stripe API key is set on each request
def _set_stripe_key():
    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

@billing_bp.route("/create-checkout-session", methods=["POST"])
@jwt_required()
def create_checkout_session():
    data = request.get_json() or {}
    price_id = data.get("priceId")
    if not price_id:
        return jsonify({"error": "Missing priceId"}), 400
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    try:
        # determine base URL for success/cancel redirects
        domain_url = os.getenv("STRIPE_SUCCESS_DOMAIN", "http://localhost:3000")
        session = stripe.checkout.Session.create(
            customer_email=user.email,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{domain_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{domain_url}/billing",
        )
        return jsonify({"sessionId": session.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 