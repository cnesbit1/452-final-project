import { useState } from 'react';
import './DescriptionBox.css';

function DescriptionBox() {
  const [description, setDescription] = useState('');
  const defaultDescription = "Must be able to hold breath for 30 seconds";
  const handleChange = (event: any) => {setDescription(event.target.value);};

  // Handler for the auto-fill button click
  // TODO: replace with scraper feature
  const handleAutoFill = () => { setDescription(defaultDescription);};

  return (
    <div className="description-container">
      <label htmlFor="job-description">Job Description:</label>
      <textarea
        id="job-description"
        value={description}
        onChange={handleChange}
        rows={2} // Set the default visible height to 8 lines
        placeholder="Paste job description here..."
        className="description-textarea"
      />

      <button 
        type="button" // Use type="button" to prevent form submission
        onClick={handleAutoFill}
        className="autofill-button"
      >
        Auto-fill with Template
      </button>
    </div>
  );
}

export default DescriptionBox;