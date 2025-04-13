import { runScraper } from '../utils/scrape.js';
import { getScraperStatus } from '../utils/status.js';

const tiktokSelectors = {
  list: 'div.listItems__1q9i5',
  title: '.positionItem-title .clamp-content',
  link: 'a',
  companyName: 'TikTok',
};

export const TiktokScraper = async () => {
  await runScraper(
    'TikTok',
    'https://careers.tiktok.com/position?category=6704215862603155720%2C6704215864629004552%2C6709824272514156812%2C6850051244971526414&project=7322364514224687370&type=3&current=1&limit=10',
    tiktokSelectors,
    'li.atsx-pagination-next[aria-disabled="false"] a.atsx-pagination-item-link',
  );
};

export const getTiktokScraperStatus = async () => {
  return await getScraperStatus(
    'TikTok',
    'https://careers.tiktok.com/position?category=6704215862603155720',
    'div.listItems__1q9i5',
  );
};
