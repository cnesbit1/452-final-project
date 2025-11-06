import { Routes, Route, useNavigate } from "react-router-dom";
import { Popup } from "./chrome-extension/popup";
import Login from "./chrome-extension/auth/Login";
import { useEffect } from "react";
import Register from "./chrome-extension/auth/Register";
// import Home from "./pages/Home";
// import About from "./pages/About";
// import NotFound from "./pages/NotFound";
//<Popup />
// the default path is *
function App() {

  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to some default route when popup mounts
    navigate("/Login"); // or whatever route you want
  }, []);

  
  return (
    <Routes>
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/" element={<Popup />} />
      <Route path="*" element={<Popup />} /> 
      {/* <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;