// backend/dispatch_events.js

function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// Expose globally.
window.dispatchInputEvents = dispatchInputEvents;
