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
import testSuiteRoutes from "./modules/test-suite/testSuite.routes";
import executionRoutes from "./modules/execution/execution.routes";
import uploadRoutes from "./routes/upload.routes";
import bugRoutes from "./modules/bug/bug.routes";
// --- NEW: Import Reports Routes ---
import reportsRoutes from "./modules/reports/reports.routes";
import projectRoutes from "./modules/project/project.routes";
import userRoutes from "./modules/user/user.routes";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
const app = express();

// --- 1. MIDDLEWARE ---
app.use(
  cors({
    origin: "http://localhost:5173", // Only allow your React app
    credentials: true,               // Allow the secret cookies to pass!
  })
);

app.use(express.json());
app.use(cookieParser());

// --- 2. DEBUG LOGGER ---
// This will print every single request to your terminal so we can see if it's hitting the server
app.use((req, res, next) => {
  console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// --- 3. ROUTES ---
app.use("/api/uploads", uploadRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use("/api/test-suites", testSuiteRoutes);
app.use("/api/executions", executionRoutes);
// --- NEW: Register Reports Routes ---
app.use("/api/reports", reportsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- 4. PROTECTED TEST ROUTES ---
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

// --- 5. ENHANCED GLOBAL ERROR HANDLER ---
// This now prints the full error to your terminal so we stop having "Silent 500s"
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ GLOBAL ERROR CAUGHT:");
  console.error(err); // This prints the full error object
  
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
    // We only show the stack trace in the terminal, not to the user for security
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 