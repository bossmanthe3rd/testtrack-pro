import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    // The spec requires max sizes: Images 10MB, Videos 100MB, Logs 50MB[cite: 216].
    // We will set a generous overall limit of 100MB here for the buffer.
    fileSize: 100 * 1024 * 1024 
  }
});

// Protect the route and expect a single file labeled "attachment"
router.post("/", authMiddleware, upload.single("attachment"), uploadFile);

export default router;