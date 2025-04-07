from sqlalchemy import Column, Integer, String, ForeignKey, Table, Boolean, DateTime
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

job_tags = Table('job_tags', Base.metadata,
    Column('job_id', Integer, ForeignKey('jobs.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Company(Base):
    __tablename__ = 'companies'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    jobs = relationship('Job', back_populates='company')

class Status(Base):
    __tablename__ = 'statuses'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    jobs = relationship('Job', back_populates='status')

class Tag(Base):
    __tablename__ = 'tags'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    jobs = relationship('Job', secondary=job_tags, back_populates='tags')

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    posted_date = Column(DateTime, nullable=False)
    link = Column(String, nullable=False)
    priority = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey('companies.id'))
    status_id = Column(Integer, ForeignKey('statuses.id'))
    company = relationship('Company', back_populates='jobs')
    status = relationship('Status', back_populates='jobs')
    tags = relationship('Tag', secondary=job_tags, back_populates='jobs')
