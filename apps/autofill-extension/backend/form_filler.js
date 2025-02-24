// backend/form_filler.js

console.log("Inside form_filler.js");

async function capturePageAndFillForm(openaiApiKey, userProfile) {
  console.log("🚀 Starting form filling process in capturePageAndFillForm");
  
  // Ensure the page is fully loaded.
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve));
  }
  
  async function processInput(input) {
    let fieldDesc = input.getAttribute("placeholder") || input.getAttribute("aria-label") || "";
    if (!fieldDesc) {
      const id = input.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) fieldDesc = label.innerText;
      }
    }
    fieldDesc = (fieldDesc || "").toLowerCase();
    
    async function fillField(value) {
      if (value && value.length > 0) {
        input.value = value;
        window.dispatchInputEvents(input);
        console.log(`✔ Filled field "${fieldDesc}" with value: ${value}`);
      }
    }
    
    // Direct matching for common fields.
    if (fieldDesc.includes("first name") || fieldDesc.includes("given name")) {
      await fillField(userProfile.personal.firstName);
      return;
    }
    if (fieldDesc.includes("last name") || fieldDesc.includes("surname")) {
      await fillField(userProfile.personal.lastName);
      return;
    }
    if (fieldDesc.includes("email")) {
      await fillField(userProfile.personal.email);
      return;
    }
    if (fieldDesc.includes("phone")) {
      await fillField(userProfile.personal.phone);
      return;
    }
    if (fieldDesc.includes("resume")) {
      await fillField(userProfile.resume);
      return;
    }
    if (fieldDesc.includes("cover letter") || fieldDesc.includes("cover-letter")) {
      await fillField(userProfile.coverLetter);
      return;
    }
    if (fieldDesc.includes("sponsorship")) {
      await fillField(userProfile.additionalQuestions.sponsorship);
      return;
    }
    if (fieldDesc.includes("dei") || fieldDesc.includes("disability") || fieldDesc.includes("background")) {
      await fillField(userProfile.additionalQuestions.dei);
      return;
    }
    
    // Use GPT fallback for ambiguous fields.
    const gptResult = await window.identifyFieldType(fieldDesc, openaiApiKey);
    console.log(`🤖 GPT result for "${fieldDesc}":`, gptResult);
    
    if (gptResult.confidence < 80) {
      console.log(`⚠ Confidence (${gptResult.confidence}%) too low for field "${fieldDesc}". Skipping.`);
      return;
    }
    
    const fieldMap = {
      "first_name": userProfile.personal.firstName,
      "last_name": userProfile.personal.lastName,
      "email": userProfile.personal.email,
      "phone": userProfile.personal.phone,
      "resume": userProfile.resume,
      "cover_letter": userProfile.coverLetter,
      "sponsorship": userProfile.additionalQuestions.sponsorship,
      "dei": userProfile.additionalQuestions.dei
    };
    
    await fillField(fieldMap[gptResult.type]);
  }
  
  const inputs = document.querySelectorAll("input, textarea");
  for (const input of inputs) {
    if (input.offsetParent !== null && !input.disabled) {
      await processInput(input);
    }
  }
  
  console.log("✅ Form filled using modularized GPT-assisted approach.");
}

// Expose the function globally.
window.capturePageAndFillForm = capturePageAndFillForm;
console.log("capturePageAndFillForm attached to window:", window.capturePageAndFillForm);
