// background.js

const OPENAI_API_KEY = "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"; // Replace with your API key

// Define your user profile – you can extend this as needed.
const userProfile = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    phone: "123-456-7890"
  },
  resume: "https://example.com/resume.pdf",           // URL or resume text
  coverLetter: "This is my cover letter text.",         // Cover letter text
  additionalQuestions: {
    sponsorship: "No",                                 // Sponsorship answer
    dei: "I support diversity and inclusion."          // DEI background/disability info
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processJobs") {
    const jobs = request.jobs;
    processJobsSequentially(jobs);
    sendResponse({ status: "Processing started" });
  }
});

function processJobsSequentially(jobs) {
  let index = 0;
  function processNext() {
    if (index >= jobs.length) {
      console.log("All jobs processed.");
      return;
    }
    const job = jobs[index];
    console.log(`Processing job ${job.id}: ${job.link}`);
    chrome.tabs.create({ url: job.link, active: false }, (tab) => {
      // Wait a few seconds for the page to load.
      setTimeout(() => {
        // Send message to content script with API key and profile data.
        chrome.tabs.sendMessage(tab.id, {
          action: "fillForm",
          apiKey: OPENAI_API_KEY,
          userProfile: userProfile
        });
        console.log(`Job ${job.id} form processing initiated. Tab remains open for review.`);
        index++;
        // Process the next job after a short delay (5 seconds)
        setTimeout(processNext, 5000);
      }, 3000);
    });
  }
  processNext();
}