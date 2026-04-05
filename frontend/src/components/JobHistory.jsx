import React, { useEffect, useState } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import { Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const JobHistory = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/reconcile/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (err) {
      console.error("⚠️ Error fetching job history:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetails = (jobId) => {
    navigate(`/dashboard?jobId=${jobId}`);
  };
  

  return (
    <div className="container mt-5">
      <h2>📜 Reconciliation Job History</h2>
      <Button variant="secondary" onClick={() => navigate(-1)}>
                  ← Back 
      </Button>
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : jobs.length === 0 ? (
        <p className="mt-3">No reconciliation jobs found.</p>
      ) : (
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Filename</th>
              <th>Status</th>
              <th>Records</th>
              <th>Reconciled</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index) => (
              <tr key={job._id}>
                <td>{index + 1}</td>
                <td>{job.filename}</td>
                <td>
                  <span
                    className={`badge bg-${
                      job.status === "Completed"
                        ? "success"
                        : job.status === "Failed"
                        ? "danger"
                        : "warning"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td>{job.recordCount}</td>
                <td>{job.reconciledCount}</td>
                <td>{new Date(job.startedAt).toLocaleString()}</td>
                <td>
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString()
                    : "--"}
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => handleViewDetails(job._id)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default JobHistory;