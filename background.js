const CLIENT_ID =
  "669869853203-3o9c91v211or0apbsm3c7aq6hp0ild5g.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/webmasters.readonly";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_GSC") {
    authenticate();
  }

  if (message.type === "FETCH_GSC_DATA") {
    fetchGSCData(message.url, sendResponse);
    return true;
  }
});

function authenticate() {
  const redirectUri = chrome.identity.getRedirectURL();

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + encodeURIComponent(SCOPES) +
    "&prompt=consent";

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (redirectUrl) => {
      if (!redirectUrl) return;

      const params = new URLSearchParams(redirectUrl.split("#")[1]);
      const token = params.get("access_token");

      chrome.storage.local.set({ gscToken: token });
      console.log("✅ GSC token stored");
    }
  );
}

async function fetchGSCData(payload, sendResponse) {
  chrome.storage.local.get("gscToken", async ({ gscToken }) => {
    if (!gscToken) {
      sendResponse({ error: "Not authenticated" });
      return;
    }

    const pageUrl = payload.url;
    const siteUrl = new URL(pageUrl).origin + "/";

    let startDate, endDate;

    if (payload.startDate && payload.endDate) {
      startDate = payload.startDate;
      endDate = payload.endDate;
    } else {
      const days = parseInt(payload.range || 3, 10);
      endDate = getDate(2); // GSC delay buffer
      startDate = getDate(days + 2);
    }

    const body = {
      startDate,
      endDate,
      dimensions: ["query"],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "equals",
              expression: pageUrl
            }
          ]
        }
      ],
      rowLimit: 10
    };

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
        siteUrl
      )}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gscToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const data = await res.json();
    sendResponse(data);
  });
}
function getDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
