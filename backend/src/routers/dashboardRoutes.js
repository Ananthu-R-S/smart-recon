import express from "express";
import ReconciliationResult from "../models/ReconciliationResult.js";
import UploadJob from "../models/UploadJob.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", authMiddleware(["admin", "analyst", "viewer"]), async (req, res) => {
  try {
    const { startDate, endDate, status, uploadedBy } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const results = await ReconciliationResult.find(filter);
    const total = results.length;
    const matched = results.filter((r) => r.status === "Matched").length;
    const partial = results.filter((r) => r.status === "Partially Matched").length;
    const duplicate = results.filter((r) => r.status === "Duplicate").length;
    const unmatched = results.filter((r) => r.status === "Unmatched").length;
    const accuracy = ((matched + partial * 0.5) / total) * 100 || 0;

    res.json({ total, matched, partial, duplicate, unmatched, accuracy });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
});

export default router;