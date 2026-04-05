import mongoose from "mongoose";

const reconciliationResultSchema = new mongoose.Schema(
  {
    systemRecordId: { type: String },
    uploadedRecordId: { type: String },
    status: {
      type: String,
      enum: ["Matched", "Partially Matched", "Duplicate", "Unmatched"],
      required: true,
    },
    differences: { type: Object, default: {} },
    uploadJobId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadJob" },
  },
  { timestamps: true }
);

export default mongoose.model("ReconciliationResult", reconciliationResultSchema);