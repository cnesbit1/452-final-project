import { useState } from "react";
import { useRef } from "react";

type AddJobProps = {
  navigateToView: () => void;
};

function AddJob({ navigateToView }: AddJobProps) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [resumeBytes, setResumeBytes] = useState<Uint8Array | null>(null);
  const [resumeFileExtension, setResumeFileExtension] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleResumeFile = (event: any) => {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const resumeStringBase64 = event.target?.result as string;

        // Remove unnecessary file metadata from the start of the string.
        const resumeStringBase64BufferContents =
          resumeStringBase64.split("base64,")[1];

        const binaryString = atob(resumeStringBase64BufferContents);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        setResumeBytes(bytes);
      };
      reader.readAsDataURL(file);

      // Set resume file extension (and move to a separate method)
      const fileExtension = getFileExtension(file);
      if (fileExtension) {
        setResumeFileExtension(fileExtension);
      }
    } else {
      setResumeBytes(null);
    }
  };

  const getFileExtension = (file: File): string | undefined => {
    return file.name.split(".").pop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ask Chrome for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];

      if (!tab || !tab.url) {
        setError(
          "Could not determine the current page URL. Open the job posting in a normal tab and try again."
        );
        return;
      }

      const href = tab.url; // this is what your server expects

      const { authToken } = await chrome.storage.local.get("authToken");

      try {
        const res = await fetch("http://localhost:8080/v1/tools/add-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authToken,
            companyName,
            position,
            description,
            href,
            resumeBytes,
            resumeFileExtension,
          }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message =
            body && (body.error || body.message)
              ? body.error || body.message
              : `Request failed (${res.status})`;
          setError(String(message));
          return;
        }

        // Success: clear the form
        setCompanyName("");
        setPosition("");
        setDescription("");
        setResumeBytes(null);
        setResumeFileExtension("");
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Tell Wrapper to switch to the list tab
        navigateToView();
      } catch (error) {
        setError(
          "Network error. Please check the server or your connection. " +
            String(error)
        );
        console.error(error);
      }
    });
  };

  return (
    <div className="container">
      <h2>This One’s Going to Pay the Bills</h2>
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

        <input
          type="file"
          onChange={handleResumeFile}
          id="file-upload-input"
          ref={fileInputRef}
        />

        <div className="button-group">
          <button type="submit" className="button">
            Add Job
          </button>
        </div>
      </form>

      <div style={{ marginTop: "15px" }}>
        <button 
            onClick={() => navigateToView()}
            style={{ marginTop: "15px", cursor: "pointer" }}
          >
            Return
      </button>
      </div>
    </div>
  );
}

export default AddJob;
