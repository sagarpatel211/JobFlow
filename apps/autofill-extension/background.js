chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "authenticate") {
    const token = "sample_auth_token"; // Replace with a real token as needed.
    console.log("Returning simulated auth token.");
    sendResponse({ success: true, token });
    return true;
  }
  if (message.action === "processJobs") {
    const jobs = message.jobs;
    jobs.forEach((job) => {
      chrome.tabs.create({ url: job.link, active: false }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === "complete") {
            chrome.tabs.sendMessage(tab.id, { action: "fillForm" }, (response) => {
              console.log("Form fill response:", response);
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });
    });
    sendResponse({ status: "jobsProcessing" });
    return true;
  }
});
