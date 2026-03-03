import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Adjust this import path if your auth store is located elsewhere!
import { useAuthStore } from '../features/auth/authStore';

export const Dashboard = () => {
  // Grab the user details and logout function from your Zustand store
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(); // Call your backend logout
    navigate('/login'); // Send them back to the login screen
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100">
          {/* App Title */}
          <h2 className="text-2xl font-bold text-blue-600">TestTrack Pro</h2>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/test-cases"
            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
          >
            Test Cases
          </Link>
          {/* We will add Bug Reports and Test Runs here later! */}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Tester'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Placeholder Widgets for later */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Tests</h3>
            <p className="text-3xl font-bold text-gray-800">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Open Bugs</h3>
            <p className="text-3xl font-bold text-red-600">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Pass Rate</h3>
            <p className="text-3xl font-bold text-green-600">--%</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600 text-lg">
            Your dashboard is looking a little empty right now. <br />
            Head over to the <Link to="/test-cases" className="text-blue-600 hover:underline font-medium">Test Cases</Link> tab to see your new table!
          </p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;