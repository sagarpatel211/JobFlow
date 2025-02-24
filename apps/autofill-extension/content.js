// content.js

// Listen for `fillForm` messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    console.log("📩 Message received in content.js: Sending to background.js...");
    
    // Forward the request to the background script
    chrome.runtime.sendMessage({ action: "executeFillForm", apiKey: request.apiKey, userProfile: request.userProfile });
  }
});
