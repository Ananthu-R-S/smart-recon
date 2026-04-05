import mongoose from "mongoose";

const uploadJobSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true }, // ✅ keep lowercase to match the route
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Processing", "Running", "Completed", "Failed"], // ✅ added "Running"
      default: "Processing",
    },
    recordCount: { type: Number, default: 0 },
    reconciledCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("UploadJob", uploadJobSchema);