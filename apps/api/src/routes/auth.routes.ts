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
router.get("/me", authMiddleware, async (req, res) => {
    try {
      // Always query DB for fresh data — name/email may have changed since token was issued
      const { prisma } = await import("../config/prisma");
      const user = await prisma.user.findUnique({
        where: { id: (req as any).user.id },
        select: { id: true, email: true, role: true, name: true },
      });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
    } catch {
      // Fallback to token data if DB call fails
      res.json({
        id: (req as any).user.id,
        email: (req as any).user.email,
        role: (req as any).user.role,
        name: (req as any).user.name,
      });
    }
});


export default router;