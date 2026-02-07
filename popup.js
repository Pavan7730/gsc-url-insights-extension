let currentUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || !tab.url) return;

    currentUrl = tab.url;
    document.getElementById("url").textContent = currentUrl;
  } catch (e) {
    console.error(e);
  }

  // CONNECT GSC
  document.getElementById("connect").onclick = () => {
    try {
      chrome.runtime.sendMessage({ type: "AUTH_GSC" });
      document.getElementById("result").innerHTML =
        "<p>🔐 Opening Google login…</p>";
    } catch (e) {
      console.error(e);
    }
  };

  // FETCH DATA
  document.getElementById("fetch").onclick = () => {
    try {
      chrome.runtime.sendMessage(
        { type: "FETCH_GSC_DATA", payload: { url: currentUrl } },
        response => {
          if (chrome.runtime.lastError) {
            document.getElementById("result").innerHTML =
              "<p>⚠️ Please connect GSC first</p>";
            return;
          }
          renderData(response);
        }
      );
    } catch (e) {
      console.error(e);
    }
  };
});

function renderData(data) {
  const el = document.getElementById("result");

  if (!data || data.error) {
    el.innerHTML = "<p>No data available</p>";
    return;
  }

  if (!data.queries || data.queries.length === 0) {
    el.innerHTML = "<p>No queries found</p>";
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
