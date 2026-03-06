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
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
          <span className="text-sm font-medium">Verifying session...</span>
        </div>
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
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-center px-6">
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          You don't have permission to view this page.
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Logged in as: <span className="text-indigo-400 font-mono font-semibold">{user.role}</span>
        </p>
      </div>
    );
  }

  // 8. If they passed all checks, render the actual page!
  return children ? <>{children}</> : <Outlet />;
};