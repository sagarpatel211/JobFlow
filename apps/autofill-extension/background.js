chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FILL_JOB_APP") {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: autofillJobApplication,
      args: [message.data]
    });
    sendResponse({ status: "success" });
  }
});

function autofillJobApplication(jobData) {
  document.querySelector('input[name="name"]').value = jobData.name;
  document.querySelector('input[name="email"]').value = jobData.email;
  document.querySelector('textarea[name="coverLetter"]').value = jobData.coverLetter;
}
