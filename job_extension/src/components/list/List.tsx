import { useEffect, useState } from "react";
import JobDetailsRow from "./JobDetails";

export interface Job {
  id: string;
  position: string;
  company_name: string;
  status: string;
  date_applied: Date;
  posting_link: string;
  created_at: Date;
  resume_s3_link: string;
  posting_description: string;
}

export default function List() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const getItems = async () => {
    const { authToken } = await chrome.storage.local.get("authToken");
    let jobs = await fetch("http://localhost:8080/v1/tools/jobs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken,
      },
    });
    const jobsData = await jobs.json();
    setJobs(jobsData);
  };

  useEffect(() => {
    getItems();
  }, []);

  const toggleExpanded = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const { authToken } = await chrome.storage.local.get("authToken");
      const response = await fetch(
        `http://localhost:8080/v1/tools/jobs/${jobId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Update the local state to reflect the change
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId ? { ...job, status: newStatus } : job
          )
        );
      } else {
        console.error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  return (
    <div className="list-container">
      {jobs.length === 0 ? (
        <div className="empty-state">
          <img src="public/sadicon.png" alt="No jobs added" />
          <p>You have not added any jobs</p>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Position</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <>
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{job.company_name}</td>
                  <td className="p-3">{job.position}</td>
                  <td className="p-3">
                    <select
                      value={job.status}
                      onChange={(e) => updateJobStatus(job.id, e.target.value)}
                      className="px-2 py-1 rounded-full text-xs font-medium border-none cursor-pointer"
                      style={{
                        backgroundColor:
                          job.status === "applied"
                            ? "#dcfce7"
                            : job.status === "interview"
                            ? "#fef3c7"
                            : job.status === "offer"
                            ? "#dbeafe"
                            : job.status === "ghosted"
                            ? "#f3f4f6"
                            : "#fecaca",
                        color:
                          job.status === "applied"
                            ? "#166534"
                            : job.status === "interview"
                            ? "#92400e"
                            : job.status === "offer"
                            ? "#1e40af"
                            : job.status === "ghosted"
                            ? "#6b7280"
                            : "#991b1b",
                      }}
                    >
                      <option value="applied">applied</option>
                      <option value="interview">interview</option>
                      <option value="offer">offer</option>
                      <option value="ghosted">ghosted</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleExpanded(job.id)}
                      className="px-3 py-1 rounded-md text-sm font-medium transition hover:opacity-80"
                      style={{
                        backgroundColor: "#d4a574",
                        color: "white",
                      }}
                    >
                      {expandedJobId === job.id ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
                {expandedJobId === job.id && <JobDetailsRow job={job} />}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
