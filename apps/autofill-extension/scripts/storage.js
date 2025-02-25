export function getStoredApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["authToken"], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.authToken || null);
      }
    });
  });
}
