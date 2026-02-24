
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { prisma } from "./config/prisma.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
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