# TestTrack Pro 🚀

[![CI/CD Pipeline](https://github.com/your-org/testtrack/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/testtrack/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**TestTrack Pro** is a comprehensive, project-based Quality Assurance (QA) management and live test execution platform. Built to streamline the software testing lifecycle, it provides engineering and QA teams with robust tools for test case authoring, suite management, live execution tracking, and integrated bug reporting.

This repository serves as the final deliverable for the Full-Stack Engineering Internship at **INDPRO**. It demonstrates a production-ready, scalable architecture combining a modern React frontend with a high-performance Node.js backend.

---

## 🏗️ System Architecture

The project is structured as a **Monorepo** using [Turborepo](https://turbo.build/) / `pnpm` workspaces to ensure strict boundary management and shared configuration across applications.

| App/Package | Role                | Description                                                                                                             |
| :---------- | :------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| `apps/web`  | **Frontend Client** | A highly interactive, dark-themed React SPA (Single Page Application) powering the user interface. Built with Vite.     |
| `apps/api`  | **Backend Service** | A robust Node.js/Express REST API that handles business logic, authentication, database transactions, and integrations. |

The decoupled architecture allows for independent deployment, scaling, and maintenance of the frontend and backend services.

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)

- **Framework:** React 19 (via Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS, custom dark theme, animations)
- **State Management:** Zustand, React Context
- **Forms & Validation:** React Hook Form, Zod
- **Routing:** React Router v6

### Backend (`apps/api`)

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database Interface:** Prisma ORM
- **Storage:** Cloudinary (for media/attachment uploads)
- **Security & Auth:** JWT, bcryptjs

### Infrastructure

- **Database:** PostgreSQL (hosted on Neon)
- **Monorepo Management:** pnpm workspaces
- **CI/CD:** GitHub Actions

---

## 🧩 Core Modules & Features

### 1. Project & Role-Based Access Control (RBAC)

- Secure JWT-based authentication system.
- Project-level scoping: Users can be assigned to multiple projects with distinct roles (Admin, QA Lead, Tester, Developer).
- Access and capabilities dynamically adjust based on the user's role within the active project context.

### 2. Test Case Management

- **Rich Authoring:** Define detailed test cases including prerequisites, test data, priority, and step-by-step actions.
- **Versioning:** Immutable test case versioning. Editing a test case creates a new version, preserving historical integrity for past executions.
- **Cloning:** Quickly duplicate complex test cases to accelerate test authoring.
- **Status Workflow:** Lifecycle management through states: `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, and `RETIRED`.

### 3. Live Test Execution

- **Suite Runner:** A highly interactive "Focus Mode" execution interface designed for maximum QA productivity.
- **Immediate Persistence:** Step-by-step execution results (`PASS`, `FAIL`, `BLOCKED`) are saved immediately to the backend, preventing data loss.
- **Real-time Progress:** Visual progress bars and metrics update instantly as tests are executed.

### 4. Bug Tracking Integration

- **Seamless Creation:** When a test step fails in the Suite Runner, testers are immediately prompted to log a bug.
- **Execution Linking:** Bugs are strictly linked to the specific test step and execution instance that generated them, providing complete traceability for developers.
- **Detailed Reports:** Bug detail views include reproduction steps automatically pulled from the failed test case, alongside severity, status, and related attachments.

---

## 🚀 CI/CD & Deployment Pipeline

TestTrack Pro utilizes robust GitHub Actions workflows to guarantee code quality and automate deployments.

### Continuous Integration (CI)

Triggered on pushes to `develop` and `main`, or on Pull Requests.

1. **Setup & Install:** Provisions Node.js and installs dependencies via `pnpm`.
2. **Linting & Formatting:** Validates code standards using ESLint.
3. **Type Checking:** Strict type verification using `tsc --noEmit`.
4. **Testing:** Executes Unit and Integration test suites.
5. **Build:** Compiles the applications to ensure there are no bundling or compilation errors.

### Continuous Deployment (CD)

Automated deployments triggered upon successful merges.

- **Frontend Deployment:** Deployed via **Vercel**. Provides optimized edge delivery, automatic PR preview environments, and seamless production rollouts.
- **Backend Deployment:** Deployed via **Render** (or Railway). The GitHub Action triggers a secure Deploy Hook/Token to pull the latest image, run Prisma migrations (`npx prisma migrate deploy`), and restart the Node service.
- **Database Management:** Schema migrations are strictly managed through Prisma during the CD pipeline.

---

## 💻 Local Development Setup

Follow these instructions to spin up the TestTrack Pro ecosystem locally.

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v8/v9+ (`npm install -g pnpm` if not installed)
- **PostgreSQL Database** (Local or Neon)
- **Cloudinary Account** (for attachment uploads in bugs)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/testtrack.git
cd testtrack
```

### 2. Install Dependencies

Run from the root of the monorepo:

```bash
pnpm install
```

### 3. Environment Variables

You need to configure both the API and Web environments.

**Backend (`apps/api/.env`)**
Create the `.env` file in the `api` directory:

```env
# Database Configuration (Neon or local Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/testtrack?schema=public"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"

# Server Port
PORT=5000

# Cloudinary Setup for Attachments
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Frontend Integration
CORS_ORIGIN="http://localhost:5173"
```

**Frontend (`apps/web/.env`)**
Create the `.env` file in the `web` directory:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 4. Database Setup

Navigate to the API app and apply Prisma migrations to generate the schema:

```bash
cd apps/api
npx prisma migrate dev --name init
```

_(Optional)_ Seed the database with initial roles/admin user:

```bash
npx prisma db seed
cd ../..
```

### 5. Start Development Servers

Return to the root directory and start the Turborepo development script. This will start both the frontend and backend concurrently.

```bash
pnpm dev
```

- **Frontend UI:** Available at `http://localhost:5173`
- **Backend API:** Available at `http://localhost:5000`

---

_Developed as part of the Full-Stack Engineering Internship program at **INDPRO**._
