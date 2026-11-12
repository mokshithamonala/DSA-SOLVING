import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  Milestone, 
  BarChart3, 
  Calendar, 
  BellRing, 
  User, 
  ShieldCheck, 
  LogOut, 
  Flame,
  Orbit,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrbitDB } from '../lib/orbitDB';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout, allUsers, switchUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: "Today's Challenge", path: '/today', icon: CalendarDays },
    { label: 'Question Bank', path: '/questions', icon: BookOpen },
    { label: 'DSA Roadmap', path: '/roadmap', icon: Milestone },
    { label: 'My Progress', path: '/progress', icon: BarChart3 },
    { label: 'Activity Calendar', path: '/calendar', icon: Calendar },
    { label: 'Reminder Settings', path: '/settings', icon: BellRing },
    { label: 'User Profile', path: '/profile', icon: User },
  ];

  const adminItems = [
    { label: 'Admin Overview', path: '/admin', icon: ShieldCheck },
    { label: 'Question Validation', path: '/admin/questions', icon: Sparkles },
    { label: 'Email Monitor', path: '/admin/emails', icon: BellRing }
  ];

  const streak = user ? OrbitDB.getUserStreak(user.id) : null;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Zone */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Orbit className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                CodeOrbit
              </span>
              <span className="block text-[10px] text-slate-400 -mt-0.5 font-mono">Daily DSA Practice</span>
            </div>
          </NavLink>
        </div>

        {/* User Card & Active Streak */}
        {user && (
          <div className="p-3.5 mx-3 mt-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`}
                alt={user.full_name}
                className="w-9 h-9 rounded-md object-cover ring-1 ring-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate">{user.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Flame className="w-4 h-4 fill-amber-500/20 text-amber-400" />
                <span className="font-mono tabular-nums font-semibold">{streak?.current_streak || 0}</span>
                <span className="text-slate-400 font-normal text-[11px]">day streak</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Quick Multi-User Switcher for testing user isolation */}
        <div className="px-3 mt-2">
          <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" />
            Active Account
          </label>
          <select
            value={user?.id || ''}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-hidden focus:border-sky-500 font-medium cursor-pointer"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 mb-1.5">
              Practice
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Administration</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded font-mono">STAFF</span>
              </div>
              <nav className="space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
