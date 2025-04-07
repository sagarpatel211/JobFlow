from apscheduler.schedulers.background import BackgroundScheduler
from jobscraper import scrape_jobs
from config import Config

def start_cron():
    scheduler = BackgroundScheduler()
    scheduler.add_job(scrape_jobs, "interval", hours=Config.JOB_SCRAPE_INTERVAL_HOURS)
    scheduler.start()
