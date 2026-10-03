import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  LogOut,
  ShieldCheck,
  Car,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'citizen'] },
  { to: '/violations', label: 'All Reports', icon: FileText, roles: ['admin', 'officer', 'citizen'] },
  { to: '/violations/new', label: 'Report Violation', icon: PlusCircle, roles: ['admin', 'officer', 'citizen'] },
  { to: '/my-reports', label: 'My Reports', icon: Car, roles: ['citizen'] },
  { to: '/manage-users', label: 'Manage Users', icon: Users, roles: ['admin'] },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;

  const filteredItems = navItems.filter((item) => item.roles.includes(profile.role));

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gov-blue-700 text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Traffic Violation</p>
          <p className="text-xs text-gray-500 leading-tight">Reporting System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gov-blue-700 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gov-blue-100 text-gov-blue-700 font-semibold text-sm">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[profile.role]}`}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 bg-white border-r border-gray-200 h-screen flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
