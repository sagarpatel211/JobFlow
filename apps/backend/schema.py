import graphene

class Query(graphene.ObjectType):
    hello = graphene.String(name=graphene.String(default_value="stranger"))

    def resolve_hello(self, info, name):
        return f"Hello {name}!"

class CreateJob(graphene.Mutation):
    class Arguments:
        company = graphene.String(required=True)
        title = graphene.String(required=True)
        # Add other fields as needed

    ok = graphene.Boolean()
    job_id = graphene.Int()

    def mutate(self, info, company, title):
        # Insert your logic here, e.g. insert into Postgres using SQLAlchemy
        # For now, just return dummy values
        return CreateJob(ok=True, job_id=1)

class Mutation(graphene.ObjectType):
    create_job = CreateJob.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
