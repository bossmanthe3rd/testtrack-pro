// apps/web/src/components/Layout.tsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth'; // Adjust path if needed
import { 
  LayoutDashboard, 
  FileText, 
  Bug, 
  FolderKanban, 
  LogOut,
  CheckCheck,
  Layers,
  User
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper function to highlight the active link
  const isActive = (path: string) => location.pathname.includes(path);

  return (
    // 🟢 CHANGED: 'bg-gray-50' to 'bg-slate-950' for the main app background
    <div className="flex h-screen bg-slate-950 font-sans text-slate-300">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        {/* App Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 bg-slate-950">
          
          {/* Abstract Geometric Diamond Logo */}
          <div className="relative flex items-center justify-center w-9 h-9 mr-4">
            {/* The colorful tilted square (Diamond) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-[10px] rotate-45 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
            
            {/* The dark inner cutout to make it look like a thick border */}
            <div className="absolute inset-[2px] bg-slate-950 rounded-[8px] rotate-45"></div>
            
            {/* The passing tests icon sitting on top */}
            <CheckCheck className="w-5 h-5 text-indigo-400 z-10 relative -ml-0.5" />
          </div>
          
          {/* Typography */}
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline">
              <span className="text-xl font-bold tracking-tight text-white">
                Test
              </span>
              <span className="text-xl font-light tracking-widest text-indigo-400 ml-0.5">
                TRACK
              </span>
            </div>
          </div>
          
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          
          {/* Dashboard Link (Everyone sees this) */}
          <Link 
            to={user?.role === 'DEVELOPER' ? '/developer/dashboard' : '/dashboard'}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          {/* Test Cases Link */}
          <Link 
            to="/test-cases"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/test-cases') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" />
            Test Cases
          </Link>

          {/* Projects Link */}
          <Link 
            to="/projects"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/projects') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mr-3" />
            Projects
          </Link>

          {/* Suites Link */}
          <Link 
            to="/test-suites"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/test-suites') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-5 h-5 mr-3" />
            Test Suites
          </Link>

          {/* Bugs Link */}
          <Link 
            to="/bugs"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/bugs') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Bug className="w-5 h-5 mr-3" />
            Defects & Bugs
          </Link>

          {/* Profile Link */}
          <Link 
            to="/profile"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/profile') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mr-3" />
            My Profile
          </Link>
        </nav>

        {/* User Profile & Logout at the bottom of sidebar */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{user?.name || user?.email || 'User'}</p>
              <p className="text-xs text-slate-500 font-semibold tracking-wider">{user?.role || 'Role'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        {/* 🟢 CHANGED: 'bg-white', 'border-gray-200' to dark slate colors */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-8">
          {/* 🟢 CHANGED: 'text-gray-800' to 'text-slate-100' */}
          <h1 className="text-xl font-semibold text-slate-100 capitalize">
            {location.pathname.split('/')[1].replace('-', ' ') || 'Dashboard'}
          </h1>
          <div></div> 
        </header>

        {/* Dynamic Page Content */}
        {/* The background is inherited from the parent div, so this will be dark now! */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet /> 
        </div>

      </main>
    </div>
  );
}