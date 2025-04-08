from sqlalchemy import Table, Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship, declarative_base
import enum

Base = declarative_base()

class RoleType(enum.Enum):
    intern = "intern"
    newgrad = "newgrad"

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
    Base.metadata,
    Column("job_id", ForeignKey("jobs.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True)
)

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    blacklisted = Column(Boolean, default=False)
    follower_count = Column(Integer, default=0)

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", backref="jobs")
    title = Column(String, nullable=False)
    role_type = Column(Enum(RoleType), nullable=False)
    posted_date = Column(DateTime, server_default=func.now())
    link = Column(String)
    status = Column(Enum(Status), nullable=False, default=Status.nothing_done)
    priority = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    deleted = Column(Boolean, default=False)
    tags = relationship("Tag", secondary=job_tags_table, backref="jobs")
