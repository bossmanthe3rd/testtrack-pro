"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const role_middleware_1 = require("./middleware/role.middleware");
const testCase_routes_1 = __importDefault(require("./modules/test-case/testCase.routes"));
const testSuite_routes_1 = __importDefault(require("./modules/test-suite/testSuite.routes"));
const execution_routes_1 = __importDefault(require("./modules/execution/execution.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const bug_routes_1 = __importDefault(require("./modules/bug/bug.routes"));
// --- NEW: Import Reports Routes ---
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const project_routes_1 = __importDefault(require("./modules/project/project.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
// --- 1. MIDDLEWARE ---
app.use((0, cors_1.default)({
    origin: "http://localhost:5173", // Only allow your React app
    credentials: true, // Allow the secret cookies to pass!
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
app.use("/api/uploads", upload_routes_1.default);
app.use("/api/bugs", bug_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use('/api/test-cases', testCase_routes_1.default);
app.use("/api/test-suites", testSuite_routes_1.default);
app.use("/api/executions", execution_routes_1.default);
// --- NEW: Register Reports Routes ---
app.use("/api/reports", reports_routes_1.default);
app.use("/api/projects", project_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// --- 4. PROTECTED TEST ROUTES ---
app.get("/api/protected/tester", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("TESTER"), (req, res) => {
    res.json({ message: "Tester access granted" });
});
app.get("/api/protected/admin", auth_middleware_1.authMiddleware, (0, role_middleware_1.authorize)("ADMIN"), (req, res) => {
    res.json({ message: "Admin access granted" });
});
const PORT = process.env.PORT || 5000;
// --- 5. ENHANCED GLOBAL ERROR HANDLER ---
// This now prints the full error to your terminal so we stop having "Silent 500s"
app.use((err, req, res, next) => {
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
