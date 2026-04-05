import express from "express";
import mongoose from "mongoose";
import ReconciliationResult from "../models/ReconciliationResult.js";
import authMiddleware from "../middleware/auth.js";
import UploadJob from "../models/UploadJob.js";
import AuditTrail from "../models/AuditTrail.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import logAction from "../utiles/logAction.js";
import AuditLog from "../models/AuditLog.js";
const router = express.Router();

/**
 * 🟢 POST /api/reconcile/run
 */
router.post("/run", authMiddleware(["admin", "analyst"]), authorizeRoles ("admin", "analyst"), async (req, res) => {
  try {
    const uploadedRecords = Array.isArray(req.body?.uploadedRecords)
      ? req.body.uploadedRecords
      : [];

    const systemRecords = Array.isArray(req.body?.systemRecords)
      ? req.body.systemRecords
      : [];

    const rules = req.body?.rules || {};
    const results = [];

    const uploader =
      req.body?.uploadedBy && mongoose.Types.ObjectId.isValid(req.body.uploadedBy)
        ? req.body.uploadedBy
        : undefined;

    const newJob = await UploadJob.create({
      filename:
        req.body?.filename ||
        (uploadedRecords.length ? `uploaded_${Date.now()}` : "ManualRun"),
      ...(uploader ? { uploadedBy: uploader } : {}),
      status: "Processing",
      startedAt: new Date(),
    });

    // 🟡 If system records empty → all unmatched
    if (systemRecords.length === 0) {

      const unmatched = uploadedRecords.map((u) => ({
        systemRecordId: null,
        uploadedRecordId:
          typeof u.transactionId === "string" ? u.transactionId.trim() : "N/A",
        status: "Unmatched",
        differences: { reason: "No system records available" },
      }));

      await ReconciliationResult.insertMany(
        unmatched.map((r) => ({ ...r, uploadJobId: newJob._id }))
      );

      await UploadJob.findByIdAndUpdate(newJob._id, {
        status: "Completed",
        reconciledCount: unmatched.length,
        completedAt: new Date(),
      });

      return res.json({
        message: "Reconciliation completed",
        summary: unmatched,
        jobId: newJob._id,
      });
    }

    // duplicate detection
    const countMap = {};
    for (const rec of uploadedRecords) {
      const id =
        typeof rec.transactionId === "string"
          ? rec.transactionId.trim()
          : null;

      if (id) countMap[id] = (countMap[id] || 0) + 1;
    }

    const seen = new Set();

    for (const uploaded of uploadedRecords) {

      const txId =
        typeof uploaded.transactionId === "string"
          ? uploaded.transactionId.trim()
          : null;

      const uploadedAmount = Number(uploaded.amount);

      const ref =
        typeof uploaded.referenceNumber === "string"
          ? uploaded.referenceNumber.trim()
          : null;

      if (!txId || isNaN(uploadedAmount)) {
        results.push({
          systemRecordId: null,
          uploadedRecordId: txId || "N/A",
          status: "Unmatched",
          differences: { reason: "Missing transactionId or amount" },
        });
        continue;
      }

      if (countMap[txId] > 1 && seen.has(txId)) {
        results.push({
          systemRecordId: null,
          uploadedRecordId: txId,
          status: "Duplicate",
          differences: {},
        });
        continue;
      }

      seen.add(txId);

      const sysExact = systemRecords.find(
        (s) =>
          typeof s.transactionId === "string" &&
          s.transactionId.trim() === txId &&
          Math.abs(Number(s.amount) - uploadedAmount) < 0.0001
      );

      if (sysExact) {
        results.push({
          systemRecordId: sysExact.transactionId,
          uploadedRecordId: txId,
          status: "Matched",
          differences: {},
        });
        continue;
      }

      const variance =
        typeof rules.amountVariance === "number" ? rules.amountVariance : 0.2;

      const sysPartial = systemRecords.find((s) => {

        if (!s.referenceNumber || typeof s.referenceNumber !== "string" || !ref)
          return false;

        if (s.referenceNumber.trim() !== ref) return false;

        const sysAmt = Number(s.amount);

        if (isNaN(sysAmt) || sysAmt === 0) return false;

        const diff = Math.abs(sysAmt - uploadedAmount) / sysAmt;

        return diff > 0 && diff <= variance;

      });

      if (sysPartial) {
        results.push({
          systemRecordId: sysPartial.transactionId,
          uploadedRecordId: txId,
          status: "Partially Matched",
          differences: {
            amountDiff: uploadedAmount - Number(sysPartial.amount),
          },
        });
        continue;
      }

      results.push({
        systemRecordId: null,
        uploadedRecordId: txId,
        status: "Unmatched",
        differences: {},
      });
    }

    await ReconciliationResult.insertMany(
      results.map((r) => ({ ...r, uploadJobId: newJob._id }))
    );

    await UploadJob.findByIdAndUpdate(newJob._id, {
      status: "Completed",
      reconciledCount: results.length,
      completedAt: new Date(),
    });
    console.log("Current User",req.user);
    await logAction(
    req.username,
    req.user.role,
    "FILE_UPLOAD",
    "User uploaded reconciliation file"
    );
    res.json({
      message: "Reconciliation completed",
      summary: results,
      jobId: newJob._id,
    });
   

  } catch (err) {
    console.error("Reconciliation error:", err);
    res.status(500).json({
      message: "Reconciliation failed",
      error: err.message
    });
  }
});


/**
 * 🔹 GET /api/reconcile/summary
 */
router.get("/summary", authMiddleware(["admin", "analyst","viewer"]), authorizeRoles ("admin", "analyst","viewer"), async (req, res) => {

  try {

    const { jobId } = req.query;

    let job = jobId;

    // use latest job if none provided
    if (!job) {
      const latestJob = await UploadJob.findOne().sort({ createdAt: -1 });
      if (latestJob) job = latestJob._id;
    }

    //const filter = job ? { uploadJobId: job } : {};
    let filter = job ? { uploadJobId: job } :{};

const { status, uploadedBy, startDate, endDate } = req.query;

// status filter
if (status && status !== "All") {
  filter.status = status;
}

// uploadedBy filter
if (uploadedBy && uploadedBy.trim() !== "") {
  filter.uploadedBy = uploadedBy;
}

// date range filter
// if (startDate || endDate) {
//   filter.createdAt = {};

//   if (startDate) {
//     filter.createdAt.$gte = new Date(startDate);
//   }

//   if (endDate) {
//     filter.createdAt.$lte = new Date(endDate);
//   }
// }
if (startDate || endDate) {

  const dateFilter = {};

  if (startDate) {
    dateFilter.createdAt = { ...dateFilter.createdAt, $gte: new Date(startDate) };
  }

  if (endDate) {
    dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate + "T23:59:59.999Z") };
  }

  const jobs = await UploadJob.find(dateFilter).select("_id");

  const jobIds = jobs.map(j => j._id);

  filter.uploadJobId = { $in: jobIds };

}
    const results = await ReconciliationResult.find(filter);

    let total = results.length;
    let matched = 0;
    let unmatched = 0;
    let partial = 0;
    let duplicate = 0;

    results.forEach((r) => {
      if (r.status === "Matched") matched++;
      else if (r.status === "Unmatched") unmatched++;
      else if (r.status === "Partially Matched") partial++;
      else if (r.status === "Duplicate") duplicate++;
    });
    await logAction(
    req.user.username,
    req.user.role,
    "VIEW_DASHBOARD",
    "User viewed reconciliation dashboard"
    );
    res.json({
      total,
      matched,
      unmatched,
      partial,
      duplicate,
      summary: results
    });
  } catch (err) {

    console.error("Summary fetch error:", err);

    res.status(500).json({
      message: "Failed to fetch summary",
      error: err.message
    });

  }

});

router.get("/history", authMiddleware(["admin"]/*,"analyst"]*/), authorizeRoles ("admin"/*, "analyst"*/), async (req,res)=>{
   try{

      const jobs = await UploadJob.find().sort({createdAt:-1});

      res.json(jobs);

   }catch(err){

      console.error("History fetch error:",err);

      res.status(500).json({
        message:"Failed to fetch job history"
      });

   }
});


/**
 * 🔹 PATCH /api/reconcile/record/:id
 */
router.patch("/record/:id", authMiddleware(["admin","analyst"]), authorizeRoles ("admin", "analyst"), async (req, res) => {

  try {

    const recordId = req.params.id;
    const updates = req.body?.updates || {};
    const changedBy = req.body?.changedBy || "Manual";

    const existing = await ReconciliationResult.findById(recordId);

    if (!existing)
      return res.status(404).json({ message: "Record not found" });

    const oldValue = {};

    for (const key of Object.keys(updates)) oldValue[key] = existing[key];

    const allowed = [
      "uploadedRecordId",
      "systemRecordId",
      "status",
      "differences",
    ];

    const apply = {};

    Object.keys(updates).forEach((k) => {
      if (allowed.includes(k)) apply[k] = updates[k];
    });

    const updated = await ReconciliationResult.findByIdAndUpdate(
      recordId,
      { $set: apply },
      { returnDocument: "after" }
    );

    await AuditTrail.create({
      recordId,
      action: "Manual Correction",
      changedBy,
      oldValue,
      newValue: apply,
    });

    res.json({
      message: "Record updated",
      record: updated
    });

  } catch (err) {

    console.error("Record update error:", err);

    res.status(500).json({
      message: "Failed to update record",
      error: err.message
    });

  }

});


/**
 * 🔹 GET /api/reconcile/audit/:recordId
 */
router.get("/audit/:recordId", authMiddleware(["admin","analyst","viewer"]), authorizeRoles ("admin", "analyst","viewer"), async (req, res) => {

  try {

    const { recordId } = req.params;

    const logs = await AuditTrail.find({ recordId })
      .sort({ createdAt: -1 });

    res.json(logs);

  } catch (err) {

    console.error("Audit fetch error:", err);

    res.status(500).json({
      message: "Failed to fetch audit trail",
      error: err.message
    });

  }

});
router.get("/export", authMiddleware(["admin","analyst","viewer"]), async (req, res) => {
  try {

    const { status, uploadedBy, startDate, endDate } = req.query;

    let filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (uploadedBy) {
      filter.uploadedBy = uploadedBy;
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const results = await ReconciliationResult.find(filter);

    res.json(results);

  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
});
router.get("/export", authMiddleware(["admin","analyst","viewer"]), async (req, res) => {
  try {

    const results = await ReconciliationResult.find({});

    // Save audit log
    console.log("Current User",req.user);
    await logAction(
      req.user.username,
      req.user.role,
      "EXPORT_DATA",
      "User exported reconciliation results"
    );

    res.json(results);

  } catch (error) {
    res.status(500).json({ message: "Export failed" });
  }
});
router.get(
  "/audit-logs",
  authMiddleware(["admin"]),
  async (req, res) => {
    try {

      const logs = await AuditLog
        .find({})
        .sort({ createdAt: -1 });

      res.json(logs);

    } catch (error) {

      res.status(500).json({
        message: "Failed to fetch audit logs"
      });

    }
  }
);

export default router;