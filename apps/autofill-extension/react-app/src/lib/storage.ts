export function setStoredApiKey(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      console.log("✅ OpenAI API key saved.");
      resolve();
    });
  });
}

export function getStoredApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("openaiApiKey", (data) => {
      resolve(data.openaiApiKey || null);
    });
  });
}
