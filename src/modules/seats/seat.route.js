import { Router } from "express";
import * as controller from "./seat.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.get("/", controller.getSeats);

router.put("/:id", authenticate, controller.bookSeat);

export default router;
