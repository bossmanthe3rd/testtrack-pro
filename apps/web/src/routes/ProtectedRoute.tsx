import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';

// 1. Define the Blueprint for the Props (What this frame expects to receive)
interface ProtectedRouteProps {
  children?: React.ReactNode; // The page we are protecting (e.g., Dashboard)
  allowedRoles?: ('TESTER' | 'DEVELOPER' | 'ADMIN')[]; // Optional list of allowed roles
}

// 2. Build the Bouncer Component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  // 3. Ask the Global Brain for the current state
  const { isAuthenticated, user, isLoading, fetchMe } = useAuthStore();

  // 4. When this component first loads, double-check who is logged in
  useEffect(() => {
    // If the brain doesn't have a user, but we have a token in storage, try to fetch the user
    if (!user && localStorage.getItem('accessToken')) {
      fetchMe();
    }
  }, [user, fetchMe]);

  // 5. Handling the "Loading" state
  if (isLoading) {
    // While the brain is talking to the backend to verify the token, show a spinner
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Verifying session...</div>
      </div>
    );
  }

  // 6. Handling the "Not Logged In" state
  if (!isAuthenticated) {
    // The user has no valid badge. Redirect them immediately to the login page.
    // 'replace' means they can't click the back button to return to this protected page.
    return <Navigate to="/login" replace />;
  }

  // 7. Handling the "Wrong Role" state (Role-Based Access Control)
  // If allowedRoles were provided, AND the user's role is NOT in that list...
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4 text-gray-600">
          You do not have permission to view this page. Your role is: {user.role}
        </p>
      </div>
    );
  }

  // 8. If they passed all checks, render the actual page!
  return children ? <>{children}</> : <Outlet />;
};