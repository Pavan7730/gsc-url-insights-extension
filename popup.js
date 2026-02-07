let currentUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  currentUrl = tab.url;
  document.getElementById("url").textContent = currentUrl;

  document.getElementById("connect").onclick = () => {
    chrome.runtime.sendMessage({ type: "AUTH_GSC" });
  };

  document.getElementById("fetch").onclick = () => {
    chrome.runtime.sendMessage(
      { type: "FETCH_GSC_DATA", payload: { url: currentUrl } },
      response => {
        if (chrome.runtime.lastError) return;
        renderData(response);
      }
    );
  };
});

function renderData(data) {
  const el = document.getElementById("result");

  if (!data || !data.queries) {
    el.innerHTML = "<p>No data</p>";
    return;
  }

  el.innerHTML = `
    <ul>
      ${data.queries
        .map(q => `<li>${q.keys[0]} — ${q.clicks}</li>`)
        .join("")}
    </ul>
  `;
}
