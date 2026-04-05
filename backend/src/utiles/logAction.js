import AuditLog from "../models/AuditLog.js";

const logAction = async (user, role, action, details) => {
  try {
    await AuditLog.create({
      user:user||"Unknown",
      role:role||"N/A",
      action:action||"N/A",
      details:details||"N/A"
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

export default logAction;
