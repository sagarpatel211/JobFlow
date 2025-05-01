import os
import time
import random
import re
from pathlib import Path
import requests
from fake_useragent import UserAgent  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
from urllib.parse import urlparse

# Files to maintain lists and counts
BASE_DIR = Path(__file__).parent
BLACKLIST_FILE = BASE_DIR / "blacklist.txt"
WHITELIST_FILE = BASE_DIR / "whitelist.txt"
FOLLOWERS_FILE = BASE_DIR / "followers.txt"

# Add minimum followers threshold and alias for existing get_followers_count
MIN_FOLLOWERS = 200_000


def _ensure_file(path: Path):
    if not path.exists():
        path.write_text("", encoding="utf-8")


def load_list(path: Path) -> set[str]:
    _ensure_file(path)
    return set(filter(None, path.read_text(encoding="utf-8").splitlines()))


def load_blacklist() -> set[str]:
    return load_list(BLACKLIST_FILE)


def load_whitelist() -> set[str]:
    return load_list(WHITELIST_FILE)


def load_followers() -> dict[str, int]:
    _ensure_file(FOLLOWERS_FILE)
    d: dict[str, int] = {}
    for line in FOLLOWERS_FILE.read_text(encoding="utf-8").splitlines():
        parts = line.split(",", 1)
        if len(parts) == 2:
            url, cnt = parts
            try:
                d[url] = int(cnt)
            except ValueError:
                continue
    return d


def get_followers_count(company_url: str, attempt: int = 0) -> int:
    followers_data = load_followers()
    if company_url in followers_data:
        return followers_data[company_url]
    # fetch the company page
    ua = UserAgent()
    headers = {"User-Agent": ua.random}
    try:
        resp = requests.get(company_url, headers=headers, timeout=10)
        if resp.status_code != 200:
            return 0
        # parse followers count
        soup = BeautifulSoup(resp.text, "html.parser")
        elem = soup.select_one("h3.top-card-layout__first-subline")
        text = elem.get_text(strip=True) if elem else ""
        m = re.search(r"([\d,]+)\s+followers", text, re.IGNORECASE)
        count = int(m.group(1).replace(",", "")) if m else 0
    except Exception:
        count = 0
    # save to file for caching
    try:
        with open(FOLLOWERS_FILE, "a", encoding="utf-8") as f:
            f.write(f"{company_url},{count}\n")
    except Exception:
        pass
    # delay to avoid rate limiting
    time.sleep(random.uniform(1, 3))
    return count


def fetch_followers_from_profile(url: str) -> int:
    """Alias for get_followers_count; fetch and cache follower count for a company URL."""
    return get_followers_count(url)

BRANDFETCH_API_URL = os.getenv(
    "BRANDFETCH_API_URL", "https://api.brandfetch.io/v2/logo"
)
BRANDFETCH_API_KEY = os.getenv("BRANDFETCH_API_KEY")


def extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc


def fetch_company_logo(url: str) -> str | None:
    if not BRANDFETCH_API_KEY:
        return None
    domain = extract_domain(url)
    headers = {"Authorization": f"Bearer {BRANDFETCH_API_KEY}"}
    try:
        resp = requests.get(
            f"{BRANDFETCH_API_URL}?domain={domain}", headers=headers, timeout=10
        )
        if resp.ok:
            data = resp.json()
            # assume `url` field in response contains the logo URL
            return data.get("url")
    except Exception:
        pass
    return None
