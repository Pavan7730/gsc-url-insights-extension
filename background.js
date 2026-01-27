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
      endDate = getDate(2);           // GSC delay buffer
      startDate = getDate(days + 2);
    }

    let siteUrl = `sc-domain:${hostname}`;

    // --------------------------------------------------
    // 1️⃣ PAGE TOTALS (NO DIMENSIONS)
    // --------------------------------------------------

    const totalsBody = {
      startDate,
      endDate,
      dimensions: [],
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
      ]
    };

    let totalsResponse = await callGSC(siteUrl, gscToken, totalsBody);

    // fallback for URL-prefix property
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

    // --------------------------------------------------
    // 2️⃣ QUERY DATA (EXACT → FALLBACK)
    // --------------------------------------------------

    const queryBody = {
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

    let queryResponse = await callGSC(siteUrl, gscToken, queryBody);

    if (!queryResponse.rows || queryResponse.rows.length === 0) {
      queryBody.dimensionFilterGroups[0].filters[0].operator = "contains";
      queryResponse = await callGSC(siteUrl, gscToken, queryBody);
      queryResponse.fallback = true;
    } else {
      queryResponse.fallback = false;
    }

    // --------------------------------------------------
    // FINAL RESPONSE TO UI
    // --------------------------------------------------

    sendResponse({
      totals: {
        clicks: totalsRow.clicks,
        impressions: totalsRow.impressions,
        ctr: totalsRow.ctr,
        position: totalsRow.position
      },
      queries: queryResponse.rows || [],
      fallback: queryResponse.fallback
    });
  });
}
