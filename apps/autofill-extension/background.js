const OPENAI_API_KEY = "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";

// Listen for messages from the extension or content scripts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticate") {
    sendResponse({ success: true, token: "fake_auth_token" });
  } else if (request.action === "downloadResume") {
    fetchResume(request.resumeUrl, sendResponse);
    return true; // keep channel open for async response
  } else if (request.action === "processJobs") {
    processJobsSequentially(request.jobs);
    sendResponse({ status: "Processing started" });
  }
  return true;
});

// Download resume from a URL and return it as a dataURL.
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

// Capture page HTML and send it to a backend server for AI processing.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capturePageHTML") {
    capturePageHTML(request.serverURL, sendResponse);
    return true; // keep channel open for async response
  }
});

async function capturePageHTML(serverURL, sendResponse) {
  try {
    console.log("Capturing HTML for AI processing...");
    const pageHTML = document.documentElement.outerHTML;
    const result = await sendHTMLToServer(serverURL, pageHTML);
    sendResponse(result);
  } catch (error) {
    console.error("Error capturing page HTML:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function sendHTMLToServer(serverURL, htmlData) {
  try {
    const response = await fetch(`${serverURL}/process-html`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ htmlData })
    });
    const result = await response.json();
    console.log("Server Response:", result);
    if (result.success) {
      fillFormFields(result.formData);
      return { success: true };
    } else {
      console.error("Failed to process form:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("Error sending HTML to server:", error);
    return { success: false, error: error.message };
  }
}

function fillFormFields(formData) {
  Object.keys(formData).forEach(field => {
    const fieldSelector = formData[field].selector;
    const fieldValue = formData[field].value;
    const input = document.querySelector(fieldSelector);
    if (input) {
      input.value = fieldValue;
      dispatchInputEvents(input);
      console.log(`Filled ${field} (${fieldSelector}) with ${fieldValue}`);
    }
  });
  console.log("Form filling complete.");
}

function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
