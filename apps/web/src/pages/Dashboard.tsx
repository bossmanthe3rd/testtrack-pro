import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { getBugs } from '../services/bugApi';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [bugCount, setBugCount] = useState<number | string>('--');

  useEffect(() => {
    const fetchBugStats = async () => {
      try {
        const response = await getBugs({ limit: 1 });
        setBugCount(response.pagination.totalCount);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchBugStats();
  }, []);

  const handleLogout = async () => {
    await logout(); 
    navigate('/login'); 
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-100">
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
          <Link
            to="/test-suites"
            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
          >
            Test Suites
          </Link>
          <Link
            to="/bugs"
            className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
          >
            Bug Tracker
          </Link>

          {/* 🟢 NEW: Show Developer Workspace Link ONLY to Developers */}
          {user?.role === 'DEVELOPER' && (
            <Link
              to="/developer/dashboard"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors bg-indigo-50/50 border border-indigo-100 mt-4"
            >
              Dev Workspace →
            </Link>
          )}
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Tests</h3>
            <p className="text-3xl font-bold text-gray-800">--</p>
          </div>
          
          <div 
            onClick={() => navigate('/bugs')}
            className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border border-gray-100 cursor-pointer hover:shadow-md transition"
          >
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Bugs</h3>
            <p className="text-3xl font-bold text-red-600">{bugCount}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Pass Rate</h3>
            <p className="text-3xl font-bold text-green-600">--%</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600 text-lg mb-6">
            Your dashboard is looking a little empty right now. <br />
            Head over to the Test Cases or Test Suites tab to get started!
          </p>
          
          {/* Quick action buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/test-cases')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Go to Test Cases
            </button>
            <button 
              onClick={() => navigate('/test-suites')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition shadow-sm"
            >
              Manage Test Suites
            </button>
            <button 
              onClick={() => navigate('/bugs')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition shadow-sm"
            >
              View Bug Tracker
            </button>

            {/* 🟢 NEW: Show Dev Workspace Button ONLY to Developers */}
            {user?.role === 'DEVELOPER' && (
              <button 
                onClick={() => navigate('/developer/dashboard')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
              >
                Go to Dev Workspace
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;