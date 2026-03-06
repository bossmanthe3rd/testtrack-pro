import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🟢 NEW: Import the Layout we just built
import Layout from './components/Layout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './features/auth/authStore';

// Test Case Pages
import TestCaseList from './pages/TestCaseList';
import CreateTestCase from './pages/CreateTestCase';
import EditTestCase from './pages/EditTestCase';
import ExecuteTestCase from './pages/ExecuteTestCase';
import TestCaseDetail from './pages/TestCaseDetail';

// Test Suite Pages
import TestSuites from './pages/TestSuites';
import ManageTestSuite from './pages/ManageTestSuite';
import SuiteRunner from './pages/SuiteRunner'; // 🟢 ADDED THIS IMPORT

// Bug Management Pages
import CreateBug from './pages/CreateBug';
import BugList from './pages/BugList';

// Developer Workflow
import DeveloperDashboard from './pages/DeveloperDashboard';
import BugDetail from './pages/BugDetail';

// Project Management
import ProjectList from './pages/ProjectList';
import CreateProject from './pages/CreateProject';
import ProjectDetail from './pages/ProjectDetail';

// User Profile
import Profile from './pages/Profile';

function App() {
  const { fetchMe } = useAuthStore();

  // Session Restoration: Runs once when the app starts
  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      fetchMe();
    }
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Routes>
        {/* =========================================
            PUBLIC ROUTES (No Sidebar, Full Screen)
            ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* =========================================
            PRIVATE ROUTES (Wrapped in the Sidebar Layout)
            ========================================= */}
        {/* 🟢 NEW: This single Route wraps ALL protected pages inside the Layout frame */}
        <Route element={<Layout />}>

          {/* -----------------------------------------
              GENERAL PROTECTED ROUTES (View Access)
              Allowed: TESTER, DEVELOPER, ADMIN
              ----------------------------------------- */}
          <Route element={<ProtectedRoute allowedRoles={["TESTER", "DEVELOPER", "ADMIN"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test-cases" element={<TestCaseList />} />
            {/* Moving param route down to avoid conflict with /create */}
            <Route path="/bugs" element={<BugList />} />
            <Route path="/bugs/:id" element={<BugDetail />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* -----------------------------------------
              STRICT PROTECTED ROUTES (Write/Execute Access)
              Allowed: ONLY TESTER (and ADMIN)
              ----------------------------------------- */}
          <Route element={<ProtectedRoute allowedRoles={["TESTER", "ADMIN"]} />}>
            <Route path="/test-cases/create" element={<CreateTestCase />} />
            <Route path="/test-cases/:id/edit" element={<EditTestCase />} />
            <Route path="/test-cases/:id/execute" element={<ExecuteTestCase />} />
            <Route path="/test-cases/:id" element={<TestCaseDetail />} />
            
            <Route path="/test-suites" element={<TestSuites />} />
            <Route path="/test-suites/:id" element={<ManageTestSuite />} />
            <Route path="/test-suites/:suiteId/run" element={<SuiteRunner />} />

            <Route path="/bugs/create" element={<CreateBug />} />
            <Route path="/projects/create" element={<CreateProject />} />
          </Route>

          {/* -----------------------------------------
              DEVELOPER ONLY ROUTES
              Allowed: ONLY DEVELOPER (and ADMIN)
              ----------------------------------------- */}
          <Route element={<ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]} />}>
            <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
          </Route>

        </Route>
        {/* === END OF LAYOUT WRAPPER === */}

        {/* =========================================
            FALLBACK ROUTE
            If they type a random URL, send them to the Dashboard
            ========================================= */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;