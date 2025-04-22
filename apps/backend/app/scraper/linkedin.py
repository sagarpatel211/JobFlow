# apps/backend/app/scraper/linkedin.py
import time
import random
from datetime import datetime
import requests  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
from fake_useragent import UserAgent  # type: ignore
import re

from ..models import Company, Job, db
from .utils import MIN_FOLLOWERS, fetch_followers_from_profile, fetch_company_logo

# This module scrapes job postings from LinkedIn's guest API.

def get_or_create_company(name: str, url: str) -> Company | None:
    """Retrieve a Company by name or create it, fetching follower count if needed."""
    comp = Company.query.filter_by(name=name).first()
    # skip blacklisted companies
    if comp and comp.blacklisted:
        return None
    # existing company: update follower_count and logo if needed
    if comp:
        if not comp.follower_count:
            comp.follower_count = fetch_followers_from_profile(url)
        # fetch logo if missing
        if not getattr(comp, 'image_url', None) and url:
            logo_url = fetch_company_logo(url)
            if logo_url:
                comp.image_url = logo_url
        db.session.commit()  # type: ignore
        return comp
    # new company: fetch follower count and logo then save
    followers = fetch_followers_from_profile(url)
    comp = Company(name=name, follower_count=followers)
    # fetch logo
    if url:
        logo_url = fetch_company_logo(url)
        if logo_url:
            comp.image_url = logo_url
    db.session.add(comp)  # type: ignore
    db.session.commit()  # type: ignore
    return comp

def scrape_linkedin(manager, job_roles: list[str]):
    """Scrape LinkedIn guest API for given roles and save jobs to database."""
    ua = UserAgent()
    manager.set_total(len(job_roles))

    for role in job_roles:
        if manager.cancel_event.is_set():
            break

        # random delay between role fetches
        time.sleep(random.uniform(3, 7))
        headers = {
            'User-Agent': ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        }
        params = {
            'keywords': role,
            'start': 0,
            'f_TPR': 'r1209600',  # past two weeks
        }
        # Fetch job postings for this role
        resp = requests.get(
            'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search',
            params=params,
            headers=headers,
            timeout=10,
        )
        # If rate limited, raise to let Airflow retry with exponential backoff
        if resp.status_code == 429:
            raise Exception(f"LinkedIn rate limited for role '{role}'")
        # Skip other non-OK statuses
        if resp.status_code != 200:
            manager.increment_progress()
            continue
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        cards = soup.select('li')
        for card in cards:
            # extract LinkedIn job card details
            comp_link_el = card.select_one('a.hidden-nested-link')
            comp_url = comp_link_el.get('href', '').split('?')[0] if comp_link_el else ''
            title_el = card.select_one('h3.base-search-card__title')
            link_el = card.select_one('a.base-card__full-link')
            date_el = card.select_one('time')
            # company name
            company_el = card.select_one('h4.base-search-card__subtitle')
            comp_name = company_el.get_text(strip=True) if company_el else ''
            if not (comp_name and link_el and title_el):
                continue
            # get or create company, skip if blacklisted
            comp = get_or_create_company(comp_name, comp_url)
            if not comp:
                continue
            # skip if below follower threshold
            if comp.follower_count < MIN_FOLLOWERS:
                continue
            # parse job link and title
            job_link = link_el.get('href', '').split('?')[0]
            job_title = title_el.get_text(strip=True)
            # skip if job already exists
            if Job.query.filter_by(link=job_link).first():
                continue
            # create and save job
            job = Job(
                company_id=comp.id,
                title=job_title,
                link=job_link,
                posted_date=datetime.utcnow(),
            )
            db.session.add(job)  # type: ignore
            db.session.commit()  # type: ignore
            # colored log for added job
            print(f"\033[92mAdded job: {job_title} at {comp_name} ({comp.follower_count} followers)\033[0m")
        # end of cards loop
        # mark this role as done
        manager.increment_progress()
