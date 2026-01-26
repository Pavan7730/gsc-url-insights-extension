document.addEventListener("DOMContentLoaded", async () => {
  const urlEl = document.getElementById("currentUrl");

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (tab?.url) {
    urlEl.textContent = tab.url;
  } else {
    urlEl.textContent = "No active tab";
  }

  document.getElementById("connectBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "AUTH_GSC" });
  });
});
