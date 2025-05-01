from flask import Blueprint, request, jsonify, send_file, Response
import uuid
import base64
from datetime import datetime
import io
import markdown
import tempfile
import os
import json
from app.config import db
from app.models import Job, Company, Status, JobAttachment

try:
    import pdfkit

    PDF_ENABLED = True
except ImportError:
    PDF_ENABLED = False
    print("Warning: pdfkit not installed, PDF generation will be disabled")

applications_bp = Blueprint("applications", __name__)

GOOGLE_APP_ID = "b4e5c44c-af30-4d5f-ac20-68b3c76cc0af"
MICROSOFT_APP_ID = "6630c927-2bf7-4e91-a12f-55e6320859e8"

MOCK_APPLICATIONS = [
    {
        "id": GOOGLE_APP_ID,
        "company": "Google",
        "jobTitle": "Software Engineer",
        "status": "completed",
        "atsScore": 85,
        "createdAt": datetime(2023, 4, 15).isoformat(),
        "documents": [
            {"type": "resume", "fileName": "resume.pdf"},
            {"type": "cover_letter", "fileName": "cover_letter.pdf"},
        ],
    },
    {
        "id": MICROSOFT_APP_ID,
        "company": "Microsoft",
        "jobTitle": "Full Stack Developer",
        "status": "completed",
        "atsScore": 92,
        "createdAt": datetime(2023, 5, 10).isoformat(),
        "documents": [
            {"type": "resume", "fileName": "resume.pdf"},
            {"type": "cover_letter", "fileName": "cover_letter.pdf"},
        ],
    },
]

# Mock document content storage - in a real app, this would be in a database
DOCUMENT_CONTENT = {}


def markdown_to_html(md_content):
    """Convert markdown content to HTML"""
    # Use Python's markdown library to convert to HTML
    html = markdown.markdown(md_content, extensions=["extra"])

    # Add basic styling
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 2em;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            h1 {{
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }}
            ul, ol {{
                padding-left: 20px;
            }}
            li {{
                margin: 5px 0;
            }}
            p {{
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        {html}
    </body>
    </html>
    """
    return styled_html


def convert_to_pdf(html_content):
    """Convert HTML to PDF"""
    if not PDF_ENABLED:
        return None

    # Convert HTML to PDF
    pdf = pdfkit.from_string(html_content, False)
    return pdf


# Initialize document content for existing applications
def initialize_document_content():
    # Google application resume
    google_resume = f"""# Resume for Software Engineer at Google

## Professional Summary
Experienced software engineer with a track record of success in development roles, 
seeking to leverage my skills and experience at Google.

## Skills
- Software Development
- Problem Solving
- Team Collaboration
- Project Management
- Communication

## Experience
### Senior Developer
XYZ Company | 2018 - Present
- Led development of key projects increasing revenue by 25%
- Mentored junior developers and implemented best practices

### Developer
ABC Tech | 2015 - 2018
- Developed and maintained web applications
- Collaborated with cross-functional teams

## Education
Bachelor of Science in Computer Science
University of Technology | 2011 - 2015
"""

    # Google application cover letter
    google_cover_letter = """# Cover Letter

April 15, 2023

Dear Hiring Manager at Google,

I am writing to express my interest in the Software Engineer position at Google. 
With my background and skills in this field, I believe I would be a valuable addition to your team.

Throughout my career, I have developed expertise in software development, problem-solving, 
and collaboration. I am particularly drawn to Google's innovative approach to 
technology and its commitment to excellence.

I look forward to the opportunity to discuss how my experience aligns with your needs 
for this position. Thank you for considering my application.

Sincerely,
John Doe
"""

    # Microsoft application resume
    microsoft_resume = f"""# Resume for Full Stack Developer at Microsoft

## Professional Summary
Experienced full stack developer with a track record of success in development roles, 
seeking to leverage my skills and experience at Microsoft.

## Skills
- Frontend Development
- Backend Development
- Cloud Infrastructure
- UI/UX Design
- Communication

## Experience
### Lead Developer
ABC Tech | 2017 - Present
- Led team of developers to build scalable web applications
- Implemented CI/CD pipelines resulting in 40% faster deployments

### Web Developer
XYZ Company | 2014 - 2017
- Developed responsive web applications
- Worked with SQL and NoSQL databases

## Education
Master of Science in Computer Science
University of Technology | 2012 - 2014
"""

    # Microsoft application cover letter
    microsoft_cover_letter = """# Cover Letter

May 10, 2023

Dear Hiring Manager at Microsoft,

I am writing to express my interest in the Full Stack Developer position at Microsoft. 
With my background and skills in both frontend and backend development, I believe I would be a valuable addition to your team.

Throughout my career, I have developed expertise in building scalable applications, implementing efficient databases, 
and creating intuitive user interfaces. I am particularly drawn to Microsoft's commitment to 
innovation and its impact on modern software development.

I look forward to the opportunity to discuss how my experience aligns with your needs 
for this position. Thank you for considering my application.

Sincerely,
John Doe
"""

    # Convert markdown to HTML for each document
    google_resume_html = markdown_to_html(google_resume)
    google_cover_letter_html = markdown_to_html(google_cover_letter)
    microsoft_resume_html = markdown_to_html(microsoft_resume)
    microsoft_cover_letter_html = markdown_to_html(microsoft_cover_letter)

    # Store document content
    DOCUMENT_CONTENT[f"{GOOGLE_APP_ID}_resume"] = {
        "content": google_resume,
        "content_type": "text/markdown",
        "raw_content": google_resume,
        "html_content": google_resume_html,
    }

    DOCUMENT_CONTENT[f"{GOOGLE_APP_ID}_cover_letter"] = {
        "content": google_cover_letter,
        "content_type": "text/markdown",
        "raw_content": google_cover_letter,
        "html_content": google_cover_letter_html,
    }

    DOCUMENT_CONTENT[f"{MICROSOFT_APP_ID}_resume"] = {
        "content": microsoft_resume,
        "content_type": "text/markdown",
        "raw_content": microsoft_resume,
        "html_content": microsoft_resume_html,
    }

    DOCUMENT_CONTENT[f"{MICROSOFT_APP_ID}_cover_letter"] = {
        "content": microsoft_cover_letter,
        "content_type": "text/markdown",
        "raw_content": microsoft_cover_letter,
        "html_content": microsoft_cover_letter_html,
    }


# Initialize document content
initialize_document_content()


@applications_bp.route("/applications", methods=["GET"])
def get_applications():
    """Get all applications"""
    return jsonify(MOCK_APPLICATIONS)


@applications_bp.route("/applications/<application_id>", methods=["GET"])
def get_application(application_id):
    """Get a specific application by ID"""
    for app in MOCK_APPLICATIONS:
        if app["id"] == application_id:
            return jsonify(app)
    return jsonify({"error": "Application not found"}), 404


@applications_bp.route(
    "/applications/<application_id>/documents/<document_type>", methods=["GET"]
)
def get_application_document(application_id, document_type):
    """Get a specific document for an application"""
    document_key = f"{application_id}_{document_type}"

    if document_key not in DOCUMENT_CONTENT:
        return jsonify({"error": "Document not found"}), 404

    document = DOCUMENT_CONTENT[document_key]
    format_param = request.args.get("format", "markdown")

    if format_param == "html":
        return Response(document["html_content"], mimetype="text/html")
    elif format_param == "pdf":
        if not PDF_ENABLED:
            return (
                jsonify({"error": "PDF generation is not enabled on this server"}),
                501,
            )

        pdf_content = convert_to_pdf(document["html_content"])
        if pdf_content:
            return Response(
                pdf_content,
                mimetype="application/pdf",
                headers={
                    "Content-Disposition": f"inline; filename={document_type}.pdf"
                },
            )
        else:
            return jsonify({"error": "Failed to generate PDF"}), 500
    else:  # Default to markdown
        return Response(document["raw_content"], mimetype="text/markdown")


@applications_bp.route(
    "/applications/<application_id>/documents/<document_type>", methods=["PUT"]
)
def update_application_document(application_id, document_type):
    """Update a specific document for an application"""
    document_key = f"{application_id}_{document_type}"

    if document_key not in DOCUMENT_CONTENT:
        return jsonify({"error": "Document not found"}), 404

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    if "content" not in data:
        return jsonify({"error": "Content is required"}), 400

    new_content = data["content"]

    # Update the document content
    DOCUMENT_CONTENT[document_key]["content"] = new_content
    DOCUMENT_CONTENT[document_key]["raw_content"] = new_content
    DOCUMENT_CONTENT[document_key]["html_content"] = markdown_to_html(new_content)

    return jsonify({"success": True})


@applications_bp.route("/applications/<application_id>/generate", methods=["POST"])
def generate_application_documents(application_id):
    """Generate documents for an application"""
    # Find the application
    application = None
    for app in MOCK_APPLICATIONS:
        if app["id"] == application_id:
            application = app
            break

    if not application:
        return jsonify({"error": "Application not found"}), 404

    # In a real app, this would call a service to generate the documents
    # For this demo, we'll just use some sample data

    # Generate or update resume
    resume_key = f"{application_id}_resume"
    resume_content = f"""# Resume for {application['jobTitle']} at {application['company']}

## Professional Summary
Experienced software professional with a proven track record of success.

## Skills
- Web Development
- Problem Solving
- Technical Leadership
- Agile Methodologies

## Experience
### Senior Developer
XYZ Corp | 2018 - Present
- Led development of key projects
- Mentored junior developers

### Developer
ABC Inc | 2015 - 2018
- Developed and maintained applications
- Collaborated with cross-functional teams

## Education
Bachelor of Science in Computer Science
University of Technology | 2011 - 2015
"""

    # Generate or update cover letter
    cover_letter_key = f"{application_id}_cover_letter"
    cover_letter_content = f"""# Cover Letter

{datetime.now().strftime("%B %d, %Y")}

Dear Hiring Manager at {application['company']},

I am writing to express my interest in the {application['jobTitle']} position at {application['company']}. With my background and skills in this field, I believe I would be a valuable addition to your team.

Throughout my career, I have developed expertise in software development, problem-solving, and collaboration. I am particularly drawn to {application['company']}'s reputation for innovation and excellence.

I look forward to the opportunity to discuss how my experience aligns with your needs for this position. Thank you for considering my application.

Sincerely,
John Doe
"""

    # Update the document content store
    DOCUMENT_CONTENT[resume_key] = {
        "content": resume_content,
        "content_type": "text/markdown",
        "raw_content": resume_content,
        "html_content": markdown_to_html(resume_content),
    }

    DOCUMENT_CONTENT[cover_letter_key] = {
        "content": cover_letter_content,
        "content_type": "text/markdown",
        "raw_content": cover_letter_content,
        "html_content": markdown_to_html(cover_letter_content),
    }

    # Update the application status
    for app in MOCK_APPLICATIONS:
        if app["id"] == application_id:
            app["status"] = "completed"
            break

    return jsonify({"success": True, "message": "Documents generated successfully"})
