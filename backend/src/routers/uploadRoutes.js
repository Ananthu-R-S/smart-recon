import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import xlsx from "xlsx";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ✅ Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "src", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Upload and preview first 20 rows (NO remapping)
router.post(
  "/upload",
  authMiddleware(["admin", "analyst"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const filePath = req.file.path;
      let records = [];

      if (req.file.originalname.endsWith(".csv")) {
        // ✅ Read CSV exactly as-is (keep headers)
        const csvData = fs.readFileSync(filePath);
        // 🧠 Auto-detect delimiter (comma, semicolon, tab)
const csvContent = csvData.toString();
let detectedDelimiter = ",";

if (csvContent.includes(";")) detectedDelimiter = ";";
else if (csvContent.includes("\t")) detectedDelimiter = "\t";

const parser = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: detectedDelimiter,
});

        for await (const record of parser) {
          records.push(record);
          if (records.length >= 20) break;
        }
      } else if (req.file.originalname.endsWith(".xlsx")) {
        // ✅ Handle Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        records = jsonData.slice(0, 20);
      } else {
        return res
          .status(400)
          .json({ message: "Only CSV or Excel files are supported." });
      }

      // ✅ Return preview of original structure (no renaming)
      res.json({
        message: "File uploaded successfully",
        preview: records,
        filePath,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res
        .status(500)
        .json({ message: "File upload failed", error: err.message });
    }
  }
);

export default router;