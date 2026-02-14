chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;

  document.getElementById("title").textContent = tab.title || "-";
  document.getElementById("url").textContent = tab.url || "-";

  try {
    document.getElementById("domain").textContent =
      new URL(tab.url).hostname;
  } catch {
    document.getElementById("domain").textContent = "-";
  }
});
