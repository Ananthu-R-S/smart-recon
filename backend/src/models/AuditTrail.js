import mongoose from "mongoose";

const auditTrailSchema = new mongoose.Schema(
  {
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReconciliationResult",
      required: true,
    },
    action: { type: String, required: true }, // e.g. "Manual Correction", "Status Updated"
    changedBy: { type: String, required: true }, // username or userId
    oldValue: { type: Object },
    newValue: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("AuditTrail", auditTrailSchema);