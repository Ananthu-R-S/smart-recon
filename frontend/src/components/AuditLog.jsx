import { useEffect, useState } from "react";
import axios from "axios";

function AuditLogs() {

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {

    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:4000/api/reconcile/audit-logs",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setLogs(res.data);

  };

  /*return (
    <div>

      <h2>Audit Logs</h2>

      <table >

        <thead className="table-dark text-center">
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Action</th>
            <th>Details</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{log.user}</td>
              <td>{log.role}</td>
              <td>{log.action}</td>
              <td>{log.details}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );*/
  return (
  <div className="container mt-5">

    <h2 className="mb-4 text-center">🧾 Audit Logs</h2>

    <table className="table table-bordered table-hover text-center">

      <thead className="table-dark">
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Action</th>
          <th>Details</th>
          <th>Date</th>
        </tr>
      </thead>

      <tbody>
        {logs.length === 0 ? (
          <tr>
            <td colSpan="5">No audit logs found</td>
          </tr>
        ) : (
          logs.map((log) => (
            <tr key={log._id}>
              <td>{log.user}</td>
              <td>{log.role}</td>
              <td>{log.action}</td>
              <td>{log.details}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))
        )}
      </tbody>

    </table>

  </div>
);
}

export default AuditLogs;