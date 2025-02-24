// backend/form_filler.js

console.log("Inside form_filler.js");

// This function waits for the page to load and then processes name fields.
async function capturePageAndFillNameFields(openaiApiKey, userProfile) {
  console.log("🚀 Starting name field filling process in capturePageAndFillNameFields");

  // Wait until the page is fully loaded.
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve));
  }

  // Process each input/textarea that is visible and enabled.
  async function processNameInput(input) {
    // Determine the field description from common attributes.
    let fieldDesc = input.getAttribute("placeholder") || input.getAttribute("aria-label") || "";
    if (!fieldDesc) {
      const id = input.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) fieldDesc = label.innerText;
      }
    }
    fieldDesc = (fieldDesc || "").toLowerCase();

    // Helper to fill the field and dispatch input events.
    async function fillField(value) {
      if (value && value.length > 0) {
        input.value = value;
        window.dispatchInputEvents(input);
        console.log(`✔ Filled field "${fieldDesc}" with value: ${value}`);
      }
    }

    // Direct matching for common name fields.
    if (fieldDesc.includes("first name") || fieldDesc.includes("given name")) {
      await fillField(userProfile.personal.firstName);
      return;
    }
    if (fieldDesc.includes("last name") || fieldDesc.includes("surname")) {
      await fillField(userProfile.personal.lastName);
      return;
    }
    if (fieldDesc.includes("full name") || fieldDesc.trim() === "name") {
      const fullName = `${userProfile.personal.firstName} ${userProfile.personal.lastName}`;
      await fillField(fullName);
      return;
    }

    // Use GPT fallback to identify the type of name field.
    const gptResult = await window.identifyNameFieldType(fieldDesc, openaiApiKey);
    console.log(`🤖 GPT result for "${fieldDesc}":`, gptResult);

    // Only fill if GPT is sufficiently confident.
    if (gptResult.confidence < 80) {
      console.log(`⚠ Confidence (${gptResult.confidence}%) too low for field "${fieldDesc}". Skipping.`);
      return;
    }

    // Map GPT output to our profile data.
    const fieldMap = {
      "first_name": userProfile.personal.firstName,
      "last_name": userProfile.personal.lastName,
      "full_name": `${userProfile.personal.firstName} ${userProfile.personal.lastName}`
    };

    if (gptResult.type in fieldMap) {
      await fillField(fieldMap[gptResult.type]);
    } else {
      console.log(`⚠ GPT returned unknown type "${gptResult.type}" for field "${fieldDesc}". Skipping.`);
    }
  }

  // Iterate over all input and textarea elements.
  const inputs = document.querySelectorAll("input, textarea");
  for (const input of inputs) {
    if (input.offsetParent !== null && !input.disabled) {
      await processNameInput(input);
    }
  }

  console.log("✅ Name fields filled using modularized GPT-assisted approach.");
}

// Expose the function globally so that your content script can call it.
window.capturePageAndFillNameFields = capturePageAndFillNameFields;
console.log("capturePageAndFillNameFields attached to window:", window.capturePageAndFillNameFields);
