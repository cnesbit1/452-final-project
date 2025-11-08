import { useState } from "react";
import './auth.css';
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    setError(null);
    console.log("Logging in with:", { username, password });
    
    try {
      const response = await fetch('http://localhost:8080/v1/auth/login', {
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

      navigate("/Tools");
    } catch (error) {
      setError("Network error — please check the server or your connection." + String(error));
      console.error(error);
      // Handle network or other errors
    }
  };
  return (
    <div className="container">
  <h2>Login</h2>
  {error && <div role="alert" className="error">{error}</div>}
  <Auth username={username} password={password} setPassword={setPassword} setUsername={setUsername} handleSubmit={handleSubmit}/>
      <div style={{ marginTop: '15px' }}>
        <Link to="/Register">Not a user? Register</Link>
      </div>
    </div>
  );
}

export default Login;