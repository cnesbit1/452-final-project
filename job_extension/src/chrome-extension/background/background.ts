
interface GetMessage { // message to receive
  type: string//"GET_PAGE_HTML";
}

chrome.runtime.onMessage.addListener(
  (message: GetMessage, _sender, sendResponse) => {
    if (message.type === "GET_PAGE_HREF") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        
        if (!tab?.url) {
          sendResponse({ error: "No active tab found." });
          return;
        }
        
        // Tab object already has the URL!
        sendResponse({ url: tab.url });
      });
      return true;
    }
    return undefined;
  }
);

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});