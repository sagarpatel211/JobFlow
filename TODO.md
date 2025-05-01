# JobFlow Tracker TODOs

- [ ] Set up user authentication
- [ ] Set up light/dark mode
- [ ] Each company DB should be a single DB so we don't refech company icons or followers, but each user should have their own for blacklist/whitelist/etc.
- [ ] Fix architecture and README listing the correct tech stack we use and fix /techstack endpoint
- [ ] Set up onboarding to work because auth works but some pages in onboarding need to be fixed and when we submit we need to add to DB functionality
- [ ] Clean up the code base since its a bit messy
- [ ] Remove nextjs auth since we are using our own in python
- [ ] Set up company logo fetching from https://brandfetch.com/developers/logo-api or https://www.logo.dev/pricing
- [ ] Set up github and google signin providers
- [ ] Fix generate to also allow QA and behavioural questions
get black list whitelist and fix the followers dropdown we should be able to type in the dropdown. restructure db so each user gets their own blacklist and whitelist but followers and logo is global. can we also restructure the database
- [ ] Add a section to save behavioural questions and QA questions to practice
- fix search bar so the personal notes and tags work for the search bar
- [ ] Fix dashboard so it actully shows lifetime stats like jobs ever applied to, companies ever applied to, etc.


## Core Features

- [ ] Implement upload resume via popover  
- [ ] Implement upload cover letter via popover  
- [ ] Scraper should show the progress bar and cancel button once we start yet it doesn't
- [ ] Add support for custom tags  
- [ ] Add 4 tag filters and make them functional  
- [ ] Add quick search functionality  
- [ ] Finish "Group by Company" functionality  
- [ ] Each company should support:
  - [ ] Company logo  
  - [ ] Blacklist / Whitelist  
  - [ ] Followers  
  - [ ] Row options  
- [ ] Fix tag filtering pagination (filters 4 items per *page*, not globally)  
- [ ] Auto-delete unused tags (i.e. tags with no associated jobs)  
- [ ] Add folder section:
  - [ ] Add jobs to folders (e.g. "Summer 2025")
  - [ ] View jobs by folders
- [ ] Add tag + folder browsing section (below table or in its own view)  

## UI/UX

- [ ] Clean up frontend  
- [ ] Only table content should re-render on updates — prevent full component flashing (📌 _Do this today_)  
- [ ] Add loading skeleton for the job table (not the whole layout)  
- [ ] Add hotkeys for the tracker for better productivity  
- [ ] In `apppopover.tsx`, add:
  - [ ] Personal Notes (multi-line input)  
  - [ ] Folder assignment dropdown  

## Smart Search (Advanced)

- [ ] Redesign search bar:
  - [ ] Show job rows as usual  
  - [ ] Show custom tag matches  
  - [ ] Show personal note matches  
  - [ ] Add left-side suggestions panel (e.g. past interviews, technical questions, links)  

## Backend

- [ ] Clean up backend
- [ ] Each job shouldn't have a newgrad/intern row, we just use the tags we have and search among those
- [ ] If we rename a company on the frontend, when we refresh the page, it should know which company it is so that should be the key to the database
- [ ] Create decorators for common backend patterns (eg. try-catch, etc.)
- [ ] Get scraping to work  
- [ ] Fix blacklist / whitelist / row actions  
- [ ] Implement backend functionality for:
  - [ ] Filters  
  - [ ] Actions dropdown  
  - [ ] Scraping endpoint  
- [ ] fix blob storage so we upload directly to minio and send the link to the backend because right now we send the file to the backend
- [X] Set up blob storage  
- [X] Set up Elasticsearch search indexing  

## Productivity Boost (GPT Ideas)

- [ ] Ask GPT for additional tracker features to improve productivity  
- [ ] Ask GPT for more actions to implement and implement them  
- [ ] Ask GPT for ways to enhance this page (grouping, visual cues, AI recommendations, etc.)

## Fix Warnings / Cleanup

- [ ] Update `.env` and `.env.template`:
  - [ ] Clean formatting  
  - [ ] Add documentation for:
    - [ ] Accessing MinIO  
    - [ ] Accessing Elasticsearch  
    - [ ] Accessing Redis  

## Search

- [ ] Get search bar to work with:
  - [ ] Custom tags  
  - [ ] Personal notes  

- [ ] Add the architecture image in the README from NextJS endpoint