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
          setVerified(false);
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
        element={
          verified ? (
            <Navigate to="/Tools" replace />
          ) : (
            <Login onLoginSuccess={() => setVerified(true)} />
          )
        }
      />
      <Route path="/Register" element={<Register />} />
      <Route
        path="/Tools"
        element={
          verified ? (
            <Wrapper onLogout={() => setVerified(false)} />
          ) : (
            <Navigate to="/Login" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          verified ? (
            <Wrapper onLogout={() => setVerified(false)} />
          ) : (
            <Navigate to="/Login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Wrapper onLogout={() => setVerified(false)} />}
      />
    </Routes>
  );
}

export default App;
