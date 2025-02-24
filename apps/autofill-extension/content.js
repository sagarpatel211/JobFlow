// Helper to dispatch events after setting values
function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
window.dispatchInputEvents = dispatchInputEvents;

// Uploads the resume file by requesting it from background.js
function uploadResume(apiKey, resumeUrl) {
  chrome.runtime.sendMessage({ action: "downloadResume", resumeUrl }, (response) => {
    if (response.success) {
      attachResume(response.dataURL);
    } else {
      console.error("Failed to download resume:", response.error);
    }
  });
}

// Attaches the downloaded resume to the file input
function attachResume(dataURL) {
  fetch(dataURL)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], "resume.pdf", { type: "application/pdf" });
      document.querySelectorAll("input[type='file']").forEach(fileInput => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        dispatchInputEvents(fileInput);
        console.log("Resume uploaded.");
      });
    })
    .catch(error => console.error("Error attaching resume:", error));
}

// Main function to fill the form
async function capturePageAndFillForm(apiKey, userProfile) {
  console.log("Filling form fields...");

  document.querySelectorAll("input, textarea").forEach(input => {
    let label = input.placeholder || input.getAttribute("aria-label") || "";
    if (!label && input.id) {
      const labelElement = document.querySelector(`label[for="${input.id}"]`);
      if (labelElement) label = labelElement.innerText;
    }
    label = label.toLowerCase();

    function fillField(value) {
      if (value) {
        input.value = value;
        dispatchInputEvents(input);
        console.log(`Filled: ${label}`);
      }
    }

    if (label.includes("first name") || label.includes("given name")) fillField(userProfile.personal.firstName);
    if (label.includes("last name") || label.includes("surname")) fillField(userProfile.personal.lastName);
    if (label.includes("full name") || label.trim() === "name") fillField(`${userProfile.personal.firstName} ${userProfile.personal.lastName}`);
    if (label.includes("email")) fillField(userProfile.personal.email);
    if (label.includes("phone")) fillField(userProfile.personal.phone);
  });

  document.querySelectorAll("select").forEach(dropdown => {
    let label = dropdown.getAttribute("aria-label") || dropdown.name || dropdown.id || "";
    label = label.toLowerCase();

    function selectDropdown(value) {
      for (let option of dropdown.options) {
        if (option.text.toLowerCase().includes(value.toLowerCase())) {
          dropdown.value = option.value;
          dispatchInputEvents(dropdown);
          console.log(`Selected: ${option.text}`);
          return;
        }
      }
    }

    if (label.includes("country") && !label.includes("phone")) selectDropdown(userProfile.personal.country);
    if (label.includes("phone extension") || label.includes("dial")) selectDropdown(userProfile.personal.countryCode);
    if (label.includes("state") || label.includes("province")) selectDropdown(userProfile.personal.state);
    if (label.includes("city")) selectDropdown(userProfile.personal.city);
  });

  uploadResume(apiKey, userProfile.personal.resume);
}
window.capturePageAndFillForm = capturePageAndFillForm;

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    console.log("Received fillForm request");
    if (typeof window.capturePageAndFillForm === "function") {
      window.capturePageAndFillForm(request.apiKey, request.userProfile);
    } else {
      console.error("Form filler function not found");
    }
  }
});

just use this and get it done tonight!
https://github.com/sainikhil1605/ApplyEase
https://chatgpt.com/c/67b89fe6-26f4-8011-a403-fb0cacf20b71