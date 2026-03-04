import { Router } from "express";
import { createBug, getBugs } from "./bug.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createBugSchema } from "./bug.validation";

const router = Router();

// Protect all bug routes with authMiddleware
router.use(authMiddleware);

// Route to create a bug, passing it through validation first
router.post("/", validate(createBugSchema), createBug);

// Route to get a list of bugs
router.get("/", getBugs);

export default router;