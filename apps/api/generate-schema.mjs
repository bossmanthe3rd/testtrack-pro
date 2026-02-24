import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import url from "url";

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("DB URL IS LOADED:", !!process.env.DATABASE_URL);

try {
    execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (e) {
    process.exit(1);
}
