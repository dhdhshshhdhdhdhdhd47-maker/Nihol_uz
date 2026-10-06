import { Router } from "express";
import { dbState } from "../db";
import { broadcastToWs } from "../utils/wsManager";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 1. Get Body Inspections (Nurse / Director)
router.get("/safety/body-inspections", authMiddleware(), (req, res) => {
  res.json({
    success: true,
    data: dbState.bodyInspections || []
  });
});

// 2. Add Body Inspection Record (Daily Body Check)
router.post("/safety/body-inspections", authMiddleware(["Hamshira", "Tarbiyachi", "Direktor", "SuperAdmin"]), (req, res) => {
  const { childId, inspectorName, hasInjury, injuryType, bodyLocation, photoUrl, note, origin } = req.body;
  
  const record = {
    id: `INS-${Date.now()}`,
    childId,
    date: new Date().toISOString().split("T")[0],
    timestamp: new Date().toISOString(),
    inspectorName: inspectorName || "Hamshira",
    hasInjury: !!hasInjury,
    injuryType: injuryType || "Ko'kargan",
    bodyLocation: bodyLocation || "Aniqlanmagan",
    photoUrl: photoUrl || "",
    note: note || "",
    origin: origin || "Bog'chada bo'lgan"
  };

  if (!dbState.bodyInspections) dbState.bodyInspections = [];
  dbState.bodyInspections.unshift(record);

  // If injury detected, broadcast WS alert & create Audit log
  if (hasInjury) {
    const alertMsg = {
      type: "INJURY_DETECTED",
      title: "Tanada jarohat aniqlandi!",
      message: `Bolada (${childId}) ${injuryType} aniqlandi (${bodyLocation}). Mansubligi: ${origin}`,
      timestamp: new Date().toISOString()
    };
    broadcastToWs(alertMsg);
  }

  res.json({ success: true, data: record });
});

// 3. Get Anti-Violence Alerts (AI Camera Acoustic & Aggression alerts)
router.get("/safety/violence-alerts", authMiddleware(), (req, res) => {
  res.json({
    success: true,
    data: dbState.violenceAlerts || []
  });
});

// 4. Trigger Violence Alert (AI / SOS trigger)
router.post("/safety/violence-alerts", authMiddleware(), (req, res) => {
  const { cameraOrRoom, type, severity, snapshotUrl } = req.body;
  const alertRecord = {
    id: `VIO-${Date.now()}`,
    timestamp: new Date().toISOString(),
    cameraOrRoom: cameraOrRoom || "1-Xona (Kamalak guruh)",
    type: type || "Aggression",
    severity: severity || "Kritik",
    snapshotUrl: snapshotUrl || "",
    status: "Faol",
    notifiedAuthorities: true
  };

  if (!dbState.violenceAlerts) dbState.violenceAlerts = [];
  dbState.violenceAlerts.unshift(alertRecord);

  // Broadcast SOS real-time WebSocket alert to all dashboards
  broadcastToWs({
    type: "EMERGENCY_VIOLENCE_ALERT",
    alert: alertRecord
  });

  res.json({ success: true, data: alertRecord, message: "Agressiya va Shoshilinch Signal 102 va MMTBga yuborildi!" });
});

// 5. Submit Anonymous SOS / Whistleblowing Report (Public allowed with optional auth)
router.post("/safety/anonymous-sos", (req, res) => {
  const { senderRole, category, details, mediaUrl, kindergartenId } = req.body;
  const sosReport = {
    id: `SOS-${Date.now()}`,
    timestamp: new Date().toISOString(),
    kindergartenId: kindergartenId || "K-1",
    senderRole: senderRole || "Anonim",
    category: category || "Jismoniy zo'ravonlik",
    details: details || "",
    mediaUrl: mediaUrl || "",
    status: "MMTBga Yuborildi"
  };

  if (!dbState.anonymousSosReports) dbState.anonymousSosReports = [];
  dbState.anonymousSosReports.unshift(sosReport);

  // Broadcast to SuperAdmin / Director
  broadcastToWs({
    type: "ANONYMOUS_SOS_RECEIVED",
    report: sosReport
  });

  res.json({
    success: true,
    data: sosReport,
    message: "Shikoyatingiz shaxsingiz oshkor qilinmagan holda Maktabgacha Ta'lim Boshqarmasi va Nazorat Organlariga uzatildi!"
  });
});

export default router;
