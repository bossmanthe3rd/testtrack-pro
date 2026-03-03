import { Router } from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller";

// FIX 1: Import the exact name that was exported from the middleware file!
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// 1. Define all the public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);

// FIX 2: Use authMiddleware here instead of authenticate
router.get("/me", authMiddleware, (req, res) => {
    res.json({
        id: (req as any).user.id,
        email: (req as any).user.email,
        role: (req as any).user.role,
        name: (req as any).user.name
    });
});

export default router;