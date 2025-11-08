import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DescriptionBox from "./DescriptionBox";

function AddJob(){

    const [companyName, setCompanyName] = useState("");
    const [position, setPosition] = useState("");
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleFileChange = (event: any) => {
        if (event.target.files.length > 0) {
        setResumeFile(event.target.files[0]); // Store the first file
        console.log('File selected:', event.target.files[0].name);
        } else {
        setResumeFile(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        // resume is not required
        e.preventDefault(); // stop page reload
        setError(null);
        setCompanyName("");
        setPosition("");
        navigate("/Tools");
        console.log(error);
        console.log(resumeFile);
  };

    return (
    <div className="container">
  <h2>Job: This is the one, I'm sure of it</h2>
  {/* {error && <div role="alert" className="error">{error}</div>} */}
  <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="input"
          required
        />
        <input
          type="text"
          placeholder="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="input"
          required
        />

        <DescriptionBox></DescriptionBox>

        <input 
        type="file" 
        onChange={handleFileChange} 
        id="file-upload-input" // Use an ID for linking with a custom label
        />
        <button type="submit" className="button">
          Add Job
        </button>
      </form>


      <div style={{ marginTop: '15px' }}>
        <Link to="/Tool">Return</Link>
      </div>
    </div>
  );


}

export default AddJob;