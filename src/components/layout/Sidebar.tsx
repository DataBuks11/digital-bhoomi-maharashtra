import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Compass, 
  QrCode, 
  Users, 
  CheckSquare, 
  FileSignature, 
  CreditCard, 
  FolderArchive, 
  BarChart3, 
  ShieldAlert, 
  History, 
  Settings,
  ChevronRight,
  Flame,
  BadgeAlert
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'records'
  | 'map'
  | 'surveys'
  | 'qr'
  | 'ownership'
  | 'verification'
  | 'registration'
  | 'cards'
  | 'documents'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingVerificationsCount: number;
  pendingSurveysCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingVerificationsCount,
  pendingSurveysCount,
  isOpen = false,
  onClose,
}) => {
  const navSections = [
    {
      title: 'Land Records & Cadastre',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records' as ActiveTab, label: '7/12 & Land Records', icon: FileText },
        { id: 'map' as ActiveTab, label: 'Interactive Land Map', icon: Map },
        { id: 'cards' as ActiveTab, label: 'Digital Property Cards', icon: CreditCard },
      ]
    },
    {
      title: 'Field Operations & Verification',
      items: [
        { 
          id: 'surveys' as ActiveTab, 
          label: 'Survey Management (Mojani)', 
          icon: Compass, 
          badge: pendingSurveysCount > 0 ? pendingSurveysCount : undefined 
        },
        { id: 'qr' as ActiveTab, label: 'QR Bhu-Aadhaar Engine', icon: QrCode },
        { id: 'ownership' as ActiveTab, label: 'Ownership & Khatedars', icon: Users },
        { 
          id: 'verification' as ActiveTab, 
          label: 'Verification & Ferfar Approval', 
          icon: CheckSquare, 
          badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          badgeColor: 'bg-amber-500' 
        },
        { id: 'registration' as ActiveTab, label: 'SRO Deed Registration', icon: FileSignature },
      ]
    },
    {
      title: 'Administration & Intelligence',
      items: [
        { id: 'documents' as ActiveTab, label: 'Document Vault (Abhilekh)', icon: FolderArchive },
        { id: 'reports' as ActiveTab, label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'users' as ActiveTab, label: 'Roles & Permissions', icon: ShieldAlert },
        { id: 'audit' as ActiveTab, label: 'Audit Logs & Notifications', icon: History },
        { id: 'settings' as ActiveTab, label: 'System Settings & Masters', icon: Settings },
      ]
    }
  ];

  const handleItemClick = (id: ActiveTab) => {
    onTabChange(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs lg:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside 
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-full border-r border-slate-800 select-none transition-transform duration-200 ease-in-out z-40 ${
          isOpen ? 'fixed inset-y-0 left-0 shadow-2xl flex' : 'hidden lg:flex'
        }`}
      >
        
        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 min-h-0">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive 
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white shadow-xs flex-shrink-0 ${item.badgeColor || 'bg-emerald-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer State & Portal Metadata */}
        <div className="flex-shrink-0 p-3 bg-slate-950 border-t border-slate-800/80">
          <div className="flex items-center gap-2 p-2 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div className="flex-1 text-slate-400">
              <span className="text-slate-200 font-medium">Maharashtra State Node</span>
              <div className="text-[10px] text-slate-500">Cadastral System Online</div>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
