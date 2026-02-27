import React from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // 1. Grab what we need from the Global Brain
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // 2. The Logout Handler
  const handleLogout = async () => {
    await logout(); // Calls our Zustand logout action (which talks to the backend)
    navigate('/login'); // Sends them back to the login page
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
        
        {/* Role-Based Content Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700">Your Role: {user?.role}</h2>
          
          {/* Conditional Rendering: Only Testers see this block */}
          {user?.role === 'TESTER' && (
            <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-bold text-blue-800">Tester Workspace</h3>
              <p className="text-blue-600">
                Here you will be able to create test cases, execute them, and report bugs.
              </p>
            </div>
          )}

          {/* Conditional Rendering: Only Developers see this block */}
          {user?.role === 'DEVELOPER' && (
            <div className="mt-4 rounded border border-green-200 bg-green-50 p-4">
              <h3 className="font-bold text-green-800">Developer Workspace</h3>
              <p className="text-green-600">
                Here you will see your assigned bugs, update their statuses, and add fix notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};