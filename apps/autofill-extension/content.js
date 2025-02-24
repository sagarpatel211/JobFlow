const DEFAULT_SERVER_URL = "http://localhost:3000"; // fallback if not provided

// Dispatch events after setting a value.
function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
window.dispatchInputEvents = dispatchInputEvents;

// Capture the full HTML of the page and send it to the backend server for AI processing.
async function capturePageHTML(apiKey, serverURL) {
  try {
    console.log("Capturing HTML for AI processing...");
    const pageHTML = document.documentElement.outerHTML;
    const result = await sendHTMLToServer(serverURL, pageHTML);
    return result;
  } catch (error) {
    console.error("Error capturing page HTML:", error);
    return { success: false, error: error.message };
  }
}

async function sendHTMLToServer(serverURL, htmlData) {
  try {
    const response = await fetch(`${serverURL}/process-html`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ htmlData })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
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
    } else {
      console.warn(`Could not find element for selector: ${fieldSelector}`);
    }
  });
  console.log("Form filling complete.");
}

// Listen for messages from background.js.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === "fillForm") {
    // Use provided serverURL or default if not provided.
    const serverURL = request.serverURL || DEFAULT_SERVER_URL;
    console.log("Using serverURL:", serverURL);
    capturePageHTML(request.apiKey, serverURL);
  }
});
