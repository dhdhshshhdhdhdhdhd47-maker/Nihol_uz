import { Router } from "express";
import { SystemController } from "../controllers/systemController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/dashboard/statistics", validateKindergartenData, SystemController.getDashboardStats);
router.get("/financial-reports", validateKindergartenData, SystemController.getFinancialReport);
router.get("/accountant/ai-insights", validateKindergartenData, SystemController.getAiInsights);

// Hardware status
router.get("/hardware/status", SystemController.getHardwareDevices);
router.post("/hardware/status", SystemController.createHardwareDevice);

// Hardware devices (alias for DirectorDashboard)
router.get("/hardware/devices", SystemController.getHardwareDevices);
router.post("/hardware/devices", SystemController.createHardwareDevice);
router.put("/hardware/devices/:id", SystemController.updateHardwareDevice);
router.delete("/hardware/devices/:id", SystemController.deleteHardwareDevice);

// SMS queue
router.get("/telegram-simulator/pending-sms", SystemController.getPendingSms);
router.post("/telegram-simulator/pending-sms/clear", SystemController.clearPendingSms);

// Telegram queue & simulator
router.get("/telegram-simulator/pending-messages", SystemController.getPendingTelegramMessages);
router.get("/telegram-simulator/status", SystemController.getTelegramSimulatorStatus);
router.post("/telegram-simulator/toggle-error", SystemController.toggleTelegramError);
router.get("/telegram-simulator/logs", SystemController.getTelegramSimulatorLogs);
router.post("/telegram-simulator/message", SystemController.sendTelegramSimulatorMessage);
router.post("/telegram-simulator/test-connection", SystemController.testTelegramConnection);

// Global Logs & Notifications
router.get("/sms/logs", SystemController.getSmsLogs);
router.post("/sms/send", SystemController.sendSms);
router.get("/notifications/history", SystemController.getTelegramNotifications);
router.post("/notifications/send", SystemController.sendNotification);
router.post("/notifications/broadcast", SystemController.broadcastNotification);

// Gemini Deep Dive
router.post("/gemini/attendance-deep-dive", SystemController.attendanceDeepDive);

// System Factory Reset
router.post("/admin/reset-db", SystemController.clearDatabase);

// Audit Logs (used by FaceId, Login, Parent Portal)
router.get("/audit-logs", SystemController.getAuditLogs);
router.post("/audit-logs", SystemController.createAuditLog);

// Complaints (used by Director, Telegram bot, Parent Portal)
router.get("/complaints", SystemController.getComplaints);
router.post("/complaints", SystemController.createComplaint);
router.post("/complaints/resolve", SystemController.resolveComplaint);
router.put("/complaints/:id", SystemController.updateComplaint);
router.delete("/complaints/:id", SystemController.deleteComplaint);

export default router;
