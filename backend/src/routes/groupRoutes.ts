import { Router } from "express";
import { GroupController } from "../controllers/groupController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/groups", validateKindergartenData, GroupController.getAll);
router.post("/groups", validateKindergartenData, GroupController.create);
router.put("/groups/:id", validateKindergartenData, GroupController.update);
router.delete("/groups/:id", validateKindergartenData, GroupController.delete);

export default router;
