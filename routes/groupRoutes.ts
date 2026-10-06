import { Router } from "express";
import { GroupController } from "../controllers/groupController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/groups", validateKindergartenData, GroupController.getAll);
router.post("/groups", validateKindergartenData, GroupController.create);

export default router;
