"""
Dummy job scraper that generates fake job data for testing purposes.
"""
import random
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from database.session import SessionLocal
from database.models import Job, Company, Tag, RoleType, Status
from threading import Thread

logger = logging.getLogger(__name__)

# Example data for generating fake jobs
COMPANY_NAMES = [
    "Google", "Amazon", "Microsoft", "Apple", "Meta", "Netflix", "Uber",
    "Lyft", "Airbnb", "Twitter", "LinkedIn", "Adobe", "Salesforce",
    "Dropbox", "Slack", "Spotify", "Stripe", "Square", "DoorDash",
    "Instacart", "Robinhood", "Coinbase", "Zoom", "Palantir", "Snowflake"
]

JOB_TITLES = [
    "Software Engineer", "Frontend Engineer", "Backend Engineer",
    "Full Stack Engineer", "Mobile Engineer", "Machine Learning Engineer",
    "Data Scientist", "Product Manager", "UI/UX Designer", "DevOps Engineer",
    "Security Engineer", "QA Engineer", "Site Reliability Engineer",
    "Data Engineer", "Cloud Engineer", "Infrastructure Engineer"
]

TAGS = [
    "Remote", "Hybrid", "On-site", "Entry Level", "Mid Level", "Senior Level",
    "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue",
    "Node.js", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "SQL", "NoSQL",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "Agile",
    "Scrum", "Jira", "AI", "ML", "Data Science", "Computer Vision", "NLP"
]

# Global variables to track scraping state
is_scraping = False
scrape_progress = 0
estimated_seconds = 0
scrape_start_time = None


def start_scrape_job(num_jobs: int = 20) -> bool:
    global is_scraping, scrape_progress, estimated_seconds, scrape_start_time

    if is_scraping:
        return False

    is_scraping = True
    scrape_progress = 0
    estimated_seconds = num_jobs * 2  # 2 seconds per job
    scrape_start_time = datetime.now()

    logger.info(f"Starting fake job scrape for {num_jobs} jobs")

    scrape_thread = Thread(target=_generate_jobs, args=(num_jobs,))
    scrape_thread.daemon = True
    scrape_thread.start()

    return True


def _generate_jobs(num_jobs: int) -> None:
    """
    Generate fake jobs in the database.

    This runs in a background thread to simulate real scraping.
    """
    global is_scraping, scrape_progress, estimated_seconds

    session = SessionLocal()
    try:
        for i in range(num_jobs):
            if not is_scraping:
                break

            role_type = random.choice([RoleType.intern, RoleType.newgrad])

            days_ago = random.randint(0, 30)
            posted_date = datetime.now() - timedelta(days=days_ago)

            company_name = random.choice(COMPANY_NAMES)
            company = session.query(Company).filter(
                Company.name == company_name).first()
            if not company:
                company = Company(name=company_name)
                session.add(company)
                session.flush()

            job = Job(
                company_id=company.id,
                title=f"{random.choice(JOB_TITLES)} - {role_type.value.capitalize()}",
                role_type=role_type,
                posted_date=posted_date,
                link=f"https://example.com/jobs/{random.randint(1000, 9999)}",
                status=Status.nothing_done,
                priority=random.random() < 0.2,  # 20% chance of being priority
                archived=False,
                deleted=False,
                # Random score between 50-100
                ats_score=round(random.uniform(50, 100), 1)
            )

            # Add random tags (1-3)
            num_tags = random.randint(1, 3)
            tag_names = random.sample(TAGS, num_tags)
            for tag_name in tag_names:
                tag = session.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    session.add(tag)
                    session.flush()
                job.tags.append(tag)

            session.add(job)
            session.commit()

            scrape_progress = (i + 1) / num_jobs * 100
            time.sleep(1)

        logger.info(f"Generated {num_jobs} fake jobs")
    except Exception as e:
        logger.error(f"Error generating fake jobs: {str(e)}")
        session.rollback()
    finally:
        session.close()
        is_scraping = False
        scrape_progress = 100


def cancel_scrape_job() -> bool:
    global is_scraping

    if not is_scraping:
        return False

    logger.info("Cancelling fake job scrape")
    is_scraping = False
    return True


def get_scrape_status() -> Dict[str, Any]:
    global is_scraping, scrape_progress, estimated_seconds, scrape_start_time

    remaining_seconds = 0
    if is_scraping and scrape_start_time:
        elapsed = (datetime.now() - scrape_start_time).total_seconds()
        if scrape_progress > 0:
            total_estimated = elapsed / (scrape_progress / 100)
            remaining_seconds = max(0, total_estimated - elapsed)

    return {
        "scraping": is_scraping,
        "scrapeProgress": scrape_progress,
        "estimatedSeconds": remaining_seconds
    }
