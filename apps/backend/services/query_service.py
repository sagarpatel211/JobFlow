import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy import and_, or_, func, select, case
from sqlalchemy.orm import Session
from database.models import Job, Company, Tag, Status, RoleType

logger = logging.getLogger(__name__)

def build_job_query(
    session: Session,
    show_archived: bool = False,
    show_priority: bool = False,
    filter_not_applied: bool = False,
    filter_within_week: bool = False,
    filter_intern: bool = False,
    filter_newgrad: bool = False,
    search_query: str = None
) -> Any:
    """Build a SQLAlchemy query with filters applied."""
    filters = [Job.deleted == False]
    
    if not show_archived:
        filters.append(Job.archived == False)
    
    if show_priority:
        filters.append(Job.priority == True)
    
    if filter_not_applied:
        # Only show jobs that are in 'nothing_done' or 'applying' status
        filters.append(
            or_(
                Job.status == Status.nothing_done,
                Job.status == Status.applying
            )
        )
    
    if filter_within_week:
        one_week_ago = datetime.now() - timedelta(days=7)
        filters.append(Job.posted_date >= one_week_ago)
    
    # Initialize base query
    query = session.query(Job).filter(and_(*filters))
    
    # Handle role filters (intern/newgrad)
    # We check both the role_type and tags
    role_filters = []
    
    if filter_intern:
        intern_jobs = query.join(Job.tags).filter(
            or_(
                Job.role_type == RoleType.intern,
                Tag.name.ilike('intern%')
            )
        ).subquery()
        role_filters.append(Job.id.in_(select([intern_jobs.c.id])))
    
    if filter_newgrad:
        newgrad_jobs = query.join(Job.tags).filter(
            or_(
                Job.role_type == RoleType.newgrad,
                Tag.name.ilike('newgrad%'),
                Tag.name.ilike('new grad%')
            )
        ).subquery()
        role_filters.append(Job.id.in_(select([newgrad_jobs.c.id])))
    
    if role_filters:
        query = query.filter(or_(*role_filters))
    
    if search_query:
        # Simple database search (fallback when Elasticsearch is not available)
        search_term = f"%{search_query}%"
        query = query.join(Job.company).filter(
            or_(
                Job.title.ilike(search_term),
                Company.name.ilike(search_term)
            )
        )
    
    return query

def sort_job_query(
    query: Any,
    sort_by: str = "date",
    sort_direction: str = "desc"
) -> Any:
    """Apply sorting to a job query."""
    logger.info(f"Sorting jobs by {sort_by} in {sort_direction} order")
    
    try:
        if sort_by == "date":
            order_field = Job.posted_date
        elif sort_by == "company":
            query = query.join(Job.company)
            order_field = Company.name
        elif sort_by == "status":
            # For debugging purposes, log the status enum values
            logger.info(f"Status enum values: {[status.value for status in Status]}")
            
            # Create a simpler case statement that directly maps enum values to integers
            whens = []
            whens.append((Job.status == Status.nothing_done, 1))
            whens.append((Job.status == Status.applying, 2))
            whens.append((Job.status == Status.applied, 3))
            whens.append((Job.status == Status.oa, 4))
            whens.append((Job.status == Status.interview, 5))
            whens.append((Job.status == Status.offer, 6))
            whens.append((Job.status == Status.rejected, 7))
            
            status_order = case(whens, else_=99)
            
            logger.info("Created status ordering expression")
            
            if sort_direction == "asc":
                query = query.order_by(status_order.asc())
            else:
                query = query.order_by(status_order.desc())
            
            # Return early as we've already applied ordering
            return query
        else:
            # Default to date
            logger.info(f"Unknown sort_by value: {sort_by}, using date as default")
            order_field = Job.posted_date
        
        if sort_direction == "asc":
            query = query.order_by(order_field.asc())
        else:
            query = query.order_by(order_field.desc())
        
        return query
    except Exception as e:
        # If there's an error, log it and fall back to sorting by ID
        logger.error(f"Error in sort_job_query: {str(e)}")
        # Return a simple sort by ID as a fallback
        return query.order_by(Job.id.desc() if sort_direction == "desc" else Job.id.asc())

def get_status_counts(session: Session, filter_deleted: bool = True, include_archived: bool = False) -> Dict[str, int]:
    """Get counts of jobs by status.
    
    Args:
        session: Database session
        filter_deleted: Whether to exclude deleted jobs
        include_archived: Whether to include archived jobs in the counts
    
    Returns:
        Dictionary with status counts
    """
    filters = []
    if filter_deleted:
        filters.append(Job.deleted == False)
    
    # Exclude archived jobs unless specifically requested
    if not include_archived:
        filters.append(Job.archived == False)
    
    # Use SQLAlchemy's func.count and group by
    results = session.query(
        Job.status, 
        func.count(Job.id)
    ).filter(
        *filters
    ).group_by(
        Job.status
    ).all()
    
    # Initialize counts with zeros
    counts = {status.value: 0 for status in Status}
    
    # Update with actual counts
    for status, count in results:
        counts[status.value] = count
    
    return counts 