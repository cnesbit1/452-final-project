import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import { useEffect, useState } from "react";
import Register from "./components/auth/Register";
import Wrapper from "./components/wrapper/Wrapper";
// the default path is *
function App() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Navigate to some default route when popup mounts
    const checkAuth = async () => {
      const { authToken } = await chrome.storage.local.get("authToken");
      console.log("found authtoken", authToken);
      if (!authToken) {
        setVerified(false);
      } else {
        try {
          const res = await fetch("http://localhost:8080/v1/auth/status", {
            headers: { authorization: `Bearer ${authToken}` },
          });
          setVerified(await res.ok);
        } catch (error) {
          console.error(error);
        }
      }
    };
    checkAuth();
    navigate("/Login");
  }, []);

  return (
    <Routes>
      <Route
        path="/Login"
        element={verified ? <Navigate to="/Tools" replace /> : <Login />}
      />
      <Route path="/Register" element={<Register />} />
      <Route path="/Tools" element={<Wrapper />} />
      <Route path="/" element={<Wrapper />} />
      <Route path="*" element={<Wrapper />} />
    </Routes>
  );
}

export default App;
