import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/employees", validateKindergartenData, EmployeeController.getAll);
router.post("/employees", validateKindergartenData, EmployeeController.create);
router.put("/employees/:id", validateKindergartenData, EmployeeController.update);

// Payroll operations
router.get("/payroll", validateKindergartenData, EmployeeController.getPayroll);
router.post("/payroll", validateKindergartenData, EmployeeController.createPayroll);
router.post("/payroll/:id/settle", EmployeeController.settlePayroll);

export default router;
