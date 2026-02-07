const CLIENT_ID =
  "669869853203-la12753n1ac5u8m5apt26fmgcnliprq0.apps.googleusercontent.com";

const SCOPES =
  "https://www.googleapis.com/auth/webmasters.readonly";

// ---------------- MESSAGE HANDLER ----------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_GSC") {
    authenticate();
    return false;
  }

  if (message.type === "FETCH_GSC_DATA") {
    fetchGSCData(message.payload, sendResponse);
    return true;
  }
});

// ---------------- AUTH (PKCE) ----------------

async function authenticate() {
  const redirectUri = chrome.identity.getRedirectURL();

  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = btoa(
    String.fromCharCode(...new Uint8Array(digest))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await chrome.storage.local.set({ codeVerifier });

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&response_type=code" +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=" + encodeURIComponent(SCOPES) +
    "&code_challenge=" + codeChallenge +
    "&code_challenge_method=S256" +
    "&prompt=consent";

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    async redirectUrl => {
      if (!redirectUrl) return;

      const url = new URL(redirectUrl);
      const code = url.searchParams.get("code");
      if (!code) return;

      exchangeCodeForToken(code, redirectUri);
    }
  );
}

async function exchangeCodeForToken(code, redirectUri) {
  const { codeVerifier } = await chrome.storage.local.get("codeVerifier");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await res.json();

  if (data.access_token) {
    chrome.storage.local.set({ gscToken: data.access_token });
  }
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

    const endDate = getDate(2);
    const startDate = getDate(9);

    let siteUrl = `sc-domain:${hostname}`;

    const body = {
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

    let response = await callGSC(siteUrl, gscToken, body);

    sendResponse({ queries: response.rows || [] });
  });
}

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

function getDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
