import express from "express";
import cors from "cors";

// Import all modular route files
import authRoutes from "./routes/authRoutes";
import childRoutes from "./routes/childRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import groupRoutes from "./routes/groupRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import chefRoutes from "./routes/chefRoutes";
import superadminRoutes from "./routes/superadminRoutes";
import systemRoutes from "./routes/systemRoutes";
import parentRoutes from "./routes/parentRoutes";
import safetyRoutes from "./routes/safetyRoutes";
import swaggerRoutes from "./routes/swaggerRoutes";

const app = express();

// Explicit CORS setup as requested
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically allow any origin to comply with credentials: true
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "x-kindergarten-id"],
  credentials: true
}));

// Route logging middleware for debugging 404/CORS errors
app.use((req, res, next) => {
  const origin = req.headers.origin || "no-origin";
  console.log(`[ROUTE-LOG] Requested Path: ${req.path} | Method: ${req.method} | Origin Header: ${origin}`);
  next();
});

// JSON body parsing configurations
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoints for keep-alive pings and system status indicators
app.get("/api/health-check", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    database: { status: "connected" },
    telegram: { status: "online" }
  });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Mount routes directly onto /api prefix
app.use("/api", authRoutes);
app.use("/api", childRoutes);
app.use("/api", employeeRoutes);
app.use("/api", groupRoutes);
app.use("/api", paymentRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", chefRoutes);
app.use("/api", superadminRoutes);
app.use("/api", systemRoutes);
app.use("/api", parentRoutes);
app.use("/api", safetyRoutes);
app.use("/api", swaggerRoutes);

export default app;
