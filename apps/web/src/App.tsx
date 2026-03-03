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
          
          {/* Everyone can view the list of test cases */}
          <Route path="/test-cases" element={<TestCaseList />} />
        </Route>

        {/* =========================================
            STRICT PROTECTED ROUTES (Write Access)
            Allowed: ONLY TESTER (and ADMIN)
            ========================================= */}
        <Route element={<ProtectedRoute allowedRoles={["TESTER", "ADMIN"]} />}>
          
          {/* MUST come before the edit route! */}
          <Route path="/test-cases/create" element={<CreateTestCase />} />
          
          {/* The dynamic ID route for editing */}
          <Route path="/test-cases/:id/edit" element={<EditTestCase />} />
          
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