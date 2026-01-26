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
      { type: "FETCH_GSC_DATA", url: currentUrl },
      renderData
    );
  };
});

function renderData(data) {
  const container = document.getElementById("result");

  if (data.error) {
    container.innerHTML = `<p>${data.error}</p>`;
    return;
  }

  if (!data.rows) {
    container.innerHTML = `<p>No data found</p>`;
    return;
  }

  container.innerHTML = `
    <p><strong>Top Keywords</strong></p>
    <ul>
      ${data.rows
        .map(
          r =>
            `<li>${r.keys[0]} — Clicks: ${r.clicks}, Impr: ${r.impressions}</li>`
        )
        .join("")}
    </ul>
  `;
}
