import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/auth/me", authMiddleware(), AuthController.getMe);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/telegram-login", AuthController.telegramLogin);
router.put("/users/profile", AuthController.updateProfile);
router.post("/users/profile-photo", AuthController.updateProfilePhoto);
router.post("/users/link-telegram", AuthController.linkTelegram);
router.post("/auth/link-telegram", AuthController.linkTelegram);

export default router;
