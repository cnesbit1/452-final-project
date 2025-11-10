import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddJob() {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (event: any) => {
    if (event.target.files.length > 0) {
      setResumeFile(event.target.files[0]); // Store the first file
      console.log("File selected:", event.target.files[0].name);
    } else {
      setResumeFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    setError(null);
    setCompanyName("");
    setPosition("");
    navigate("/Tools");
    console.log(error);
    console.log(resumeFile);

    chrome.runtime.sendMessage({ type: "GET_PAGE_HREF" }, async (response) => {
      let href = response.url;
      console.log("Here is the href", response);
      const { authToken } = await chrome.storage.local.get("authToken");
      try {
        const response = await fetch("http://localhost:8080/v1/tools/add-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authToken,
            companyName,
            position,
            description,
            href,
            resumeFile,
          }),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            body && (body.error || body.message)
              ? body.error || body.message
              : `Request failed (${response.status})`;
          setError(String(message));
          return;
        }
        navigate("/Tools");
      } catch (error) {
        setError(
          "Network error — please check the server or your connection." +
          String(error)
        );
        console.error(error);
      }
    });
  };

  const handleAutoFillAll = () => {
    // TODO: THIS IS WHERE IT'S GOING TO CALL THE SCRAPER
    chrome.runtime.sendMessage({ type: "GET_PAGE_HTML" }, (response) => {
      console.log("Page info received:", response); //response.href for our link
      // send to backend if needed
    });
    setCompanyName("Example Company");
    setPosition("Software Engineer");
    setDescription("This is a sample job description...");
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

        <div className="description-container">
          <label htmlFor="job-description">Job Description:</label>
          <textarea
            id="job-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8} // taller default height
            placeholder="Paste job description here..."
            className="description-textarea"
          />
        </div>

        <input type="file" onChange={handleFileChange} id="file-upload-input" />

        <div className="button-group">
          <button
            type="button"
            onClick={handleAutoFillAll}
            className="button autofill-button"
          >
            Auto-fill All
          </button>

          <button type="submit" className="button">
            Add Job
          </button>
        </div>
      </form>

      <div style={{ marginTop: "15px" }}>
        <Link to="/Tools">Return</Link>
      </div>
    </div>
  );
}

export default AddJob;
