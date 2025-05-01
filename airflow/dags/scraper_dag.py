from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta
import os, sys

# Ensure backend app is importable
sys.path.insert(0, os.path.abspath(os.path.join(__file__, "../../../apps/backend")))

# Import the LinkedIn scraper and manager
from app.scraper.manager import ScrapeManager
from app.scraper.linkedin import scrape_linkedin

# Define job roles for LinkedIn
LINKEDIN_ROLES = [
    'software intern',
    'software engineer intern',
    'software developer intern',
    'backend intern',
    'full stack intern',
    'computer science intern',
]

# Default DAG arguments
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(hours=1),
}

with DAG(
    dag_id='job_scraper',
    default_args=default_args,
    description='Scheduled scraping for LinkedIn jobs',
    schedule_interval='0 3 * * *',  # daily at 3am
    catchup=False,
) as dag:

    def run_linkedin_scraper(job_roles):
        manager = ScrapeManager()
        scrape_linkedin(manager, job_roles)

    with TaskGroup("linkedin_scrapers") as linkedin_group:
        for role in LINKEDIN_ROLES:
            PythonOperator(
                task_id=f"scrape_linkedin_{role.replace(' ', '_')}",
                python_callable=run_linkedin_scraper,
                op_args=[[role]],
                retries=3,
                retry_delay=timedelta(minutes=5),
                retry_exponential_backoff=True,
                max_retry_delay=timedelta(hours=1),
            ) 