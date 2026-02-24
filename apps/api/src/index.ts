import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middleware/auth.middleware";
import { authorize } from "./middleware/role.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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