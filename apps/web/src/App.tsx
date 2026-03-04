import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Test Suite Pages
import TestSuites from './pages/TestSuites';
import ManageTestSuite from './pages/ManageTestSuite';

// Bug Management Pages
import CreateBug from './pages/CreateBug';
import BugList from './pages/BugList';

// 🟢 DAY 10 NEW IMPORTS: Developer Workflow
import DeveloperDashboard from './pages/DeveloperDashboard';
import BugDetail from './pages/BugDetail';

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
            PUBLIC ROUTES (Anyone can access)
            ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* =========================================
            GENERAL PROTECTED ROUTES (View Access)
            Allowed: TESTER, DEVELOPER, ADMIN
            ========================================= */}
        <Route element={<ProtectedRoute allowedRoles={["TESTER", "DEVELOPER", "ADMIN"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test-cases" element={<TestCaseList />} />
          
          {/* We moved BugList here so Developers aren't blocked by the Tester parent route */}
          <Route path="/bugs" element={<BugList />} />

          {/* 🟢 NEW: Both roles need to see bug details to collaborate */}
          <Route path="/bugs/:id" element={<BugDetail />} />
        </Route>

        {/* =========================================
            STRICT PROTECTED ROUTES (Write/Execute Access)
            Allowed: ONLY TESTER (and ADMIN)
            ========================================= */}
        <Route element={<ProtectedRoute allowedRoles={["TESTER", "ADMIN"]} />}>
          <Route path="/test-cases/create" element={<CreateTestCase />} />
          <Route path="/test-cases/:id/edit" element={<EditTestCase />} />
          <Route path="/test-cases/:id/execute" element={<ExecuteTestCase />} />
          
          <Route path="/test-suites" element={<TestSuites />} />
          <Route path="/test-suites/:id" element={<ManageTestSuite />} />

          {/* Only Testers create bugs */}
          <Route path="/bugs/create" element={<CreateBug />} />
        </Route>

        {/* =========================================
            DEVELOPER ONLY ROUTES
            Allowed: ONLY DEVELOPER (and ADMIN)
            ========================================= */}
        <Route element={<ProtectedRoute allowedRoles={["DEVELOPER", "ADMIN"]} />}>
          {/* 🟢 NEW: Developer Dashboard */}
          <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
        </Route>

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