import threading
import time

from .linkedin import scrape_linkedin

# list of scraper functions; extendable
SCRAPERS = [scrape_linkedin]

class ScrapeManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._cancel_event = threading.Event()
        self._is_scraping = False
        self._progress = 0
        self._total = 0
        self._start_time = None
        self._thread = None

    def start(self) -> bool:
        with self._lock:
            if self._is_scraping:
                return False
            self._cancel_event.clear()
            self._progress = 0
            self._total = 0
            self._start_time = time.time()
            self._is_scraping = True
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
            return True

    def cancel(self) -> bool:
        with self._lock:
            if not self._is_scraping:
                return False
            self._cancel_event.set()
            return True

    def get_status(self) -> dict:
        with self._lock:
            scraping = self._is_scraping
            progress = self._progress
            total = self._total if self._total > 0 else 1
            percent = int((progress / total) * 100)
            elapsed = time.time() - self._start_time if self._start_time else 0
            if progress > 0:
                per_item = elapsed / progress
                remaining = per_item * (total - progress)
            else:
                remaining = 0
            return {
                "scraping": scraping,
                "scrapeProgress": percent,
                "estimatedSeconds": int(remaining),
            }

    def _run(self):
        try:
            for scraper in SCRAPERS:
                if self._cancel_event.is_set():
                    break
                scraper(self)
        except Exception:
            pass
        finally:
            with self._lock:
                self._is_scraping = False

    def set_total(self, total: int):
        with self._lock:
            self._total = total

    def increment_progress(self):
        with self._lock:
            self._progress += 1

    @property
    def cancel_event(self):
        return self._cancel_event

# singleton instance for routes
scrape_manager = ScrapeManager() 