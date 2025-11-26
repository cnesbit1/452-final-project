import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useRef } from "react";

type AddJobProps = {
  onJobAdded: () => void;
};

function AddJob({ onJobAdded }: AddJobProps) {
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  // const [error, setError] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [resumeBytes, setResumeBytes] = useState<Uint8Array | null>(null);
  const [resumeFileExtension, setResumeFileExtension] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // const navigate = useNavigate();

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
        onJobAdded();
      } catch (error) {
        setError(
          "Network error. Please check the server or your connection. " +
            String(error)
        );
        console.error(error);
      }
    });
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault(); // stop page reload
  //   setError(null);
  //   // setCompanyName("");
  //   // setPosition("");
  //   // navigate("/Tools");
  //   // console.log(error);
  //   // console.log(resumeBytes);

  //   chrome.runtime.sendMessage({ type: "GET_PAGE_HREF" }, async (response) => {
  //     let href = response.url;
  //     console.log("Here is the href", response);
  //     const { authToken } = await chrome.storage.local.get("authToken");
  //     try {
  //       const response = await fetch("http://localhost:8080/v1/tools/add-job", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           authToken,
  //           companyName,
  //           position,
  //           description,
  //           href,
  //           resumeBytes,
  //           resumeFileExtension,
  //         }),
  //       });

  //       const body = await response.json().catch(() => ({}));

  //       if (!response.ok) {
  //         const message =
  //           body && (body.error || body.message)
  //             ? body.error || body.message
  //             : `Request failed (${response.status})`;
  //         setError(String(message));
  //         return;
  //       }
  //       setCompanyName("");
  //       setPosition("");
  //       setDescription("");
  //       setResumeBytes(null);
  //       setResumeFileExtension("");
  //       if (fileInputRef.current) {
  //         fileInputRef.current.value = "";
  //       }

  //       // Tell the parent (Wrapper) to switch back to the list tab
  //       onJobAdded();

  //       // navigate("/Tools");
  //     } catch (error) {
  //       setError(
  //         "Network error — please check the server or your connection." +
  //           String(error)
  //       );
  //       console.error(error);
  //     }
  //   });
  // };

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
      <h2>This One’s Going to Pay the Bills</h2>
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

        <input
          type="file"
          onChange={handleResumeFile}
          id="file-upload-input"
          ref={fileInputRef}
        />

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
