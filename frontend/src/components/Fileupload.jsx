import React, { useState } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
//import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";

const role = localStorage.getItem("role");
const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [mappings, setMappings] = useState({});
  const navigate = useNavigate();

  const requiredFields = [
    "Transaction ID",
    "Amount",
    "Reference Number",
    "Date",
  ];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview([]);
    setMessage("");
    setMappings({});
  };

  const validateMappings = () => {
    // Ensure each required field is mapped to some uploaded column
    const mappedTargets = Object.values(mappings);
    for (const rf of requiredFields) {
      if (!mappedTargets.includes(rf)) {
        return { ok: false, missing: rf };
      }
    }
    return { ok: true };
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:4000/api/upload/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPreview(res.data.preview);
      setMessage("File uploaded. Map columns and then run reconciliation.");

    } catch (err) {
      console.error(err);
      setMessage("Upload failed!");
    }
  };

  const handleRunReconcile = async () => {
    // validate mappings before running reconciliation
    const v = validateMappings();
    if (!v.ok) {
      setMessage(`Please map the required field: ${v.missing}`);
      return;
    }

    try {
      setMessage("Running reconciliation...");
      const token = localStorage.getItem("token");
      // build uploadedRecords using mapping (map columns to names backend expects)
      const uploadedRecords = preview.map((row) => {
        const mapped = {};
        for (const col of Object.keys(row)) {
          const target = mappings[col];
          if (!target) continue;
          // normalize keys to backend expected names
          if (target === "Transaction ID") mapped.transactionId = row[col];
          if (target === "Amount") mapped.amount = row[col];
          if (target === "Reference Number") mapped.referenceNumber = row[col];
          if (target === "Date") mapped.date = row[col];
        }
        return mapped;
      });

      const reconcileRes = await axios.post(
        "http://localhost:4000/api/reconcile/run",
        {
          uploadedRecords,
          systemRecords: [], // your backend will treat empty systemRecords as unmatched OR you can fetch real system records
          filename: file.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Reconciliation completed.");
      // redirect to dashboard showing latest (or can use jobId returned)
      if (reconcileRes.data?.jobId) {
        navigate(`/dashboard?jobId=${reconcileRes.data.jobId}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Reconcile failed:", err);
      setMessage("Reconciliation failed. Check console.");
    }
  };

  const handleMappingChange = (columnName, systemField) => {
    setMappings({ ...mappings, [columnName]: systemField });
  };

  const systemFields = [
    "Transaction ID",
    "Amount",
    "Reference Number",
    "Date",
  ];

  return (
    <div className="container mt-5">
      <h2>📤 File Upload & Column Mapping</h2>
      <div className="mb-3">
        <input type="file" onChange={handleFileChange} className="form-control" />
      </div>
      {(role === "admin" || role === "analyst") &&(
      <Button onClick={handleUpload} variant="primary" className="me-2">
        Upload File
      </Button>
      )}
      <Button onClick={handleRunReconcile} variant="success">
        Run Reconciliation
      </Button>

      {message && <p className="mt-3">{message}</p>}

      {preview.length > 0 && (
        <div className="mt-4">
          <h4>🧾 Preview (First 20 Rows)</h4>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                {Object.keys(preview[0]).map((col) => (
                  <th key={col}>
                    {col}
                    <FormSelect
                      options={systemFields}
                      value={mappings[col] || ""}
                      onChange={(val) => handleMappingChange(col, val)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

// small inline Form.Select equivalent so code is self-contained
const FormSelect = ({ options, value, onChange }) => (
  <div className="mt-1">
    <select
      className="form-select form-select-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Map to --</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

export default FileUpload;