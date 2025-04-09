https://chatgpt.com/c/67a55889-f6ac-8011-bfab-4c6eb74026bf
^ once frontend done, deal with scaling auth for millions of users

Fix next.config.ts to use proper domains to optimize

finish landing page to be dark and light mode since only looks good in light

https://ui.aceternity.com/components/signup-form Add this to the signup page

add auto fill for software intern tab to autofill

Design the system design on https://excalidraw.com/ ASAP AND MAKE IT PROPER SO I CAN INCLUDE ON README SO EMPLOYERS CAN SEE AND I CAN LINK IT ON RESUME

for resume drag and drop:
/_
for each box, there should be a dropdown in the top right corner where it has an improve with ai based on job posting, shorten, lengthen, or modify text which will let us be able to modify the text with a standard text editor bar with bold underline, link, italicize, etc.
each box needs a text editor like bold, add link, etc.
_/

add unit tests and github actions

use this architecture https://chatgpt.com/c/67affb73-32e4-8011-b21e-a6a4058b29d7

https://chatgpt.com/c/67b0263d-972c-8011-8f2d-4003eede0401


COME UP WITH A BETTER WAY THAN USING MICROSERVICES FOR THE SYSTEM DESIGN BECAUSE IT CAN BE EXPENSIVE AND HARD TO MAINTAIN
and use kubernetes instead of docker-compose

# Step by Step TODO
- [ ] remove application page
- [ ] add application column with ats, application and resume+cover letter with option to uplaod to tracker
- [ ] add stats below the tracker table
- [ ] finish auto generation of resume and cover letter tool
- [ ] clean up dashboard and remove sidebar animation
- [ ] get server side rendering working for all pages by mocking the api calls
- [ ] build the frontend fully and host it to begin working on backend




set up chrome browser and info path given in the readme of the web-ui repo (https://chatgpt.com/c/67c51d3b-0e54-8011-8aff-e7ca348c0e29)

# Files to Update
- [X] login
- [X] signup
- [ ] onboarding
- [ ] fix file upload on onboarding to prevent next page until all files are uploaded
- [ ] settings
- [ ] statistics
- [ ] applications
- [ ] generate
- [ ] interview
- [ ] tracker
- [ ] dashboard
- [ ] landing
- [ ] serverside rendering
- [ ] move all interface types to the types folder
- [ ] add profile icon in nav bar


# For Frontend
The AI should be designed to queue applications when the "Fill" button is clicked, rather than applying immediately. This ensures that applications are only submitted to major companies, allowing me to quickly skim through them and decide which ones to finalize. The system should automatically add a new row in the applications page with a "Queued" tag, making it easy to review and submit later with a polished resume and cover letter. Additionally, it should record all actions by screen recording and attaching the footage to each application, providing a transparent history of how the process works.

To efficiently manage the job tracker, which will contain up to 10,000 listings, stale postings should disappear while important ones remain at the top, sorted by LinkedIn followers. However, managing such a large volume of jobs still poses a challenge. The AI should explore advanced filtering techniques to avoid manual sorting. A possible solution is an auto-archive setting for jobs older than five days, but this alone may not be sufficient. While auto-deleting listings after 30 days could help, it poses a risk—some employers might reach out months later, making it crucial to retain relevant postings. A better approach needs to be developed, possibly involving an intelligent archiving system that prioritizes important opportunities without excessive clutter.

Lastly, ask llm for additional features on the application page, helping refine the system further to improve efficiency and usability.

FIX THE THEMING FOR ALL PAGES IN THE APP LIKE ONBOARDING AND SUCH

move all the interfaces to the types folder!

- add indexes to the database to speed up queries
- set up elasticsearch for full text search
- fix the date input not working for jobrow
- modularize api endpoints by writing functions to reuse code

- archives should not count in the total jobs graphs


- Add a homepage for the chrome extension with a queue to show what is going to be applied for
- Add a feature where it archives the submitted application and a recording of the application process
- Add a loading icon when we start the autofill process and when we are done with status updates
- Possibly emails the user when the application is submitted with a link to the package
- The queue should be able to be set from the frontend so it will show on the extension with an API

- fix scripts for backend for chrome extension so it is automated

- make the script work so if there is an apply button on the link we click that and there is no form field since we might be on the pre-application page, also add a next button look for the next button and click that  so we can continue the process

- Add this to auto apply!! https://chatgpt.com/c/67b9492b-ba24-8011-8749-860df34646f1

https://chatgpt.com/c/67be8a81-d7d4-8011-a2c0-f39bc6dd286e?model=o3-mini-high

in the extract js file we need to look for buttons that say apply or add experience and click those buttons and then click the next button if there is one

sometimes jobs ask for entire history so if there are fields for that we need to be able to click Add Experience and add the experience

make sure we do an auth check for the server endpoint so only premium users can use the service

connect the backend to the frontend so that the 5 stage process connects to the backend and all errors are reported to frontend

fix home page so no gpt api key

- figure out how to apply when the job posting is like a workday link that requires signing in

//   I need to be able to have a queue of applying for jobs
//    but i need to be able to fill out current tab form with a
//    button so it should mention that on the button and

// instead of putting the status in the queue, have a current
// status box which shows what the current work is being done
// and use https://ui.aceternity.com/components/multi-step-loader
// and make sure if we automate 10 mill jobs, we need pagination or
// we need to make sure that it clears regularly so we avoid too
// many listed for the user or we just show the top 5 and have the queue shown on the applications page on jobflow

// clicking fill with ai should add to queue first and then fill out the form
// and then remove from queue, cuz it needs to track on jobflow and progress. or we can have a toggle that says don't track on jobflow

// ADD A SECTION THAT SAYS "UPDATE PERSONAL INFO" ON JOBFLOW TO REFLLECT THE CURRENT INFO ON THE EXTENSION. ADD A TOGGLE TO CREATE NEW RESUME AND COVER LETTER. PLAN HOW THE ENTIRE PROCESS WILL WORK CUZ IF IT UPDATES WILL WE CREATE A NEW RESUME WHEN AUTOAPPLYING? HOW CAN THE USER MAKE SURE THE RESUME IS GOOD, ETC.




make an automated script and make a readme 
that mentions about edge://version/
or chrome://version/ and how to get the user path and user data path