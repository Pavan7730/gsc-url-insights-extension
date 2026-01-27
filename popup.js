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

  // Toggle custom date inputs
  document.querySelectorAll('input[name="range"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.getElementById("customDates").classList.toggle(
        "hidden",
        radio.value !== "custom"
      );
    });
  });

  document.getElementById("fetch").onclick = () => {
    const range = document.querySelector('input[name="range"]:checked').value;

    let payload = { url: currentUrl };

    if (range === "custom") {
      payload.startDate = document.getElementById("fromDate").value;
      payload.endDate = document.getElementById("toDate").value;
    } else {
      payload.range = range;
    }

    chrome.runtime.sendMessage(
      { type: "FETCH_GSC_DATA", payload },
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

  if (!data.rows || data.rows.length === 0) {
    container.innerHTML = `<p>No data found</p>`;
    return;
  }

  const totalClicks = data.rows.reduce((a, b) => a + b.clicks, 0);
  const totalImpr = data.rows.reduce((a, b) => a + b.impressions, 0);

  container.innerHTML = `
    <p><strong>Total Clicks:</strong> ${totalClicks}</p>
    <p><strong>Total Impressions:</strong> ${totalImpr}</p>

    <h4>Top Keywords</h4>
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
