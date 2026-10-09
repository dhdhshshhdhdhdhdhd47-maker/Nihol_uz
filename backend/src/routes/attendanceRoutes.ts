import { Router } from "express";
import { AttendanceController } from "../controllers/attendanceController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/attendance", validateKindergartenData, AttendanceController.getAttendance);
router.post("/attendance", validateKindergartenData, AttendanceController.createAttendance);
router.post("/attendance/:id/checkout", AttendanceController.checkoutChild);

// Hardware device integrations (QR, Biometrics & Hikvision DS-K1T343MX)
router.post("/attendance/scan-qr", AttendanceController.scanQr);
router.post("/attendance/scan", AttendanceController.attendanceScan);
router.post("/face-id/scan", AttendanceController.faceIdScan);
router.post("/biometrics/hikvision", AttendanceController.faceIdScan);
router.post("/hardware/faceid", AttendanceController.faceIdScan);
router.post("/hikvision/event", AttendanceController.faceIdScan);

export default router;
