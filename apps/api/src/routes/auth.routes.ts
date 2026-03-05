import { Router } from "express";
import { register, login, logout, refresh } from "../controllers/auth.controller";

// FIX 1: Import the exact name that was exported from the middleware file!
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Log in a user
 * tags: [Authentication]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: john.tester@company.com
 * password:
 * type: string
 * format: password
 * example: SecurePass@123
 * responses:
 * 200:
 * description: Successfully logged in
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * accessToken:
 * type: string
 * refreshToken:
 * type: string
 * 401:
 * description: Invalid credentials
 */
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