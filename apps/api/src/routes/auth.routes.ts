import { Router } from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller";
// Make sure to import your auth middleware! 
// (Adjust the path if your middleware is in a different folder)
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// 1. Define all the public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);

// 2. Add the /me route to fix the Silent Bounce!
// This route is protected by authenticate, so only users with valid tokens can enter
router.get("/me", authenticate, (req, res) => {
    // The authenticate middleware should have attached the user data to the request.
    // We grab it and send it right back to the frontend.
    res.json({
        id: (req as any).user.id,
        email: (req as any).user.email,
        role: (req as any).user.role,
        name: (req as any).user.name
    });
});

// 3. ALWAYS put the export at the very bottom!
export default router;