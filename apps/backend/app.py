from flask import Flask
from flask_graphql import GraphQLView
from database.models import Base
from database.session import engine, SessionLocal
from graphql_api.schema import schema
from cron import start_cron

app = Flask(__name__)

# Create tables on first run
@app.before_first_request
def setup_database():
    Base.metadata.create_all(bind=engine)

@app.route("/")
def health_check():
    return "✅ Job Tracker Backend is Running"

# GraphQL endpoint with GraphiQL
app.add_url_rule(
    "/graphql",
    view_func=GraphQLView.as_view(
        "graphql",
        schema=schema,
        graphiql=True,
        get_context=lambda: {"session": SessionLocal()}
    )
)

if __name__ == "__main__":
    start_cron()  # Start scheduled scraper
    app.run(host="0.0.0.0", port=5000, debug=True)
