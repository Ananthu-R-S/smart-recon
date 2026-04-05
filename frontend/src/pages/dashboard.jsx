import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Row, Col } from "react-bootstrap";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const ReconciliationDashboard = () => {
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    partial: 0,
    duplicate: 0,
    unmatched: 0,
    accuracy: 0
  });

  useEffect(() => {
    fetchReconciliationSummary();
  }, []);

  const fetchReconciliationSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/reconcile/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSummary(res.data);
      calculateStats(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const calculateStats = (data) => {
    const matched = data.filter((r) => r.status === "Matched").length;
    const partial = data.filter((r) => r.status === "Partially Matched").length;
    const duplicate = data.filter((r) => r.status === "Duplicate").length;
    const unmatched = data.filter((r) => r.status === "Unmatched").length;
    const total = data.length;
    const accuracy = ((matched + partial * 0.5) / total) * 100;

    setStats({
      total,
      matched,
      partial,
      duplicate,
      unmatched,
      accuracy: accuracy.toFixed(2),
    });
  };

  const chartData = {
    labels: ["Matched", "Partial", "Duplicate", "Unmatched"],
    datasets: [
      {
        label: "Reconciliation Summary",
        data: [stats.matched, stats.partial, stats.duplicate, stats.unmatched],
        backgroundColor: ["#4CAF50", "#FFEB3B", "#9C27B0", "#F44336"],
      },
    ],
  };

  return (
    <div className="container mt-5">
      <h2>📊 Reconciliation Dashboard</h2>

      <Row className="mt-4">
        <Col md={2}>
          <Card className="p-3 text-center bg-primary text-white">
            <h5>Total Records</h5>
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

      <div className="mt-5 w-50 mx-auto">
        <Pie data={chartData} />
      </div>
    </div>
  );
};

export default ReconciliationDashboard;