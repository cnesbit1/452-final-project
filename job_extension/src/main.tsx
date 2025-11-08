import { createRoot } from "react-dom/client";
import "./global.css";
import { BrowserRouter } from "react-router-dom";
import App from "./popup-app";
import { StrictMode } from "react";


createRoot(document.getElementById("root")!).render(

  <StrictMode>
    {/* Small, compact container for the browser action popup */}
    <div className="bg-white w-[360px] max-h-[640px] p-4 rounded-md shadow-md">
      <BrowserRouter>
      <App />
    </BrowserRouter>
    </div>
  </StrictMode>
);
