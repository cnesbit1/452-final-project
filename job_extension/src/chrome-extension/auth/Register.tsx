import { useState } from "react";
import Auth from "./Auth";
import './auth.css';
import { Link, useNavigate } from "react-router-dom";

function Register() {
  // Keep track of what the user types
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    console.log("Registering:", { username, password });
    // You can add your login logic here (e.g., API call)
    setUsername("");
    setPassword("");
    navigate("/");
  };
  return (
    <div className="container">
  <h2>Register</h2>
  <Auth username={username} password={password} setPassword={setPassword} setUsername={setUsername} handleSubmit={handleSubmit}/>
      <div style={{ marginTop: '15px' }}>
        <Link to="/Login">Already have an account? Login</Link>
      </div>
    </div>
  );
}

export default Register;