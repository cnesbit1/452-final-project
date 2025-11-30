import { useState } from "react";
import AddJob from "../add_job/AddJob";
import List from "../list/List";
import { useNavigate } from "react-router-dom";

type WrapperProps = {
  onLogout: () => void;
};

export default function Wrapper({ onLogout }: WrapperProps) {
  const [activeTab, setActiveTab] = useState("view");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { authToken } = await chrome.storage.local.get("authToken");
      const res = await fetch("http://localhost:8080/v1/auth/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        console.error("Request failed:", res.status);
        return;
      }
      await chrome.storage.local.remove("authToken");
      onLogout();
      navigate("/Login");
    } catch (err) {
      console.error("Error calling backend:", err);
    }
  };

  return (
    <div
      className="min-h-screen text-gray-900 w-full"
      style={{ backgroundColor: "#f8e9d2" }}
    >
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-4 py-3 shadow w-full"
        style={{ backgroundColor: "white" }}
      >
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-2xl transition shadow-sm ${
              activeTab === "view" ? "font-semibold" : "hover:bg-gray-100"
            }`}
            style={{
              backgroundColor: activeTab === "view" ? "#d4a574" : "transparent",
              color: activeTab === "view" ? "white" : "#374151",
            }}
            onClick={() => setActiveTab("view")}
          >
            View
          </button>

          <button
            className={`px-4 py-2 rounded-2xl transition shadow-sm ${
              activeTab === "add" ? "font-semibold" : "hover:bg-gray-100"
            }`}
            style={{
              backgroundColor: activeTab === "add" ? "#d4a574" : "transparent",
              color: activeTab === "add" ? "white" : "#374151",
            }}
            onClick={() => setActiveTab("add")}
          >
            Add
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-2xl text-white shadow hover:bg-red-600 transition"
          style={{ backgroundColor: "#dc2626" }}
        >
          Logout
        </button>
      </nav>

      {/* Page Content */}
      <div className="p-4 w-full">
        {activeTab === "view" && <List />}

        {activeTab === "add" && (
          <AddJob navigateToView={() => setActiveTab("view")} />
        )}
      </div>
    </div>
  );
}
