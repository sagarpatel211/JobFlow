# app/models.py
import enum
from sqlalchemy import (
    Table, Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Text, Index, func
)
from sqlalchemy.orm import relationship
from .extensions import db

# Enums
class RoleType(enum.Enum):
    intern = "intern"
    newgrad = "newgrad"

class Status(enum.Enum):
    nothing_done = "nothing_done"
    applying = "applying"
    applied = "applied"
    oa = "OA"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"

# Association table for many-to-many relationship between jobs and tags
job_tags_table = Table(
    "job_tags",
    db.metadata,
    Column("job_id", ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_job_tags_job_id", "job_id"),
    Index("idx_job_tags_tag_id", "tag_id")
)

class Company(db.Model):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    blacklisted = Column(Boolean, default=False)
    follower_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    __table_args__ = (
        Index('idx_company_name', name),
        Index('idx_company_blacklisted', blacklisted),
    )

class Tag(db.Model):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (Index('idx_tag_name', name),)

class Job(db.Model):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    company = relationship("Company", backref="jobs")
    title = Column(String, nullable=False)
    role_type = Column(Enum(RoleType), nullable=False, default=RoleType.newgrad)
    posted_date = Column(DateTime, server_default=func.now())
    link = Column(String)
    status = Column(Enum(Status), nullable=False, default=Status.nothing_done)
    priority = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    deleted = Column(Boolean, default=False)
    ats_score = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    tags = relationship("Tag", secondary=job_tags_table, backref="jobs")
    attachments = relationship("JobAttachment", back_populates="job", cascade="all, delete-orphan")
    __table_args__ = (
        Index('idx_job_company_id', company_id),
        Index('idx_job_role_type', role_type),
        Index('idx_job_status', status),
        Index('idx_job_posted_date', posted_date),
        Index('idx_job_priority', priority),
        Index('idx_job_archived', archived),
        Index('idx_job_deleted', deleted),
        Index('idx_job_created_at', created_at),
    )

class JobAttachment(db.Model):
    __tablename__ = "job_attachments"
    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    job = relationship("Job", back_populates="attachments")
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    object_key = Column(String, nullable=False)  # MinIO object key
    attachment_type = Column(String, nullable=False)  # e.g., 'resume', 'cover_letter'
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    __table_args__ = (
        Index('idx_attachment_job_id', job_id),
        Index('idx_attachment_type', attachment_type),
    )
