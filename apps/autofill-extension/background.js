const OPENAI_API_KEY = "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";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticate") {
    sendResponse({ success: true, token: "fake_auth_token" });
  } else if (request.action === "downloadResume") {
    fetchResume(request.resumeUrl, sendResponse);
    return true; // Ensures async response
  } else if (request.action === "processJobs") {
    processJobsSequentially(request.jobs);
    sendResponse({ status: "Processing started" });
  }
  return true;
});

async function fetchResume(url, sendResponse) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      sendResponse({ success: true, dataURL: reader.result });
    };
  } catch (error) {
    console.error("Error downloading resume:", error);
    sendResponse({ success: false, error: error.message });
  }
}

const userProfile = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    phone: "+1 123-456-7890",
    countryCode: "+1",
    country: "Canada",
    state: "Ontario",
    city: "Toronto",
    resume: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  }
};

function processJobsSequentially(jobs) {
  let index = 0;
  function processNext() {
    if (index >= jobs.length) {
      console.log("All jobs processed.");
      return;
    }
    const job = jobs[index];
    console.log(`Processing job: ${job.link}`);
    chrome.tabs.create({ url: job.link, active: false }, (tab) => {
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: "fillForm",
          apiKey: OPENAI_API_KEY,
          userProfile
        });
        index++;
        setTimeout(processNext, 5000);
      }, 3000);
    });
  }
  processNext();
}
