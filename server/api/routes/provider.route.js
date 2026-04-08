import {Router} from "express";
import {verifyProviderAuth} from "../middleware/providerAuth.middleware.js";
import {
  listProviders,
  getProviderById,
  registerProvider,
  loginProvider,
  getProviderMe,
  listProviderBookings,
  updateProviderSlots,
} from "../controllers/provider.controller.js";

const router = Router();

router.get("/", listProviders);

router.post("/auth/register", registerProvider);
router.post("/auth/login", loginProvider);
router.get("/auth/me", verifyProviderAuth, getProviderMe);
router.put("/auth/slots", verifyProviderAuth, updateProviderSlots);
router.get("/auth/appointments", verifyProviderAuth, listProviderBookings);

router.get("/:id", getProviderById);

export default router;
