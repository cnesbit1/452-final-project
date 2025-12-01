import { useState, useEffect } from "react";
import { Job } from "./List";

type JobDetailsRowProps = {
  job: Job;
};

export default function JobDetailsRow({ job }: JobDetailsRowProps) {
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [ghostStat, setGhostStat] = useState<number | null>(null);
  const [isLoadingGhostStat, setIsLoadingGhostStat] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchGhostStat();
  }, [job.company_name]);

  const handleLinkClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  const fetchGhostStat = async () => {
    if (!job.company_name || ghostStat !== null) return;

    setIsLoadingGhostStat(true);
    try {
      const { authToken } = await chrome.storage.local.get("authToken");
      const response = await fetch(
        `http://localhost:8080/v1/tools/get-ghost-stat/${encodeURIComponent(
          job.company_name
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Company not found, skip setting ghost stat
          return;
        }
        throw new Error("Failed to fetch ghost stat");
      }

      const data = await response.json();
      setGhostStat(data.ghost_stat);
    } catch (error) {
      console.error("Error fetching ghost stat:", error);
    } finally {
      setIsLoadingGhostStat(false);
    }
  };

  const viewResume = async () => {
    if (!job.resume_s3_link) return;

    setIsLoadingResume(true);
    try {
      const { authToken } = await chrome.storage.local.get("authToken");
      const response = await fetch(
        "http://localhost:8080/v1/tools/get-resume/" +
          encodeURIComponent(job.resume_s3_link),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resume");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      // Clean up previous URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(blobUrl);
    } catch (error) {
      console.error("Error viewing resume:", error);
      alert("Failed to load resume. Please try again.");
    } finally {
      setIsLoadingResume(false);
    }
  };

  const closePdfViewer = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <tr>
      <td colSpan={4}>
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <strong>Applied:</strong>
              <p>{formatDate(job.date_applied)}</p>
            </div>
            <div>
              <strong>Link:</strong>
              <div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(job.posting_link);
                  }}
                >
                  Job Posting
                </a>
              </div>
            </div>
            {job.resume_s3_link && (
              <div>
                <strong>Resume:</strong>
                <div>
                  <button
                    onClick={viewResume}
                    disabled={isLoadingResume}
                    className="button"
                    style={{ padding: "4px 12px", fontSize: "14px" }}
                  >
                    {isLoadingResume ? "Loading..." : "View Resume"}
                  </button>
                </div>
              </div>
            )}
            {(ghostStat !== null || isLoadingGhostStat) && (
              <div>
                <strong>Ghost Rate:</strong>
                <div>
                  {isLoadingGhostStat ? (
                    "Loading..."
                  ) : (
                    <>
                      On average, this company ghosts{" "}
                      <strong>{(ghostStat! * 100).toFixed(1)}%</strong> of
                      applicants.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {job.posting_description && (
            <div>
              <strong>Job Description:</strong>
              <div style={{ maxHeight: "128px", overflowY: "auto" }}>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {job.posting_description.length > 500
                    ? `${job.posting_description.substring(0, 500)}...`
                    : job.posting_description}
                </div>
              </div>
            </div>
          )}

          {pdfUrl && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "16px",
                  width: "90%",
                  height: "80%",
                  maxWidth: "800px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>Resume Preview</h3>
                  <button
                    onClick={closePdfViewer}
                    className="button secondary-button"
                  >
                    ×
                  </button>
                </div>
                <iframe
                  src={pdfUrl}
                  style={{ width: "100%", height: "calc(100% - 60px)" }}
                  title="Resume PDF"
                />
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
