import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from database.models import Job as JobModel
from database.session import SessionLocal

class Job(SQLAlchemyObjectType):
    class Meta:
        model = JobModel
        interfaces = (graphene.relay.Node, )

class Query(graphene.ObjectType):
    all_jobs = graphene.List(Job, page=graphene.Int(), per_page=graphene.Int())

    def resolve_all_jobs(self, info, page=1, per_page=4):
        session = SessionLocal()
        query = session.query(JobModel)
        total_jobs = query.count()
        jobs = query.offset((page - 1) * per_page).limit(per_page).all()
        session.close()
        return jobs
