import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routers/authRoutes.js";
import uploadRoutes from "./routers/uploadRoutes.js";
import reconciliationRoutes from "./routers/reconciliationRoutes.js";
import dashboardRoutes from "./routers/dashboardRoutes.js";

dotenv.config();

const app = express();

/* ==============================
   CORS CONFIGURATION (FIXED)
================================ */
/*app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "X-Requested-With",
    ],
    credentials: true,
  })
);*/
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","Origin","X-Requested-with","Accept","Pragma","Cache-Control","expires"]
  })
);

/* Handle Preflight Requests */
//app.options("*", cors());

/* ==============================
   MIDDLEWARE
================================ */

app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json());

/* ==============================
   API ROUTES
================================ */

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reconcile", reconciliationRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* ==============================
   ROOT ROUTE
================================ */

app.get("/", (req, res) => {
  res.send("🚀 Smart Reconciliation & Audit System Backend is running...");
});

/* ==============================
   SERVER START
================================ */

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });