document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const dashboard = document.getElementById("dashboard");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const signinBtn = document.getElementById("signin-btn");
  const userEmailSpan = document.getElementById("user-email");
  const fillAiBtn = document.getElementById("fill-ai-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Mock Sign-In
  signinBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (email && password) {
      // Simulate login success
      localStorage.setItem("user", JSON.stringify({ email }));
      userEmailSpan.textContent = email;
      loginContainer.classList.add("hidden");
      dashboard.classList.remove("hidden");
    } else {
      alert("Please enter email and password.");
    }
  });

  // Mock Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    dashboard.classList.add("hidden");
    loginContainer.classList.remove("hidden");
  });

  // Show Dashboard if Already Logged In
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    userEmailSpan.textContent = user.email;
    loginContainer.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  // Mock AI Autofill Action
  fillAiBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJobInfo // Defined below
      }, (results) => {
        if (results && results[0] && results[0].result) {
          const jobData = results[0].result;
          console.log("Extracted job data:", jobData);
          alert(`AI is filling job application for ${jobData.jobTitle}`);
        }
      });

    } catch (error) {
      console.error("Error executing script:", error);
    }
  });
});

// Function to extract job info in the active tab
function extractJobInfo() {
  return {
    jobTitle: document.querySelector("h1")?.innerText || "Unknown Job",
    company: document.querySelector(".company-name")?.innerText || "Unknown Company",
    description: document.querySelector(".job-description")?.innerText || "No description available."
  };
}
