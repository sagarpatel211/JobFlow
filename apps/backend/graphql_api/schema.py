import graphene
from graphql_api.queries import Query
from graphql_api.mutations import Mutation

schema = graphene.Schema(query=Query, mutation=Mutation)
