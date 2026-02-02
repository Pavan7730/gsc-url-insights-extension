let currentUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  currentUrl = tab.url;
  document.getElementById("url").textContent = currentUrl;

  // 🔐 CONNECT GSC (fire-and-forget, NO promise)
  document.getElementById("connect").onclick = () => {
    chrome.runtime.sendMessage({ type: "AUTH_GSC" }, () => {
      // intentionally empty to avoid MV3 error
    });
  };

  // Toggle custom date picker
  document.querySelectorAll('input[name="range"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.getElementById("customDates").classList.toggle(
        "hidden",
        radio.value !== "custom"
      );
    });
  });

  // 📊 FETCH DATA
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

// ---------------- RENDER ----------------

function renderData(data) {
  const container = document.getElementById("result");

  if (!data || data.error) {
    container.innerHTML = `<p>No data available</p>`;
    return;
  }

  const { totals, queries, fallback } = data;

  let html = `
    <p><strong>Total Clicks:</strong> ${totals.clicks}</p>
    <p><strong>Total Impressions:</strong> ${totals.impressions}</p>
    <p><strong>CTR:</strong> ${(totals.ctr * 100).toFixed(2)}%</p>
    <p><strong>Avg Position:</strong> ${totals.position.toFixed(1)}</p>
  `;

  if (fallback) {
    html += `<p style="color:#777;font-size:12px;">ℹ️ Grouped page queries (fallback)</p>`;
  }

  html += `
    <h4>Top Keywords</h4>
    <ul>
      ${queries.map(
        q =>
          `<li>${q.keys[0]} — Clicks: ${q.clicks}, Impr: ${q.impressions}</li>`
      ).join("")}
    </ul>
  `;

  container.innerHTML = html;
}
