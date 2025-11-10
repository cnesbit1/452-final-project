import { Link, useNavigate } from "react-router-dom";
import './Tools.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll } from '@fortawesome/free-solid-svg-icons';

function Tools(){
  const navigate = useNavigate();
  const tools = [
    {
      id: 1,
      title: 'Add New Job',
      subtitle: 'Start tracking a new application.',
      path: '/AddJob',
      icon: <FontAwesomeIcon icon={faScroll} size="2x" color="blue" />,
      callout: '(Good on you!)'
    },
    {
      id: 2,
      title: 'Review Applications',
      subtitle: 'View, filter, and manage all your current job entries.',
      path: '/applications', // Changed to a more specific path
      // icon: <FaListAlt className="tool-icon" />,
    },
    // Add more tools here...
  ];

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
      navigate("/Login");
    } catch (err) {
      console.error("Error calling backend:", err);
    }
  };

  return (
    <div className="tools-container">
      <h2 className="tools-header">Application Tools</h2>
      <p className="tools-subheader">Select an action to get started.</p>
      <button onClick={handleLogout} className="my-button">
      Logout
     </button>

      <div className="tools-list">
        {tools.map((tool) => (
          // Use the Link to wrap the entire tile for a larger click target
          <Link key={tool.id} to={tool.path} className="tool-tile-link">
            <div className="tool-tile">
              {tool.icon}
              <div className="tool-content">
                <h3 className="tool-title">{tool.title} {tool.callout && <span className="tool-callout">{tool.callout}</span>}</h3>
                <p className="tool-subtitle">{tool.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

}

export default Tools;