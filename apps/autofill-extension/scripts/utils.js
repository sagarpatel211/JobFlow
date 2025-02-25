// Dispatches events to trigger any listeners after setting input values
export function dispatchInputEvents(element) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

// Navigate to the next page if a "Next" button is found
export function navigateNextPage() {
  console.log("Checking for navigation element...");
  const nextBtn = Array.from(document.querySelectorAll("button, a")).find((btn) =>
    btn.textContent.toLowerCase().includes("next") ||
    btn.textContent.toLowerCase().includes("continue")
  );

  if (nextBtn) {
    console.log("Clicking 'Next' button...");
    nextBtn.click();
  } else {
    console.log("No navigation element found.");
  }
}
