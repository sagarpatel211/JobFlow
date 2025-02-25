(async () => {
  const { dispatchInputEvents, navigateNextPage } = await import(chrome.runtime.getURL("scripts/utils.js"));

  function normalizeText(text) {
    return text.trim().toLowerCase();
  }

  async function capturePageHTML(apiKey, serverURL) {
    try {
      console.log("Capturing HTML for AI processing...");
      const pageHTML = document.documentElement.outerHTML;
      await sendHTMLToServer(serverURL, pageHTML);
    } catch (error) {
      console.error("Error capturing page HTML:", error);
    }
  }

  async function sendHTMLToServer(serverURL, pageHTML) {
    try {
      let endpoint = serverURL.endsWith("/process-html") ? serverURL : `${serverURL}/process-html`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlData: pageHTML })
      });

      const data = await response.json();
      if (data.success) {
        await fillFormFields(data.formData);
      } else {
        console.error("Server error:", data.error);
      }
    } catch (error) {
      console.error("Error sending HTML to server:", error);
    }
  }

  async function fillFormFields(mapping) {
    for (const [fieldKey, fieldMapping] of Object.entries(mapping)) {
      const { selector, value } = fieldMapping;

      if (!selector) {
        console.warn(`Skipping field "${fieldKey}" due to missing selector.`);
        continue;
      }

      const inputElem = document.querySelector(selector);
      if (!inputElem) {
        console.warn(`No element found for selector "${selector}" (field: "${fieldKey}")`);
        continue;
      }

      if (inputElem.type === 'file') {
        console.log(`Uploading file for "${fieldKey}"`);
        await setFileInputValue(inputElem, value);
      } else if (inputElem.tagName.toLowerCase() === 'select') {
        console.log(`Selecting dropdown "${fieldKey}" with value "${value}"`);
        let optionFound = false;
        const normalizedValue = normalizeText(value);

        for (const option of inputElem.options) {
          if (normalizeText(option.text).includes(normalizedValue) || normalizeText(option.value) === normalizedValue) {
            inputElem.value = option.value;
            dispatchInputEvents(inputElem);
            optionFound = true;
            break;
          }
        }

        if (!optionFound) console.warn(`No matching option found for "${value}" in "${selector}"`);
      } else {
        console.log(`Filling input "${fieldKey}" with value "${value}"`);
        inputElem.value = value;
        dispatchInputEvents(inputElem);
      }
    }
  }

  async function setFileInputValue(inputElement, fileUrl) {
    try {
      console.log("Fetching file for upload...");

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop() || 'resume.pdf';
      const file = new File([blob], fileName, { type: blob.type });

      if (window.location.href.includes("explore.jobs.netflix.net")) {
        console.log("Uploading resume via Netflix API...");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("domain", "netflix.com");
        formData.append("user_mode", "logged_out_candidate");

        const uploadResponse = await fetch("https://explore.jobs.netflix.net/api/application/v2/resume_upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!uploadResponse.ok) {
          console.error("Netflix Resume Upload Failed:", await uploadResponse.text());
        } else {
          console.log("Netflix Resume Successfully Uploaded!");
        }
        return;
      }

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputElement.files = dataTransfer.files;
      dispatchInputEvents(inputElement);

      console.log("File input successfully set.");
    } catch (err) {
      console.error('Error setting file input value:', err);
    }
  }

  async function clickApplyButton() {
    console.log("Checking for 'Apply' button...");
    const applyBtn = [...document.querySelectorAll("button, a")].find(btn =>
      btn.textContent.toLowerCase().includes("apply")
    );

    if (applyBtn) {
      console.log("Clicking 'Apply' button.");
      applyBtn.click();
      await waitForNavigation();
    } else {
      console.log("'Apply' button not found. Continuing...");
    }
  }

  function waitForNavigation(timeout = 10000) {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (document.readyState === "complete") {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }

  async function capturePageAndFillForm(apiKey, serverURL) {
    console.log("Starting form fill process...");
    await clickApplyButton();
    console.log("Waiting for form page...");
    await waitForNavigation();

    setTimeout(async () => {
      await capturePageHTML(apiKey, serverURL);
    }, 3000);

    navigateNextPage();
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "fillForm") {
      capturePageAndFillForm(request.apiKey, request.serverURL);
    }
  });

})();
