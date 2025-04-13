import os
import logging
import logging.handlers
from flask import has_request_context, request

# Get environment variables
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
DEBUG_MODE = os.environ.get("FLASK_DEBUG", "0") == "1"

# Map string log level to logging constants
LOG_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL
}

# Use DEBUG level if in debug mode, otherwise use the specified level
EFFECTIVE_LOG_LEVEL = logging.DEBUG if DEBUG_MODE else LOG_LEVEL_MAP.get(LOG_LEVEL, logging.INFO)

class RequestFormatter(logging.Formatter):
    """Custom formatter that includes request info when available"""
    
    def format(self, record):
        if has_request_context():
            record.url = request.url
            record.remote_addr = request.remote_addr
            record.method = request.method
        else:
            record.url = None
            record.remote_addr = None
            record.method = None
            
        return super().format(record)

def setup_logging():
    """Configure logging for the application"""
    # Clear any existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Set up the formatter
    if DEBUG_MODE:
        formatter = RequestFormatter(
            '[%(asctime)s] %(levelname)s - %(remote_addr)s - %(method)s %(url)s - %(name)s: %(message)s'
        )
    else:
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s: %(message)s')
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Optional file handler for production
    if not DEBUG_MODE:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, 'jobflow.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.WARNING)  # Log WARNING and above to file
        root_logger.addHandler(file_handler)
    
    # Configure root logger
    root_logger.setLevel(EFFECTIVE_LOG_LEVEL)
    root_logger.addHandler(console_handler)
    
    # Set SQLAlchemy logging to WARNING level to reduce noise
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    # Return the effective log level for reporting
    return EFFECTIVE_LOG_LEVEL

def get_logger(name):
    """Get a logger with the specified name"""
    return logging.getLogger(name) 