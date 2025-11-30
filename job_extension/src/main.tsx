import { createRoot } from "react-dom/client";
import "./global.css";
import { BrowserRouter } from "react-router-dom";
import App from "./popup-app";
import { StrictMode } from "react";
import DynamicSizeWrapper from "./components/DynamicPopupSizeWrapper";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Responsive container for the job tracking extension popup */}
    <div
      className="w-full h-full overflow-auto"
      style={{ backgroundColor: "#f8e9d2", minHeight: "100vh" }}
    >
      <BrowserRouter>
        <DynamicSizeWrapper>
          <App />
        </DynamicSizeWrapper>
      </BrowserRouter>
    </div>
  </StrictMode>
);
