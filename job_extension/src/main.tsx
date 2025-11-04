import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "./chrome-extension/popup/index";
import "./chrome-extension/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Small, compact container for the browser action popup */}
    <div className="bg-white w-[360px] max-h-[640px] p-4 rounded-md shadow-md">
      <Popup />
    </div>
  </StrictMode>
);
