import { Router } from "express";
import { ParentController } from "../controllers/parentController";

const router = Router();

router.get("/parent-portal/data", ParentController.getParentPortalData);
router.post("/parent-portal/announcements/:id/view", ParentController.incrementAnnouncementView);
router.post("/parent-portal/link-child", ParentController.linkChild);

export default router;
