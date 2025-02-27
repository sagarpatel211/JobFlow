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

