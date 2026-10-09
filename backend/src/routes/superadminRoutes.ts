import { Router } from "express";
import { SuperAdminController } from "../controllers/superadminController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/kindergartens", SuperAdminController.getKindergartens);
router.post("/kindergartens", SuperAdminController.createKindergarten);
router.put("/kindergartens/:id", SuperAdminController.updateKindergarten);
router.delete("/kindergartens/:id", SuperAdminController.deleteKindergarten);
router.post("/kindergartens/:id/director", SuperAdminController.assignDirector);
router.post("/kindergartens/:id/toggle-portal", SuperAdminController.togglePortal);

router.get("/superadmin/documents", SuperAdminController.getDocuments);
router.post("/superadmin/documents", SuperAdminController.createDocument);
router.post("/superadmin/documents/:docId/distribute", SuperAdminController.distributeDocument);

router.get("/complaints", validateKindergartenData, SuperAdminController.getComplaints);
router.post("/complaints/resolve", SuperAdminController.resolveComplaint);

router.get("/audit-logs", validateKindergartenData, SuperAdminController.getAuditLogs);
router.post("/audit-logs", validateKindergartenData, SuperAdminController.createAuditLog);

export default router;
