import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Table, Badge, Button, Modal, Form, Row, Col } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

const ReconciliationView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    systemRecordId: "",
    status: "",
    differences: "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Read filters from URL
  const params = new URLSearchParams(location.search);

  const jobId = params.get("jobId");
  const status = params.get("status");
  const uploadedBy = params.get("uploadedBy");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  // ✅ Fetch records safely
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // ✅ Build query params dynamically
      const queryParams = new URLSearchParams();

      if (jobId) queryParams.append("jobId", jobId);
      if (status && status !== "All") queryParams.append("status", status);
      if (uploadedBy) queryParams.append("uploadedBy", uploadedBy);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      // const url = `http://localhost:4000/api/reconcile/summary?${
      //   queryParams.toString()
      // }`;
      const query = queryParams.toString();
      const url = `http://localhost:4000/api/reconcile/summary${query ? `?${query}` : ""}`;
      const res = await axios.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Cache-Control": "no-cache",
        },
      });

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.summary)
        ? res.data.summary
        : [];

      setRecords(data);
    } catch (err) {
      console.error("❌ Error loading reconciliation data:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, status, uploadedBy, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ✅ Color badges by status
  const getBadgeColor = (status) => {
    switch (status) {
      case "Matched":
        return "success";
      case "Partially Matched":
        return "warning";
      case "Duplicate":
        return "info";
      default:
        return "danger";
    }
  };

  // ✅ Open edit modal
  const openEdit = (rec) => {
    setEditing(rec);
    setForm({
      systemRecordId: rec.systemRecordId || "",
      status: rec.status || "",
      differences: rec.differences
        ? JSON.stringify(rec.differences, null, 2)
        : "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({ systemRecordId: "", status: "", differences: "" });
  };

  const handleFormChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // ✅ Save manual corrections
  const saveEdit = async () => {
    if (!editing) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized: Please login first.");
        return;
      }

      let difObj = {};
      if (form.differences.trim() !== "") {
        try {
          difObj = JSON.parse(form.differences);
        } catch (err) {
          alert("⚠️ Differences must be valid JSON format.");
          return;
        }
      }

      const updates = {
        systemRecordId: form.systemRecordId || null,
        status: form.status || editing.status,
        differences: Object.keys(difObj).length ? difObj : {},
      };

      const res = await axios.patch(
        `http://localhost:4000/api/reconcile/record/${editing._id} `,
        {
          updates,
          changedBy: localStorage.getItem("username") || "Manual",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (res.data?.record) {
        setRecords((prev) =>
          prev.map((r) => (r._id === editing._id ? res.data.record : r))
        );
      }

      alert("✅ Record updated successfully!");
      closeEdit();
    } catch (err) {
      console.error("❌ Failed to save changes:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unknown network issue";
      alert("Save failed: " + msg);
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>🔍 Reconciliation View</h2>
        <div>
          <Button
            variant="outline-info"
            className="me-2"
            onClick={() => navigate("/history")}
          >
            View History
          </Button>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Loading reconciliation data...</p>
      ) : records.length === 0 ? (
        <p>No reconciliation results found.</p>
      ) : (
        <Table bordered hover responsive>
          <thead>
            <tr className="table-dark text-center">
              <th>#</th>
              <th>Uploaded Record ID</th>
              <th>System Record ID</th>
              <th>Status</th>
              <th>Differences</th>
              <th>Audit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => {
              const rowStyle =
                r.status === "Partially Matched"
                  ? { backgroundColor: "#fff8e1" }
                  : r.status === "Unmatched"
                  ? { backgroundColor: "#fff0f0" }
                  : {};

              return (
                <tr key={r._id || idx} style={rowStyle}>
                  <td>{idx + 1}</td>
                  <td>{r.uploadedRecordId || "—"}</td>
                  <td>{r.systemRecordId || "—"}</td>
                  <td className="text-center">
                    <Badge bg={getBadgeColor(r.status)}>{r.status}</Badge>
                  </td>
                  <td>
                    {r.differences && Object.keys(r.differences).length > 0 ? (
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(r.differences, null, 2)}
                      </pre>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => navigate(`/timeline/${r._id}`)}
                    >
                      View Timeline
                    </Button>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => openEdit(r)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Edit Modal */}
      <Modal show={!!editing} onHide={closeEdit} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Record {editing?.uploadedRecordId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>System Record ID</Form.Label>
                  <Form.Control
                    name="systemRecordId"
                    value={form.systemRecordId}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                  >
                    <option>Matched</option>
                    <option>Partially Matched</option>
                    <option>Duplicate</option>
                    <option>Unmatched</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Differences (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="differences"
                value={form.differences}
                onChange={handleFormChange}
                placeholder='e.g. {"amountDiff": 10 }'
              />
              <Form.Text className="text-muted">
                Enter JSON for differences (or leave empty to clear).
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEdit}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEdit}>
            Save changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ReconciliationView;