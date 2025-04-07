import graphene
from database.models import Job as JobModel
from database.session import SessionLocal

class CreateJob(graphene.Mutation):
    class Arguments:
        title = graphene.String(required=True)
        posted_date = graphene.DateTime(required=True)
        link = graphene.String(required=True)
        company_id = graphene.Int(required=True)
        status_id = graphene.Int(required=True)

    job = graphene.Field(lambda: Job)

    def mutate(self, info, title, posted_date, link, company_id, status_id):
        session = SessionLocal()
        job = JobModel(
            title=title,
            posted_date=posted_date,
            link=link,
            company_id=company_id,
            status_id=status_id
        )
        session.add(job)
        session.commit()
        session.refresh(job)
        session.close()
        return CreateJob(job=job)

class Mutation(graphene.ObjectType):
    create_job = CreateJob.Field()
