import { Link } from "react-router-dom";
import './Tools.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll } from '@fortawesome/free-solid-svg-icons';
function Tools(){
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

  return (
    <div className="tools-container">
      <h2 className="tools-header">Application Tools</h2>
      <p className="tools-subheader">Select an action to get started.</p>

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