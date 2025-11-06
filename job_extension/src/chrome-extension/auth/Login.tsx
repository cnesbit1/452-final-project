import { useState } from "react";
import './auth.css';
import Auth from "./Auth";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Login() {
  // Keep track of what the user types
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    console.log("Logging in with:", { username, password });
    // You can add your login logic here (e.g., API call)
    // Clear the input fields after submit
    setUsername("");
    setPassword("");
    navigate("/");
  };
  return (
    <div className="container">
  <h2>Login</h2>
  <Auth username={username} password={password} setPassword={setPassword} setUsername={setUsername} handleSubmit={handleSubmit}/>
      <div style={{ marginTop: '15px' }}>
        <Link to="/Register">Not a user? Register</Link>
      </div>
    </div>
  );
}

export default Login;