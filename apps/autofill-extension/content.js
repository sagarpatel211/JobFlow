// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fillForm") {
    if (window.hasSentRequest) {
      console.warn("Form processing request already sent. Skipping duplicate request.");
      return;
    }
    window.hasSentRequest = true;

    function processForm() {
      console.log("Capturing page HTML and sending to server...");
      const html = document.documentElement.outerHTML;
      fetch("http://localhost:3005/processForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html })
      })
        .then((response) => response.json())
        .then(async (data) => {
          console.log("Received form fill instructions:", data);
          if (!Array.isArray(data.fillInstructions)) {
            console.error("fillInstructions is not iterable:", data.fillInstructions);
            sendResponse({ status: "error", error: "fillInstructions is not an array" });
            window.hasSentRequest = false;
            return;
          }
          const instructions = data.fillInstructions;
          for (const instruction of instructions) {
            const element = document.querySelector(instruction.selector);
            if (!element) {
              console.error("Element not found for selector:", instruction.selector);
              continue;
            }
            if (instruction.action === "fill") {
              element.value = instruction.value;
              element.dispatchEvent(new Event("input", { bubbles: true }));
              element.dispatchEvent(new Event("change", { bubbles: true }));
              console.log(`Filled field: ${instruction.selector} with value: ${instruction.value}`);
            } else if (instruction.action === "select") {
              let found = false;
              for (let i = 0; i < element.options.length; i++) {
                if (element.options[i].text.toLowerCase().includes(String(instruction.value).toLowerCase())) {
                  element.selectedIndex = i;
                  element.dispatchEvent(new Event("change", { bubbles: true }));
                  found = true;
                  console.log(`Selected dropdown: ${instruction.selector} -> ${instruction.value}`);
                  break;
                }
              }
              if (!found) {
                console.error(`No matching option found for ${instruction.value} in ${instruction.selector}`);
              }
            } else if (instruction.action === "upload") {
              try {
                console.log(`Uploading file from: ${instruction.value}`);
                const fileResponse = await fetch(instruction.value);
                const blob = await fileResponse.blob();
                const fileName = instruction.value.split("/").pop() || "file";
                const file = new File([blob], fileName, { type: blob.type });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                element.files = dataTransfer.files;
                element.dispatchEvent(new Event("change", { bubbles: true }));
                console.log(`Uploaded file: ${fileName} to ${instruction.selector}`);
              } catch (error) {
                console.error(`Error uploading file for ${instruction.candidateField}:`, error);
              }
            }
          }
          sendResponse({ status: "formFilled" });
          window.hasSentRequest = false;
        })
        .catch((err) => {
          console.error("Error processing form:", err);
          sendResponse({ status: "error", error: err });
          window.hasSentRequest = false;
        });
    }
    if (document.readyState === "complete") {
      processForm();
    } else {
      window.addEventListener("load", processForm);
    }

    return true;
  }
});
