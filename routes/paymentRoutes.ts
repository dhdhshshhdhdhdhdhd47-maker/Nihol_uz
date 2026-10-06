import { Router } from "express";
import { PaymentController } from "../controllers/paymentController";
import { validateKindergartenData } from "../middleware/validationMiddleware";

const router = Router();

router.get("/payments", validateKindergartenData, PaymentController.getPayments);
router.post("/payments", validateKindergartenData, PaymentController.createPayment);
router.put("/payments/:id", validateKindergartenData, PaymentController.updatePayment);
router.delete("/payments/:id", validateKindergartenData, PaymentController.deletePayment);

router.get("/expenses", validateKindergartenData, PaymentController.getExpenses);
router.post("/expenses", validateKindergartenData, PaymentController.createExpense);

router.get("/incomes", validateKindergartenData, PaymentController.getIncomes);
router.post("/incomes", validateKindergartenData, PaymentController.createIncome);

router.get("/purchase-requests", validateKindergartenData, PaymentController.getPurchaseRequests);
router.post("/purchase-requests", validateKindergartenData, PaymentController.createPurchaseRequest);
router.put("/purchase-requests/:id", validateKindergartenData, PaymentController.updatePurchaseRequest);

router.get("/debtors", validateKindergartenData, PaymentController.getDebtors);

export default router;
