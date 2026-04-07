import {Router} from "express";
import {
  listProviders,
  getProviderById,
} from "../controllers/provider.controller.js";

const router = Router();

router.get("/", listProviders);
router.get("/:id", getProviderById);

export default router;
