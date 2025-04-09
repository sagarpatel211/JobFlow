from diagrams import Diagram, Cluster
from diagrams.custom import Custom
from diagrams.onprem.client import Users
from diagrams.elastic.elasticsearch import Elasticsearch
from diagrams.onprem.database import PostgreSQL
from diagrams.k8s.compute import Pod
from diagrams.k8s.network import Ingress
from diagrams.onprem.iac import Terraform
from diagrams.onprem.container import Docker
from diagrams.onprem.queue import Kafka
from diagrams.onprem.analytics import Spark
from diagrams.onprem.monitoring import Prometheus, Grafana
from diagrams.aws.network import CloudFront
from urllib.request import urlretrieve

# Download remote icon files for custom nodes
urlretrieve("https://static-00.iconduck.com/assets.00/nextjs-icon-512x309-yynfidez.png", "nextjs.png")
urlretrieve("https://raw.githubusercontent.com/devicons/devicon/master/icons/flask/flask-original.svg", "flask.svg")
urlretrieve("https://static-00.iconduck.com/assets.00/cronjob-icon-512x512-he5rxqav.png", "cron.png")

with Diagram("JobFlow System Architecture", show=True, direction="LR"):
    user = Users("User")

    with Cluster("Cloud/CDN"):
        cdn = CloudFront("Cloudflare/CDN")

    with Cluster("Frontend"):
        nextjs = Custom("Next.js SSR", "nextjs.png")

    with Cluster("Backend - Flask API"):
        flask = Custom("Flask API\n(Gunicorn)", "flask.png")
        cron = Custom("Scraper Cron Job", "cron.png")

    with Cluster("Data Layer"):
        db = PostgreSQL("PostgreSQL")
        es = Elasticsearch("Elasticsearch")

    with Cluster("Platform Infrastructure"):
        with Cluster("Kubernetes"):
            ingress = Ingress("Ingress")
            pod = Pod("App Pod")
        tf = Terraform("Terraform")

    with Cluster("Streaming & Analytics"):
        kafka = Kafka("Kafka")
        spark = Spark("Spark")

    with Cluster("Monitoring"):
        prometheus = Prometheus("Prometheus")
        grafana = Grafana("Grafana")

    # Data flows
    user >> cdn >> nextjs >> ingress >> flask
    flask >> db
    flask >> es
    flask >> kafka
    cron >> db
    cron >> es
    kafka >> spark
    spark >> db

    # Infra links
    tf >> ingress
    tf >> pod
    tf >> kafka
    tf >> spark

    # Monitoring
    flask >> prometheus >> grafana
    nextjs >> prometheus

    # Docker container grouping
    docker = Docker("Dockerized Services")
    docker >> [flask, db, es, cron]
