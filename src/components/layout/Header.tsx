import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  UserCheck, 
  ShieldCheck, 
  Compass, 
  User, 
  Database, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { UserRole, UserProfile } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

interface HeaderProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onSearch: (query: string) => void;
  searchQuery: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  onOpenNotifications,
  unreadNotificationsCount,
  onSearch,
  searchQuery,
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: any; desc: string }[] = [
    { role: 'ADMIN', label: 'Super Admin', icon: ShieldCheck, desc: 'Full administration, masters & audits' },
    { role: 'VERIFICATION_OFFICER', label: 'Verification Officer / Talathi', icon: UserCheck, desc: 'Review mutations & approve 7/12 records' },
    { role: 'SURVEYOR', label: 'Cadastral Surveyor', icon: Compass, desc: 'Conduct field surveys, GPS & demarcation' },
    { role: 'CITIZEN', label: 'Citizen / Khatedar', icon: User, desc: 'Public search, property cards & deed status' },
  ];

  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200 z-20 shadow-xs">
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Sidebar"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-bold text-base sm:text-lg shadow-sm border border-emerald-950 flex-shrink-0">
            <span className="font-serif">महा</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base md:text-lg leading-tight tracking-tight">
                Digital Bhoomi Maharashtra
              </h1>
              <span className="hidden sm:inline-flex items-center text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                ई-भूमी प्रोटोटाइप
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Revenue & Land Records Management Directorate (Demonstration Prototype)
            </p>
          </div>
        </div>

        {/* Global Quick Search */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search by Gat No, ULPIN, Village, or Khatedar name..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Action Controls: Role Switcher, DB Status, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Database Connection Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Persistence (Demo Mode)'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          {/* Interactive Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors shadow-2xs"
              title="Switch demo user role"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="hidden sm:inline text-slate-500">Role:</span>
              <span className="font-semibold text-emerald-800">
                {currentUser.role.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Persona
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Test different permissions & operational views
                  </div>
                </div>

                <div className="space-y-1">
                  {roles.map(({ role, label, icon: Icon, desc }) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-start gap-2.5 transition-colors ${
                        currentUser.role === role 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${currentUser.role === role ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center justify-between">
                          <span>{label}</span>
                          {currentUser.role === role && (
                            <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Active</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="View notifications & alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {currentUser.department}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
