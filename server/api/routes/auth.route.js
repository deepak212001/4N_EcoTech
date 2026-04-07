import {Router} from "express";
import {verifyAuth} from "../middleware/auth.middleware.js";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyAuth, getMe);
export default router;
