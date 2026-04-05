import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ListGroup, Badge, Button } from "react-bootstrap";

const AuditTimeline = () => {
  const { recordId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:4000/api/reconcile/audit/${recordId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Error fetching audit trail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditTrail();
  }, [recordId]);

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>🕓 Audit Timeline</h2>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>

      {loading ? (
        <p>Loading timeline...</p>
      ) : logs.length === 0 ? (
        <p>No audit trail found for this record.</p>
      ) : (
        <ListGroup>
          {logs.map((log, idx) => (
            <ListGroup.Item key={idx} className="mb-3 border-start border-5 border-primary shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{log.action}</strong>
                <Badge bg="info">{new Date(log.createdAt).toLocaleString()}</Badge>
              </div>
              <div className="text-muted small mt-1">Changed by: {log.changedBy}</div>
              {log.oldValue && (
                <div className="mt-2">
                  <strong>Old Value:</strong>
                  <pre className="bg-light p-2 rounded">
                    {JSON.stringify(log.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {log.newValue && (
                <div>
                  <strong>New Value:</strong>
                  <pre className="bg-light p-2 rounded">
                    {JSON.stringify(log.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default AuditTimeline;