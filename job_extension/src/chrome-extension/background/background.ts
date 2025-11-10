
interface GetMessage { // message to receive
  type: string//"GET_PAGE_HTML";
}

interface listenerResponse{
  error?: string
}
interface PageHrefResponse extends listenerResponse{
  url: string;
}
interface PageHtmlResponse extends listenerResponse {
  html: string;
}

// The core listener function is strongly typed.
// The listener arguments use the types from the 'chrome' namespace.
chrome.runtime.onMessage.addListener(
  (
    message: GetMessage, // Expect only messages matching this interface
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: listenerResponse | { error: string }) => void // Define the expected response type
  ): boolean | undefined => {

    if (message.type === "GET_PAGE_HTML" || message.type === "GET_PAGE_HREF") {
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        if (!tab || tab.id === undefined) {
          sendResponse({ error: "No active tab found." });
          return;
        }
        
        let scriptToExecute: (() => Promise<any>) | undefined;

        if(message.type === "GET_PAGE_HTML" ){
          scriptToExecute = () => {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  html: document.documentElement.outerHTML,
                });
              }, 2000); // wait 2 seconds for JS to render
            });
          };
        }
        else if (message.type === "GET_PAGE_HREF"){
          scriptToExecute = () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                url: window.location.href,
              });
            }, 2000); // wait 2 seconds for JS to render
          });
        };
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            // The 'func' property expects a function signature that matches the return type
            func: scriptToExecute!,
          },
          (results) => {
            // Check for errors (e.g., if the user tried to run it on a restricted page)
            if (chrome.runtime.lastError || !results || results.length === 0) {
              const errorMessage = chrome.runtime.lastError?.message || "Failed to retrieve page HTML.";
              console.error("Script execution error:", errorMessage);
              sendResponse({ error: errorMessage });
              return;
            }

            // Results is an array, we get the result property from the first item
            // convert to the appropiate type
            if(message.type === "GET_PAGE_HTML"){
               const pageData = results[0].result as PageHtmlResponse; 
              sendResponse(pageData);

            }
            else if(message.type === "GET_PAGE_HREF"){
              const pageData = results[0].result as PageHrefResponse; 
              sendResponse(pageData);
            }
            
          }
        );
      });
      // Required for async sendResponse: we return true to keep the message channel open.
      return true;
    }

    // For any message type we don't handle, we return nothing (or false), which is the default behavior.
    return undefined;
  }
);
