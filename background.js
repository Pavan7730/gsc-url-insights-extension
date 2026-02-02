const CLIENT_ID =
  "669869853203-3o9c91v211or0apbsm3c7aq6hp0ild5g.apps.googleusercontent.com";

const SCOPES = "https://www.googleapis.com/auth/webmasters.readonly";

// ---------------- MESSAGE HANDLER ----------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_GSC") {
    authenticate();
    return false; // 🔑 IMPORTANT for MV3
  }

  if (message.type === "FETCH_GSC_DATA") {
    fetchGSCData(message.payload, sendResponse);
    return true; // async response
  }
});

// ---------------- AUTH ----------------

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

// ---------------- DATA FETCH ----------------

async function fetchGSCData(payload, sendResponse) {
  chrome.storage.local.get("gscToken", async ({ gscToken }) => {
    if (!gscToken) {
      sendResponse({ error: "Not authenticated" });
      return;
    }

    const pageUrl = payload.url;
    const hostname = new URL(pageUrl).hostname;

    let startDate, endDate;

    if (payload.startDate && payload.endDate) {
      startDate = payload.startDate;
      endDate = payload.endDate;
    } else {
      const days = parseInt(payload.range || 7, 10);
      endDate = getDate(2);
      startDate = getDate(days + 2);
    }

    let siteUrl = `sc-domain:${hostname}`;

    // ---------- PAGE TOTALS ----------
    const totalsBody = {
      startDate,
      endDate,
      dimensions: [],
      dimensionFilterGroups: [{
        filters: [{
          dimension: "page",
          operator: "equals",
          expression: pageUrl
        }]
      }]
    };

    let totalsResponse = await callGSC(siteUrl, gscToken, totalsBody);

    if (totalsResponse.error && totalsResponse.error.code === 403) {
      siteUrl = new URL(pageUrl).origin + "/";
      totalsResponse = await callGSC(siteUrl, gscToken, totalsBody);
    }

    const totalsRow = totalsResponse.rows?.[0] || {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0
    };

    // ---------- QUERY DATA ----------
    const queryBody = {
      startDate,
      endDate,
      dimensions: ["query"],
      dimensionFilterGroups: [{
        filters: [{
          dimension: "page",
          operator: "equals",
          expression: pageUrl
        }]
      }],
      rowLimit: 10
    };

    let queryResponse = await callGSC(siteUrl, gscToken, queryBody);

    let fallback = false;
    if (!queryResponse.rows || queryResponse.rows.length === 0) {
      queryBody.dimensionFilterGroups[0].filters[0].operator = "contains";
      queryResponse = await callGSC(siteUrl, gscToken, queryBody);
      fallback = true;
    }

    sendResponse({
      totals: {
        clicks: totalsRow.clicks,
        impressions: totalsRow.impressions,
        ctr: totalsRow.ctr,
        position: totalsRow.position
      },
      queries: queryResponse.rows || [],
      fallback
    });
  });
}

// ---------------- API CALL ----------------

async function callGSC(siteUrl, token, body) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  return await res.json();
}

// ---------------- UTILS ----------------

function getDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
