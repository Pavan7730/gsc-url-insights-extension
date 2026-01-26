chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_GSC") {
    console.log("GSC Auth requested");

    // OAuth logic will go here later
    // This is where we’ll integrate Google OAuth + backend
  }
});
