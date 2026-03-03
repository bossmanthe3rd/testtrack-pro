import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prisma";
import authRoutes from "./routes/auth.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { authorize } from "./middleware/role.middleware";
import testCaseRoutes from './modules/test-case/testCase.routes';

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Only allow your React app
    credentials: true,               // Allow the secret cookies to pass!
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use('/api/test-cases', testCaseRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get(
  "/api/protected/tester",
  authMiddleware,
  authorize("TESTER"),
  (req, res) => {
    res.json({ message: "Tester access granted" });
  }
);

app.get(
  "/api/protected/admin",
  authMiddleware,
  authorize("ADMIN"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

const PORT = process.env.PORT || 5000;

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});