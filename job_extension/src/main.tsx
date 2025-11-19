import { createRoot } from "react-dom/client";
import "./global.css";
import { BrowserRouter } from "react-router-dom";
import App from "./popup-app";
import { StrictMode } from "react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Wider container for the job tracking extension popup */}
    <div
      className="w-[600px] min-h-[650px] max-h-[750px] overflow-auto"
      style={{ backgroundColor: "#f8e9d2" }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </div>
  </StrictMode>
);
