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

// SMS queue
router.get("/telegram-simulator/pending-sms", SystemController.getPendingSms);
router.post("/telegram-simulator/pending-sms/clear", SystemController.clearPendingSms);

// Telegram queue
router.get("/telegram-simulator/pending-messages", SystemController.getPendingTelegramMessages);
router.get("/telegram-simulator/status", SystemController.getTelegramSimulatorStatus);
router.post("/telegram-simulator/toggle-error", SystemController.toggleTelegramError);
router.get("/telegram-simulator/logs", SystemController.getTelegramSimulatorLogs);

// Global Logs
router.get("/sms/logs", SystemController.getSmsLogs);
router.get("/notifications/history", SystemController.getTelegramNotifications);

// System Factory Reset
router.post("/admin/reset-db", SystemController.clearDatabase);

export default router;
