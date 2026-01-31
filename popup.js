function render(meta, robots) {
  let indexingSignal = "Indexable signals present";

  if (meta.metaRobots.includes("noindex")) {
    indexingSignal = "Noindex detected";
  } else if (robots.blocksGoogle || robots.blocksAll) {
    indexingSignal = "Blocked from crawling";
  } else if (meta.canonical !== "Not found") {
    // Canonical exists but still indexable
    indexingSignal = "Indexable (canonical set)";
  }

  let robotsStatus = "Allowed for Googlebot";
  let robotsDetails = "";

  if (robots.blocksAll) {
    robotsStatus = "Blocked for all bots";
  } else if (robots.blocksGoogle) {
    robotsStatus = "Blocked for Googlebot";
  } else if (robots.blockedBots?.length) {
    robotsStatus = "Partially blocked";
    robotsDetails = `Blocked bots: ${robots.blockedBots.join(", ")}`;
  }

  output.innerHTML = `
    <div class="row"><strong>Indexing Signals:</strong> ${indexingSignal}</div>
    <div class="row"><strong>Meta Robots:</strong> ${meta.metaRobots}</div>
    <div class="row"><strong>Canonical:</strong> ${meta.canonical}</div>
    <div class="row">
      <strong>Robots.txt:</strong> ${robotsStatus}
      ${robotsDetails ? `<br><small>${robotsDetails}</small>` : ""}
    </div>
  `;
}
