import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

const ReconciliationDashboard = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("jobId");
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    partial: 0,
    duplicate: 0,
    unmatched: 0,
    accuracy: 0,
  });
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [filters, setFilters] = useState({
    status: "All",
    uploadedBy: "",
    startDate: "",
    endDate: "",
  });

  // ✅ Fetch data from backend with filters
  const fetchReconciliationSummary = useCallback(async (customFilters = {}) => {
    try {
      const token = localStorage.getItem("token");
      //const query = new URLSearchParams(customFilters, jobId).toString();
      const params = { ...customFilters };
        if (jobId && jobId !== "null") params.jobId = jobId;

      const query = new URLSearchParams(params).toString();
      const res = await axios.get(
        `http://localhost:4000/api/reconcile/summary${query ? `?${query}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.summary)
        ? res.data.summary
        : [];

      calculateStats(data);
    } catch (err) {
      console.error("❌ Error fetching filtered summary:", err);
    }
  }, [jobId]);

  // ✅ Calculate dashboard stats
  const calculateStats = (data) => {
    const matched = data.filter((r) => r.status === "Matched").length;
    const partial = data.filter((r) => r.status === "Partially Matched").length;
    const duplicate = data.filter((r) => r.status === "Duplicate").length;
    const unmatched = data.filter((r) => r.status === "Unmatched").length;
    const total = data.length;
    const accuracy = total ? ((matched + partial * 0.5) / total) * 100 : 0;

    setStats({
      total,
      matched,
      partial,
      duplicate,
      unmatched,
      accuracy: accuracy.toFixed(2),
    });
  };

  // ✅ Load data on first render
  useEffect(() => {
    if(jobId){
    fetchReconciliationSummary(/*filters*/ {jobId});
    } else{
      fetchReconciliationSummary();
    }
  }, [fetchReconciliationSummary,/* filters*/jobId]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // const handleApplyFilters = () => {
  //   console.log("Filters:",filters)
  //   fetchReconciliationSummary(filters);
  // };
const handleApplyFilters = () => {
  console.log("Filters:", filters);

  const params = new URLSearchParams({
    status: filters.status || "",
    uploadedBy: filters.uploadedBy || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || ""
  });

  window.history.replaceState(null, "", `?${params.toString()}`);

  fetchReconciliationSummary(filters);
};
  // ✅ Navigation buttons (added)
  // const handleViewDetails = () => {
  //   window.location.href = "/reconciliation-view";
  // };
const handleViewDetails = () => {
  const params = new URLSearchParams({
    status: filters.status || "",
    uploadedBy: filters.uploadedBy || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    jobId: jobId||""
  });
  if (jobId) params.append("jobId", jobId);
  if (filters.status && filters.status !== "All") params.append("status", filters.status);
  if (filters.uploadedBy) params.append("uploadedBy", filters.uploadedBy);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  navigate(`/reconciliation-view?${params.toString()}`);
};
  const handleHistory = () => {
    window.location.href = "/history";
  };
  const handleAuditLogs = () => {
  navigate("/audit-logs");
};
const handleUpload = () => {
  navigate("/upload");
};

  const chartData = {
    labels: ["Matched", "Partial", "Duplicate", "Unmatched"],
    datasets: [
      {
        label: "Reconciliation Summary",
        data: [stats.matched, stats.partial, stats.duplicate, stats.unmatched],
        backgroundColor: ["#4CAF50", "#bdae1f", "#9C27B0", "#F44336"],
      },
    ],
  };
  const handleExport = async () => {

  try {

    const token = localStorage.getItem("token");

    const queryParams = new URLSearchParams();

    if (filters.status && filters.status !== "All") {
      queryParams.append("status", filters.status);
    }

    if (filters.uploadedBy) {
      queryParams.append("uploadedBy", filters.uploadedBy);
    }

    if (filters.startDate) {
      queryParams.append("startDate", filters.startDate);
    }

    if (filters.endDate) {
      queryParams.append("endDate", filters.endDate);
    }

    const res = await axios.get(
      `http://localhost:4000/api/reconcile/export?${queryParams.toString()}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      }
    );

    const data = res.data;

    if (!data.length) {
      alert("No data to export");
      return;
    }

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "reconciliation_results.csv";

    a.click();

  } catch (error) {
    console.error("Export failed:", error);
  }

};
const handleLogout=()=> {
  const confirmLogout = window.confirm("Are you sure you want to logout");
  if(confirmLogout){
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  }
};

  return (
    <div className="container mt-6">
      {/* ✅ Title + Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📊 Reconciliation Dashboard</h2>
        <div className="d-flex align-items-center">
        <Button
          variant="danger"
          className="me-2"
          onClick={handleLogout}
        >
          🚪 Logout
        </Button>
        </div>
      </div>
      
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          {role === "admin" && (
          <Button variant="outline-primary" onClick={handleAuditLogs}>
            🧾 Audit Logs
          </Button>
          )}
            <div>
          <Button variant="secondary" className="me-2" onClick={handleViewDetails}>
            🔍 View Details
          </Button>
          <Button variant="outline-primary" onClick={handleHistory}>
            📜 History
          </Button>
        </div>
          <Button variant="primary" className="me-2" onClick={handleUpload}>
            ⬆ Upload File
          </Button>
          </div>
      </div>

      {/* 🔹 Filter Section */}
      <div className="mb-4 p-3 border rounded bg-light">
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option>All</option>
                <option>Matched</option>
                <option>Partially Matched</option>
                <option>Duplicate</option>
                <option>Unmatched</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Uploaded By</Form.Label>
              <Form.Control
                type="text"
                name="uploadedBy"
                placeholder="Enter username"
                value={filters.uploadedBy}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="text-end mt-3">
          <Button variant="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
      <Button variant="primary" onClick={handleExport}>
          Export Results
      </Button>

      {/* 🔹 Summary Cards */}
      <Row className="mt-4">
        <Col md={2}>
          <Card className="p-3 text-center bg-primary text-white">
            <h5>Total</h5>
            <h3>{stats.total}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="p-3 text-center bg-success text-white">
            <h5>Matched</h5>
            <h3>{stats.matched}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="p-3 text-center bg-warning text-dark">
            <h5>Partial</h5>
            <h3>{stats.partial}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="p-3 text-center bg-info text-white">
            <h5>Duplicate</h5>
            <h3>{stats.duplicate}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="p-3 text-center bg-danger text-white">
            <h5>Unmatched</h5>
            <h3>{stats.unmatched}</h3>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="p-3 text-center bg-secondary text-white">
            <h5>Accuracy (%)</h5>
            <h3>{stats.accuracy}</h3>
          </Card>
        </Col>
      </Row>

      {/* 🔹 Chart */}
      <div className="mt-5 w-50 mx-auto">
        <Pie data={chartData} />
      </div>
    </div>
  );
};

export default ReconciliationDashboard;
