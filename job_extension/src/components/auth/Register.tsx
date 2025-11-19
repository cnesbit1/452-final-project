import { useState } from "react";
import Auth from "./Auth";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  // Keep track of what the user types
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    setError(null);
    console.log("Registering:", { username, password });

    try {
      const response = await fetch('http://localhost:8080/v1/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => ({}));

      setUsername("");
      setPassword("");

      if (!response.ok) {
        const message =
          body && (body.error || body.message) ? (body.error || body.message) : `Request failed (${response.status})`;
        setError(String(message));
        return;
      }
      await chrome.storage.local.set({ authToken: body.token });
      navigate("/Tools");
    } catch (error) {
      setError("Network error — please check the server or your connection.");
      console.error(error);
      // Handle network or other errors
    }
  };

  return (
    <div className="container">
  <h2>Register</h2>
  {error && <div role="alert" className="error">{error}</div>}
  <Auth username={username} password={password} setPassword={setPassword} setUsername={setUsername} handleSubmit={handleSubmit}/>
      <div style={{ marginTop: '15px' }}>
        <Link to="/Login">Already have an account? Login</Link>
      </div>
    </div>
  );
}

export default Register;