import { Router } from "express";
import { ChildController } from "../controllers/childController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/children", validateKindergartenData, ChildController.getAll);
router.post("/children", validateKindergartenData, ChildController.create);
router.put("/children/:id", validateKindergartenData, ChildController.update);
router.delete("/children/:id", validateKindergartenData, ChildController.delete);

// Bulk actions
router.post("/children/bulk-absent", ChildController.bulkAbsent);
router.post("/children/bulk-reminder", ChildController.bulkReminder);

// Medical card
router.get("/medical/cards", validateKindergartenData, ChildController.getMedicalCards);
router.put("/medical/card", validateKindergartenData, ChildController.updateMedicalCard);

// Educational & play activities
router.get("/activities", validateKindergartenData, ChildController.getActivities);
router.post("/activities", validateKindergartenData, ChildController.createActivity);

// Failed checkins face recognition resolve
router.get("/failed-checkins", ChildController.getFailedCheckins);
router.post("/failed-checkins/:id/resolve", ChildController.resolveFailedCheckin);

export default router;
