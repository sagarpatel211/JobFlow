from diagrams import Cluster, Diagram, Edge
from diagrams.aws.network import CloudFront
from diagrams.aws.database import RDS, ElastiCache
from diagrams.onprem.container import Docker
from diagrams.onprem.queue import Kafka
from diagrams.programming.language import Go
from diagrams.onprem.client import Users
from diagrams.custom import Custom

# Graph attributes for styling
graph_attr = {
    "fontsize": "20",
    "fontname": "DM Sans",
    "fontcolor": "#222222",  # Darker font color
    "splines": "curved",
}

# Node attributes for styling
node_attr = {
    "fontname": "DM Sans",
    "fontsize": "16",
    "fontcolor": "#222222",
}

# Edge attributes for styling
edge_attr = {
    "penwidth": "2",  # Thicker lines
    "fontname": "DM Sans",
    "fontsize": "14",
    "fontcolor": "#222222",
    "color": "#333333",  # Dark edge color
}

# URL of the Next.js logo
nextjs_logo_url = "https://seeklogo.com/images/N/next-js-logo-7929BCD36F-seeklogo.com.png"

with Diagram("JobFlow Architecture", show=True, direction="LR",
             graph_attr=graph_attr, node_attr=node_attr, edge_attr=edge_attr):

    user = Users("Browser")

    with Cluster("CDN / Entry Point"):
        cdn = CloudFront("Cloudflare/CDN")

    with Cluster("Frontend - Next.js (SSR)"):
        nextjs = Custom("Next.js SSR App", nextjs_logo_url)
        auth_api = Custom("NextAuth API Route", nextjs_logo_url)

    with Cluster("Backend - GraphQL API"):
        go_api = Go("Go GraphQL Server")

    with Cluster("Datastores"):
        db = RDS("PostgreSQL")
        cache = ElastiCache("Redis")

    with Cluster("Kafka & Microservices"):
        kafka = Kafka("Kafka Broker")
        scrapy = Docker("Scrapy Crawler")
        spark = Docker("Spark Analytics")
        monitoring = Docker("Monitoring (Grafana/Prom)")

    # Define the data flow
    user >> cdn >> nextjs
    nextjs >> auth_api >> go_api
    nextjs >> go_api
    go_api >> Edge(label="Read/Write") >> db
    go_api >> Edge(label="Read") >> cache
    auth_api >> Edge(label="signup/login") >> go_api
    go_api >> kafka
    kafka >> scrapy
    kafka >> spark
    spark >> db
    scrapy >> db
    kafka >> monitoring
    nextjs >> monitoring
