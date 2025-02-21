chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "EXTRACT_JOB_INFO") {
    const jobTitle = document.querySelector("h1")?.innerText || "";
    const company = document.querySelector(".company-name")?.innerText || "";
    const description = document.querySelector(".job-description")?.innerText || "";
    
    sendResponse({ jobTitle, company, description });
  }
});
