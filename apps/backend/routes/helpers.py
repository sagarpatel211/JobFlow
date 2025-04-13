import logging
import os
import uuid
from pathlib import Path
from typing import Optional
import werkzeug
from config import UPLOAD_FOLDER
from database.models import JobAttachment

logger = logging.getLogger(__name__)

def handle_attachment_upload(
    file: werkzeug.datastructures.FileStorage, 
    job_id: int, 
    attachment_type: str
) -> Optional[JobAttachment]:
    """
    Handle file upload for job attachments.
    
    Args:
        file: The uploaded file
        job_id: ID of the job this attachment belongs to
        attachment_type: Type of attachment (resume, cover_letter, etc.)
        
    Returns:
        JobAttachment model if successful, None otherwise
    """
    if not file:
        return None
        
    try:
        # Ensure upload directory exists
        upload_dir = os.path.join(UPLOAD_FOLDER, f"job_{job_id}")
        Path(upload_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        original_filename = file.filename
        filename = f"{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        file.save(file_path)
        
        # Create and return attachment record
        attachment = JobAttachment(
            job_id=job_id,
            filename=original_filename,
            content_type=file.content_type,
            file_path=file_path,
            attachment_type=attachment_type
        )
        
        return attachment
    except Exception as e:
        logger.error(f"Error handling attachment upload: {str(e)}")
        return None

def parse_boolean_param(param, default=False):
    """Parse a string parameter as a boolean."""
    if param is None:
        return default
    return param.lower() in ('true', 'yes', '1', 't', 'y')

def parse_int_param(param, default=0, min_value=None, max_value=None):
    """Parse a string parameter as an integer with bounds checking."""
    try:
        value = int(param)
        if min_value is not None and value < min_value:
            return min_value
        if max_value is not None and value > max_value:
            return max_value
        return value
    except (TypeError, ValueError):
        return default 