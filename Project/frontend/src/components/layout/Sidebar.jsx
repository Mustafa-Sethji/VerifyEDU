import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  HelpCircle,
  BarChart3,
  History as HistoryIcon,
  User,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTeacher = user?.role === 'TEACHER';

  const navItems = isTeacher
    ? [
        { name: 'Dashboard', path: '/teacher-dashboard', icon: LayoutDashboard },
        { name: 'Classrooms', path: '/classrooms', icon: GraduationCap },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'History', path: '/history', icon: HistoryIcon },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', path: '/student-dashboard', icon: LayoutDashboard },
        { name: 'Joined Classrooms', path: '/classrooms', icon: GraduationCap },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'History', path: '/history', icon: HistoryIcon },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];

  return (
    <aside className="w-64 bg-gray-50/90 backdrop-blur-xl border-r border-gray-200/80 flex flex-col justify-between h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-200/60">
          
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-1.5 font-['Outfit']">
              VerifyEDU
            </h1>
            {/* <span className="text-[10px] uppercase tracking-wider font-semibold text-green-600/90 bg-green-50/60 px-2 py-0.5 rounded-full border border-purple-800/50">
              AI Classroom
            </span> */}
          </div>
        </div>

        {/* User Role Badge */}
        <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-white/60 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-gray-900 font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-gray-700 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              isTeacher
                ? 'bg-green-500/20 text-green-600 border border-purple-500/30'
                : 'bg-green-500/20 text-green-600 border border-blue-500/30'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-green-600/90 to-emerald-600/80 text-gray-900 shadow-lg shadow-purple-600/20 font-semibold'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all border border-transparent hover:border-red-900/40"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
