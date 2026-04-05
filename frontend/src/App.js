import React from "react";
import Fileupload from "./components/Fileupload";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReconciliationDashboard from "./components/ReconciliationDashboard";
import JobHistory from "./components/JobHistory";
import ReconciliationView from "./components/ReconciliationView";
import AuditTimeline from "./components/AuditTimeline";
import Login from "./pages/Login";
import ProtectedRoute from "./components/projectedRoutes";
import AuditLog from "./components/AuditLog";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/upload" element={<Fileupload />} />
        <Route path="/dashboard" 
        element={<ProtectedRoute allowedRoles={["admin","analyst","viewer"]}>
        <ReconciliationDashboard />
        </ProtectedRoute>} />
        <Route path="/history" 
        element={<ProtectedRoute allowedRoles={["admin"]}>
        <JobHistory />
        </ProtectedRoute>} />
        <Route path="/reconciliation-view" 
        element={<ProtectedRoute allowedRoles={["admin","analyst","viewer"]}><ReconciliationView />
        </ProtectedRoute>} />
        <Route path="/timeline/:recordId" element={<AuditTimeline />} />
        <Route path="/audit-logs" element={<AuditLog />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
