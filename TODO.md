# JobFlow Tracker TODOs

## Core Features

- [ ] Implement upload resume via popover  
- [ ] Implement upload cover letter via popover  
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
