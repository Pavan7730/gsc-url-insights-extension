document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (tab && tab.url) {
      document.getElementById("url").textContent = tab.url;
    } else {
      document.getElementById("url").textContent = "No active page";
    }
  } catch (e) {
    document.getElementById("url").textContent = "Unable to read URL";
  }
});
