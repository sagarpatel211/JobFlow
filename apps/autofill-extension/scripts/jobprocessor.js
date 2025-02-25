import { getStoredApiKey } from "./storage.js";

export function processJobsSequentially(jobs) {
  let index = 0;

  async function processNext() {
    if (index >= jobs.length) {
      console.log("✅ All jobs processed.");
      return;
    }

    const job = jobs[index];
    console.log(`🔄 Processing job: ${job.link}`);

    let apiKey;
    try {
      apiKey = await getStoredApiKey();
      if (!apiKey) {
        console.error("❌ OpenAI API key missing. Skipping job.");
        index++;
        setTimeout(processNext, 500); // Short delay before skipping to next job
        return;
      }
    } catch (error) {
      console.error("❌ Error retrieving API key:", error);
      index++;
      setTimeout(processNext, 500);
      return;
    }

    chrome.tabs.create({ url: job.link, active: false }, (tab) => {
      if (!tab || !tab.id) {
        console.error("❌ Failed to create tab. Skipping job.");
        index++;
        setTimeout(processNext, 500);
        return;
      }

      setTimeout(() => {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ["content.js"] },
          () => {
            chrome.tabs.sendMessage(tab.id, {
              action: "fillForm",
              apiKey,
              job,
              serverURL: "https://localhost:3005",
            });

            console.log(`📩 Sent message to tab ${tab.id} for job: ${job.link}`);
          }
        );

        index++;
        setTimeout(processNext, 8000); // Wait before processing next job
      }, 5000);
    });
  }

  processNext();
}
