import enum
from sqlalchemy import (
    Table,
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum,
    Float,
    Text,
    Index,
    func,
    Date,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from .config import db
from passlib.hash import bcrypt  # type: ignore
from datetime import date


class Status(enum.Enum):
    nothing_done = "nothing_done"
    applying = "applying"
    applied = "applied"
    oa = "oa"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


job_tags_table = Table(
    "job_tags",
    db.metadata,
    Column("job_id", ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_job_tags_job_id", "job_id"),
    Index("idx_job_tags_tag_id", "tag_id"),
)

# Add user-specific blacklist and whitelist association tables
user_blacklist_table = Table(
    "user_blacklisted_companies",
    db.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    ),
)

user_whitelist_table = Table(
    "user_whitelisted_companies",
    db.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Company(db.Model):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    blacklisted = Column(Boolean, default=False)
    follower_count = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_company_name", name),
        Index("idx_company_blacklisted", blacklisted),
    )


class Tag(db.Model):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    created_at = Column(DateTime, server_default=func.now())

    jobs = relationship(
        "Job",
        secondary=job_tags_table,
        back_populates="tags",
    )

    __table_args__ = (Index("idx_tag_name", name),)


class Job(db.Model):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    company = relationship("Company", backref="jobs")
    title = Column(String, nullable=False)
    posted_date = Column(DateTime, server_default=func.now())
    link = Column(String, index=True)
    status = Column(Enum(Status), nullable=False, default=Status.nothing_done)
    priority = Column(Boolean, default=False, index=True)
    archived = Column(Boolean, default=False, index=True)
    deleted = Column(Boolean, default=False, index=True)
    ats_score = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    tags = relationship(
        "Tag",
        secondary=job_tags_table,
        back_populates="jobs",
    )
    attachments = relationship(
        "JobAttachment", back_populates="job", cascade="all, delete-orphan"
    )


class JobAttachment(db.Model):
    __tablename__ = "job_attachments"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    job = relationship("Job", back_populates="attachments")
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    object_key = Column(String, nullable=False)
    attachment_type = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_attachment_job_id", job_id),
        Index("idx_attachment_type", attachment_type),
    )


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_onboarded = Column(Boolean, default=False)
    name = Column(String, nullable=True)
    preferred_email = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    university = Column(String, nullable=True)
    about_me = Column(Text, nullable=True)
    openai_api_key = Column(String, nullable=True)
    archive_duration = Column(String, default="A Month", nullable=False)
    delete_duration = Column(String, default="A Month", nullable=False)
    leetcode_enabled = Column(Boolean, default=False)
    behavioural_enabled = Column(Boolean, default=False)
    jobs_enabled = Column(Boolean, default=False)
    system_design_enabled = Column(Boolean, default=False)
    leetcode_goal = Column(Integer, default=0)
    behavioural_goal = Column(Integer, default=0)
    jobs_goal = Column(Integer, default=0)
    system_design_goal = Column(Integer, default=0)
    resume_url = Column(String, nullable=True)
    cover_letter_url = Column(String, nullable=True)
    transcript_url = Column(String, nullable=True)
    latex_url = Column(String, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    preferred_job_titles = Column(String, nullable=True)
    blacklisted_companies = relationship(
        "Company",
        secondary=user_blacklist_table,
        backref="users_blacklisting",
    )
    whitelisted_companies = relationship(
        "Company",
        secondary=user_whitelist_table,
        backref="users_whitelisting",
    )
    auto_apply = Column(Boolean, default=False)
    additional_notes = Column(Text, nullable=True)
    onboarding_step = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def set_password(self, password: str):
        self.password_hash = bcrypt.hash(password)

    def check_password(self, password: str) -> bool:
        return bcrypt.verify(password, self.password_hash)


class StatType(enum.Enum):
    leetcode = "leetcode"
    jobs_applied = "jobs_applied"
    behavioural = "behavioural"
    system_design = "system_design"


class DailyStat(db.Model):
    __tablename__ = "daily_stats"
    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    stat_type = Column(Enum(StatType), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    value = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "stat_type", "date", name="uq_user_stat_date"),
    )
