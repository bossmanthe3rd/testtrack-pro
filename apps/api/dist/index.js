// src/index.ts
import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";

// src/routes/auth.routes.ts
import { Router } from "express";

// src/services/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/config/prisma.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient();

// src/services/auth.service.ts
var registerUser = async (email, password) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  });
  return user;
};
var loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid characters or credentials");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "supersecret",
    { expiresIn: "1h" }
  );
  return token;
};

// src/utils/validators.ts
import { z } from "zod";
var registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// src/controllers/auth.controller.ts
var register = async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated.email, validated.password);
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// src/routes/auth.routes.ts
var router = Router();
router.post("/register", register);
router.post("/login", login);
var auth_routes_default = router;

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET;
var authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt2.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// src/middleware/role.middleware.ts
var authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

// src/index.ts
dotenv.config();
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", auth_routes_default);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get(
  "/api/protected/tester",
  authenticate,
  authorize("TESTER"),
  (req, res) => {
    res.json({ message: "Tester access granted" });
  }
);
app.get(
  "/api/protected/admin",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);
var PORT = process.env.PORT || 5e3;
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong"
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
