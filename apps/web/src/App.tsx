import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './features/auth/authStore';

function App() {
  const { fetchMe } = useAuthStore();

  // 1. Session Restoration: Runs once when the app starts
  useEffect(() => {
    // If there is a token saved in the browser, try to silently log them in
    if (localStorage.getItem('accessToken')) {
      fetchMe();
    }
  }, [fetchMe]);

  return (
    // 2. Wrap everything in the Router
    <BrowserRouter>
      <Routes>
        {/* 3. Public Routes (Anyone can access these) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 4. Protected Routes (Must pass the Bouncer!) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 5. Fallback Route: If they type a random URL, send them to the Dashboard 
             (which will bounce them to login if they aren't authenticated) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;