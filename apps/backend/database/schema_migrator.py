import logging
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError, ProgrammingError

from database.session import engine
from database.models import JobAttachment, Folder

logger = logging.getLogger(__name__)

def add_column_if_missing(connection, table_name, column_name, column_defn):
    """Helper to add a column if it doesn't exist."""
    try:
        logger.info(f"Adding '{column_name}' column to {table_name} table")
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_defn}"))
        return True
    except (OperationalError, ProgrammingError) as e:
        logger.warning(f"Could not add {column_name} column: {str(e)}")
        return False

def create_indexes(connection):
    """Create indexes for better query performance."""
    indexes = [
        ("CREATE INDEX IF NOT EXISTS idx_job_company_id ON jobs (company_id)", "job company_id"),
        ("CREATE INDEX IF NOT EXISTS idx_job_role_type ON jobs (role_type)", "job role_type"),
        ("CREATE INDEX IF NOT EXISTS idx_job_status ON jobs (status)", "job status"),
        ("CREATE INDEX IF NOT EXISTS idx_job_posted_date ON jobs (posted_date)", "job posted_date"),
        ("CREATE INDEX IF NOT EXISTS idx_job_priority ON jobs (priority)", "job priority"),
        ("CREATE INDEX IF NOT EXISTS idx_job_archived ON jobs (archived)", "job archived"),
        ("CREATE INDEX IF NOT EXISTS idx_job_deleted ON jobs (deleted)", "job deleted"),
        ("CREATE INDEX IF NOT EXISTS idx_job_created_at ON jobs (created_at)", "job created_at"),
        ("CREATE INDEX IF NOT EXISTS idx_company_name ON companies (name)", "company name"),
        ("CREATE INDEX IF NOT EXISTS idx_company_blacklisted ON companies (blacklisted)", "company blacklisted"),
        ("CREATE INDEX IF NOT EXISTS idx_tag_name ON tags (name)", "tag name"),
        ("CREATE INDEX IF NOT EXISTS idx_folder_name ON folders (name)", "folder name"),
        ("CREATE INDEX IF NOT EXISTS idx_job_folders_job_id ON job_folders (job_id)", "job_folders job_id"),
        ("CREATE INDEX IF NOT EXISTS idx_job_folders_folder_id ON job_folders (folder_id)", "job_folders folder_id"),
    ]

    for sql, description in indexes:
        try:
            connection.execute(text(sql))
        except (OperationalError, ProgrammingError) as e:
            logger.warning(f"Could not create {description} index: {str(e)}")

def create_attachment_table_if_missing():
    """Create the job_attachments table if it doesn't exist."""
    inspector = inspect(engine)
    if "job_attachments" not in inspector.get_table_names():
        logger.info("Creating job_attachments table")
        try:
            JobAttachment.__table__.create(engine)
            return True
        except Exception as e:
            logger.warning(f"Could not create job_attachments table: {str(e)}")
            return False
    return True

def create_folder_table_if_missing():
    """Create the folders table and job_folders junction table if they don't exist."""
    inspector = inspect(engine)
    folder_created = True
    
    # Create folders table if it doesn't exist
    if "folders" not in inspector.get_table_names():
        logger.info("Creating folders table")
        try:
            # Create table directly using SQLAlchemy metadata
            Folder.__table__.create(engine)
        except Exception as e:
            logger.warning(f"Could not create folders table: {str(e)}")
            folder_created = False
    
    # Create job_folders table if it doesn't exist
    if "job_folders" not in inspector.get_table_names():
        logger.info("Creating job_folders junction table")
        try:
            # Use raw SQL since the junction table doesn't have a model class
            connection = engine.connect()
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS job_folders (
                    job_id INTEGER NOT NULL, 
                    folder_id INTEGER NOT NULL,
                    PRIMARY KEY (job_id, folder_id),
                    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                    FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
                )
            """))
            connection.close()
        except Exception as e:
            logger.warning(f"Could not create job_folders table: {str(e)}")
            folder_created = False
    
    return folder_created

def run_migration():
    try:
        inspector = inspect(engine)
        connection = engine.connect()
        transaction = connection.begin()

        try:
            if "jobs" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("jobs")]
                if "notes" not in columns:
                    add_column_if_missing(connection, "jobs", "notes", "TEXT")
                if "ats_score" not in columns:
                    add_column_if_missing(connection, "jobs", "ats_score", "FLOAT DEFAULT 0.0")

            # Create job_attachments table if needed
            create_attachment_table_if_missing()
            
            # Create folders and job_folders tables if needed
            create_folder_table_if_missing()

            # Add indexes for better query performance
            create_indexes(connection)

            # Commit the transaction
            transaction.commit()
            logger.info("Migration completed successfully")
            return True

        except Exception as e:
            transaction.rollback()
            logger.error(f"Error during migration, rolling back: {str(e)}")
            raise
        finally:
            connection.close()

    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")
        return False
