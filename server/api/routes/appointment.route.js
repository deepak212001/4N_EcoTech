import {Router} from "express";
import {verifyAuth} from "../middleware/auth.middleware.js";
import {
  bookAppointment,
  listMyAppointments,
  cancelAppointment,
} from "../controllers/appointment.controller.js";

const router = Router();

router.use(verifyAuth);

router.post("/", bookAppointment);
router.get("/", listMyAppointments);
router.delete("/:id", cancelAppointment);

export default router;
