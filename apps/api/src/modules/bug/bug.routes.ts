import { Router } from "express";
import { 
  createBug, 
  getBugs, 
  getMyBugs, 
  updateStatus, 
  requestBugRetest, 
  getDevelopersList,
  getBugById // 🟢 Added import
} from "./bug.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createBugSchema } from "./bug.validation";

const router = Router();

// Global Middleware
router.use(authMiddleware);

// ==========================================
// 1. SPECIFIC GET ROUTES
// ==========================================
router.get("/developers/list", getDevelopersList);
router.get("/my", authorize("DEVELOPER"), getMyBugs);

// ==========================================
// 2. GENERAL ROUTES
// ==========================================
router.get("/", getBugs);
router.post("/", validate(createBugSchema), createBug);

// ==========================================
// 3. DYNAMIC ID ROUTES (Must come LAST)
// ==========================================

// 🟢 NEW: Route to fetch a single bug detail
router.get("/:id", getBugById);

router.patch(
  "/:id/status", 
  authorize("DEVELOPER"), 
  updateStatus
);

router.post(
  "/:id/request-retest", 
  authorize("DEVELOPER"), 
  requestBugRetest
);

export default router;