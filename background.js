async function checkRobots(pageUrl) {
  try {
    if (!pageUrl.startsWith("http")) {
      return { skipped: true };
    }

    const url = new URL(pageUrl);
    const robotsUrl = `${url.origin}/robots.txt`;

    const res = await fetch(robotsUrl);
    const text = await res.text();

    const blocksAll = /User-agent:\s*\*\s*[\s\S]*?Disallow:\s*\//i.test(text);
    const blocksGoogle = /User-agent:\s*Googlebot[\s\S]*?Disallow:\s*\//i.test(text);

    const blockedBots = [];
    if (/User-agent:\s*AhrefsBot[\s\S]*?Disallow:\s*\//i.test(text)) blockedBots.push("AhrefsBot");
    if (/User-agent:\s*SemrushBot[\s\S]*?Disallow:\s*\//i.test(text)) blockedBots.push("SemrushBot");

    return {
      robotsUrl,
      blocksAll,
      blocksGoogle,
      blockedBots
    };
  } catch (e) {
    return { error: true };
  }
}
