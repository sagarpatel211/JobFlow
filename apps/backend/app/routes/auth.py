from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from ..config import db
from ..models import User, Company
from ..utils.minio_client import upload_fileobj
import os
import io

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
        return jsonify({"msg": "User email already used."}), 409
    user = User(email=email, name=name)
    user.set_password(password)
    db.session.add(user)  # type: ignore
    db.session.commit()  # type: ignore
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
        return jsonify({"msg": "Bad credentials. Please try again."}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    # retrieve user-specific company lists
    blacklisted_companies = [
        {"id": comp.id, "name": comp.name, "imageUrl": comp.image_url, "followerCount": comp.follower_count}
        for comp in user.blacklisted_companies
    ]
    whitelisted_companies = [
        {"id": comp.id, "name": comp.name, "imageUrl": comp.image_url, "followerCount": comp.follower_count}
        for comp in user.whitelisted_companies
    ]
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_onboarded": user.is_onboarded,
        "onboarding_step": user.onboarding_step,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "phoneNumber": user.phone_number,
        "address": user.address,
        # user settings fields
        "university": user.university,
        "aboutMe": user.about_me,
        "openAIKey": user.openai_api_key,
        "archiveDuration": user.archive_duration,
        "deleteDuration": user.delete_duration,
        "leetcodeEnabled": user.leetcode_enabled,
        "leetcodeGoal": user.leetcode_goal,
        "behaviouralEnabled": user.behavioural_enabled,
        "behaviouralGoal": user.behavioural_goal,
        "jobsEnabled": user.jobs_enabled,
        "jobsGoal": user.jobs_goal,
        "systemDesignEnabled": user.system_design_enabled,
        "systemDesignGoal": user.system_design_goal,
        "resumeUrl": user.resume_url,
        "coverLetterUrl": user.cover_letter_url,
        "transcriptUrl": user.transcript_url,
        "latexUrl": user.latex_url,
        "preferredJobTitles": user.preferred_job_titles,
        # return preferred companies as comma-separated names
        "preferredCompanies": ",".join([comp.name for comp in user.whitelisted_companies]),
        "blacklistedCompanies": blacklisted_companies,
        "whitelistedCompanies": whitelisted_companies,
        "autoApply": user.auto_apply,
        "additionalNotes": user.additional_notes,
        "preferredEmail": user.preferred_email,
        # URL for the user's profile picture
        "profilePicUrl": user.profile_pic_url,
    })

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    # Update personal information
    if "firstName" in data:
        user.first_name = data["firstName"]
    if "lastName" in data:
        user.last_name = data["lastName"]
    if "email" in data:
        user.email = data["email"]
    if "preferredEmail" in data:
        user.preferred_email = data["preferredEmail"]
    if "phoneNumber" in data:
        user.phone_number = data["phoneNumber"]
    if "address" in data:
        user.address = data["address"]
    # Update settings fields
    if "university" in data:
        user.university = data["university"]
    if "aboutMe" in data:
        user.about_me = data["aboutMe"]
    if "openAIKey" in data:
        user.openai_api_key = data["openAIKey"]
    if "archiveDuration" in data:
        user.archive_duration = data["archiveDuration"]
    if "deleteDuration" in data:
        user.delete_duration = data["deleteDuration"]
    # Update tracking preferences and clamp goals between 1 and 15
    if "leetcodeEnabled" in data:
        user.leetcode_enabled = data["leetcodeEnabled"]
    if "leetcodeGoal" in data:
        try:
            goal = int(data["leetcodeGoal"])
        except (TypeError, ValueError):
            goal = user.leetcode_goal
        user.leetcode_goal = max(1, min(15, goal))
    if "behaviouralEnabled" in data:
        user.behavioural_enabled = data["behaviouralEnabled"]
    if "behaviouralGoal" in data:
        try:
            goal = int(data["behaviouralGoal"])
        except (TypeError, ValueError):
            goal = user.behavioural_goal
        user.behavioural_goal = max(1, min(15, goal))
    if "jobsEnabled" in data:
        user.jobs_enabled = data["jobsEnabled"]
    if "jobsGoal" in data:
        try:
            goal = int(data["jobsGoal"])
        except (TypeError, ValueError):
            goal = user.jobs_goal
        user.jobs_goal = max(1, min(15, goal))
    if "systemDesignEnabled" in data:
        user.system_design_enabled = data["systemDesignEnabled"]
    if "systemDesignGoal" in data:
        try:
            goal = int(data["systemDesignGoal"])
        except (TypeError, ValueError):
            goal = user.system_design_goal
        user.system_design_goal = max(1, min(15, goal))
    db.session.commit()  # type: ignore
    return jsonify({"success": True}), 200

@auth_bp.route("/onboard", methods=["PUT"])
@jwt_required()
def onboard():
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    # determine which step we're saving
    step = data.get("step", user.onboarding_step or 1)
    # apply step-specific fields
    if step == 1:
        # personal & settings info
        user.first_name = data.get("firstName", user.first_name)
        user.last_name = data.get("lastName", user.last_name)
        user.phone_number = data.get("phoneNumber", user.phone_number)
        user.address = data.get("address", user.address)
        if "university" in data:
            user.university = data.get("university")
        if "aboutMe" in data:
            user.about_me = data.get("aboutMe")
        if "openAIKey" in data:
            user.openai_api_key = data.get("openAIKey")
        if "archiveDuration" in data:
            user.archive_duration = data.get("archiveDuration")
        if "deleteDuration" in data:
            user.delete_duration = data.get("deleteDuration")
    elif step == 2:
        # tracking preferences & clamp goals
        user.leetcode_enabled = data.get("leetcodeEnabled", user.leetcode_enabled)
        try:
            goal = int(data.get("leetcodeGoal", user.leetcode_goal))
        except (TypeError, ValueError):
            goal = user.leetcode_goal
        user.leetcode_goal = max(1, min(15, goal))
        user.behavioural_enabled = data.get("behaviouralEnabled", user.behavioural_enabled)
        try:
            goal = int(data.get("behaviouralGoal", user.behavioural_goal))
        except (TypeError, ValueError):
            goal = user.behavioural_goal
        user.behavioural_goal = max(1, min(15, goal))
        user.jobs_enabled = data.get("jobsEnabled", user.jobs_enabled)
        try:
            goal = int(data.get("jobsGoal", user.jobs_goal))
        except (TypeError, ValueError):
            goal = user.jobs_goal
        user.jobs_goal = max(1, min(15, goal))
        user.system_design_enabled = data.get("systemDesignEnabled", user.system_design_enabled)
        try:
            goal = int(data.get("systemDesignGoal", user.system_design_goal))
        except (TypeError, ValueError):
            goal = user.system_design_goal
        user.system_design_goal = max(1, min(15, goal))
    elif step == 3:
        # document URLs
        user.resume_url = data.get("resumeUrl", user.resume_url)
        user.cover_letter_url = data.get("coverLetterUrl", user.cover_letter_url)
        user.transcript_url = data.get("transcriptUrl", user.transcript_url)
        user.latex_url = data.get("latexUrl", user.latex_url)
    elif step == 4:
        # job automation preferences
        user.preferred_job_titles = data.get("preferredJobTitles", user.preferred_job_titles)
        # parse comma-separated company names into whitelisted_companies
        if "preferredCompanies" in data:
            names = [n.strip() for n in data.get("preferredCompanies", "").split(",") if n.strip()]
            companies = []
            for name in names:
                comp = Company.query.filter_by(name=name).first()
                if not comp:
                    comp = Company(name=name)
                    db.session.add(comp)
                    db.session.flush()
                companies.append(comp)
            user.whitelisted_companies = companies
        # update user-specific blacklist/whitelist if provided
        if "blacklistedCompanies" in data:
            user.blacklisted_companies = Company.query.filter(Company.id.in_(data.get("blacklistedCompanies", []))).all()
        if "whitelistedCompanies" in data:
            user.whitelisted_companies = Company.query.filter(Company.id.in_(data.get("whitelistedCompanies", []))).all()
        user.auto_apply = data.get("autoApply", user.auto_apply)
        user.additional_notes = data.get("additionalNotes", user.additional_notes)
    elif step == 5:
        # final step: ensure terms accepted and mark user onboarded
        if not data.get("termsAccepted"):
            return jsonify({"msg": "Terms must be accepted"}), 400
        user.is_onboarded = True
    # advance to next step if not yet complete
    if step < 5:
        user.onboarding_step = step + 1
    else:
        # keep at final step
        user.onboarding_step = 5
    db.session.commit()  # type: ignore
    return jsonify({"msg": "Onboard step saved", "onboarding_step": user.onboarding_step}), 200 

@auth_bp.route("/upload-document", methods=["POST"])
@jwt_required()
def upload_document():
    """
    Upload a document to Minio and save its URL in the user's profile.
    Expects multipart/form-data with 'file' and 'field'.
    """
    user_id = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({"msg": "No file provided"}), 400
    f = request.files['file']
    field = request.form.get('field')
    # allow uploading various user documents and profile picture
    allowed_fields = ['resume', 'coverLetter', 'transcript', 'latex', 'profilePic']
    if not field or field not in allowed_fields:
        return jsonify({"msg": "Invalid field"}), 400
    bucket = os.getenv('MINIO_BUCKET', 'job-attachments')
    object_key = f"{user_id}/{field}/{f.filename}"
    # Read file contents
    content = f.read()
    upload_fileobj(bucket, object_key, io.BytesIO(content), len(content), f.content_type)
    # Save URL or object key in user record
    user = User.query.get_or_404(user_id)
    if field == 'resume':
        user.resume_url = object_key
    elif field == 'coverLetter':
        user.cover_letter_url = object_key
    elif field == 'transcript':
        user.transcript_url = object_key
    elif field == 'latex':
        user.latex_url = object_key
    elif field == 'profilePic':
        # generate a public URL for profile picture
        from ..utils.minio_client import get_minio_client
        from datetime import timedelta
        client = get_minio_client()
        image_url = client.presigned_get_object(bucket, object_key, expires=timedelta(seconds=3600))
        user.profile_pic_url = image_url
    db.session.commit()  # type: ignore
    # Return the URL for the client to display
    url = user.profile_pic_url if field == 'profilePic' else object_key
    return jsonify({"url": url}), 200 