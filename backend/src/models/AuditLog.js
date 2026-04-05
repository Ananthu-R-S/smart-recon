import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  role: {
    type: String
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;