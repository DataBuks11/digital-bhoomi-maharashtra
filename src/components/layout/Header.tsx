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
  X,
  Building2,
  FileCheck2,
  BadgeCheck,
  Shield,
  Layers
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

  const roles: { role: UserRole; label: string; marathiTitle: string; icon: any; code: string; desc: string }[] = [
    { 
      role: 'ADMIN', 
      label: 'State Land Records Admin', 
      marathiTitle: 'राज्य भूमी अभिलेख संचालक', 
      icon: ShieldCheck, 
      code: 'ADM-PUN-NAG',
      desc: 'Pune & Nagpur Dual Directorate Master Governance' 
    },
    { 
      role: 'VERIFICATION_OFFICER', 
      label: 'Talathi / Circle Officer', 
      marathiTitle: 'मंडळ अधिकारी व तलाठी', 
      icon: UserCheck, 
      code: 'TAL-HAV-BES',
      desc: 'Wagholi & Besa Saza Ferfar Verification' 
    },
    { 
      role: 'SURVEYOR', 
      label: 'Cadastral Surveyor (DDLR)', 
      marathiTitle: 'उपअधीक्षक भूमी अभिलेख व भूमापक', 
      icon: Compass, 
      code: 'SRV-CAD-MH',
      desc: 'Total Station & GPS Mojani Demarcation' 
    },
    { 
      role: 'CITIZEN', 
      label: 'Registered Khatedar / Citizen', 
      marathiTitle: 'नोंदणीकृत शेतकरी व खातेदार', 
      icon: User, 
      code: 'CTZ-MAHA-01',
      desc: 'Public 7/12, Malmatta Patrak & e-Search' 
    },
  ];

  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-200 z-20 shadow-xs">
      <div className="px-3 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
        
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

          {/* Official Maharashtra State Emblem Badge */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950 p-0.5 shadow-sm border border-amber-500/50 flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-amber-400/40 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold text-amber-300 leading-none tracking-tighter">महाराष्ट्र</span>
                <span className="text-[12px] font-black text-white leading-none font-serif tracking-tight mt-0.5">भूमी</span>
              </div>
            </div>
            {/* Live Node Dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-slate-900 text-base md:text-lg leading-tight tracking-tight flex items-center gap-1.5">
                <span className="text-emerald-900 font-serif">महाभूमी</span>
                <span className="text-slate-400 font-light">|</span>
                <span className="font-sans text-slate-800">Digital Bhoomi</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                पुणे व नागपूर विभाग
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:flex items-center gap-1.5">
              <span>भूमी अभिलेख व जमाबंदी संचालनालय, महाराष्ट्र राज्य</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 font-medium">Bhu-Aadhaar ULPIN Cadastral Grid</span>
            </p>
          </div>
        </div>

        {/* Global Quick Search (Bilingual) */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="गट क्र., ULPIN, गाव किंवा खातेदार शोधा (Search Gat, ULPIN, Owner)..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300">
                ⌘K
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Controls: Role Switcher, DB Status, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Database Persistence Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-emerald-500'}`}></span>
            <span>{isSupabaseConfigured ? 'PostgreSQL Live' : 'स्थानिक डेटाबेस (Active)'}</span>
          </div>

          {/* Official Role Persona Switcher (Dropdown) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors"
              title="अधिकारी पदभार बदला (Switch Administrative Persona)"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></div>
              <span className="font-semibold text-slate-800">
                {currentUser.role === 'ADMIN' ? 'Super Admin (पुणे व नागपूर)' :
                 currentUser.role === 'VERIFICATION_OFFICER' ? 'Talathi (तपासणी अधिकारी)' :
                 currentUser.role === 'SURVEYOR' ? 'Surveyor (भूमापक)' : 'Citizen (खातेदार)'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 mb-1 bg-slate-50/80 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    प्रशासकीय पदभार व प्रवेश नियंत्रण (RBAC)
                  </div>
                  <div className="text-xs text-slate-700 font-semibold mt-0.5">
                    Switch Persona to Verify Government Workflows
                  </div>
                </div>

                <div className="space-y-1">
                  {roles.map(({ role, label, marathiTitle, icon: Icon, code, desc }) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs flex items-start gap-2.5 transition-all ${
                        currentUser.role === role 
                          ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-300 shadow-2xs' 
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${currentUser.role === role ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center justify-between">
                          <span className="text-slate-900 truncate">{label}</span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 ml-1">
                            {code}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-emerald-800">{marathiTitle}</div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{desc}</p>
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
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="सूचना व परिपत्रके (Notifications & Alerts)"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Official Officer Profile Card */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full object-cover border border-emerald-700/40 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[140px] leading-tight">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold truncate max-w-[140px]">
                {currentUser.district}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
