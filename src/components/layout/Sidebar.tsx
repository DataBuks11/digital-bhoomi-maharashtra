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
  Building,
  CheckCircle2
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
      title: 'भूमी अभिलेख व नकाशा (Records & GIS)',
      items: [
        { id: 'dashboard' as ActiveTab, marathi: 'नियंत्रण कक्ष', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records' as ActiveTab, marathi: 'गाव नमुना ७/१२', label: '7/12 & 8-A Records', icon: FileText },
        { id: 'map' as ActiveTab, marathi: 'भू-नकाशा व ३D ड्रोन', label: 'Cadastral Land Map', icon: Map },
        { id: 'cards' as ActiveTab, marathi: 'मालमत्ता पत्रक', label: 'Digital Property Cards', icon: CreditCard },
      ]
    },
    {
      title: 'क्षेत्रीय मोजणी व फेरफार (Operations)',
      items: [
        { 
          id: 'surveys' as ActiveTab, 
          marathi: 'जमीन मोजणी',
          label: 'Survey Management (Mojani)', 
          icon: Compass, 
          badge: pendingSurveysCount > 0 ? pendingSurveysCount : undefined 
        },
        { id: 'qr' as ActiveTab, marathi: 'भू-आधार क्यूआर', label: 'QR Bhu-Aadhaar Engine', icon: QrCode },
        { id: 'ownership' as ActiveTab, marathi: 'खातेदार व हक्क नोंद', label: 'Ownership & Khatedars', icon: Users },
        { 
          id: 'verification' as ActiveTab, 
          marathi: 'ई-फेरफार मंजुरी',
          label: 'Ferfar Verification Queue', 
          icon: CheckSquare, 
          badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          badgeColor: 'bg-amber-500' 
        },
        { id: 'registration' as ActiveTab, marathi: 'दस्त नोंदणी', label: 'SRO Deed Registration', icon: FileSignature },
      ]
    },
    {
      title: 'प्रशासन व सुरक्षा (Governance)',
      items: [
        { id: 'documents' as ActiveTab, marathi: 'अभिलेख कक्ष', label: 'Document Vault (Abhilekh)', icon: FolderArchive },
        { id: 'reports' as ActiveTab, marathi: 'महसूल सांख्यिकी', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'users' as ActiveTab, marathi: 'भूमिका व अधिकार', label: 'Roles & Permissions', icon: ShieldAlert },
        { id: 'audit' as ActiveTab, marathi: 'ऑडिट लॉग नोंदणी', label: 'Audit Logs & Notifications', icon: History },
        { id: 'settings' as ActiveTab, marathi: 'प्रणाली संरचना', label: 'System Settings & Masters', icon: Settings },
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
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-5 min-h-0">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{section.title}</span>
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
                          ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-sm font-semibold' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <div className="text-left truncate">
                          <span className={`block text-[11px] leading-tight ${isActive ? 'text-white font-bold' : 'text-slate-200'}`}>
                            {item.marathi}
                          </span>
                          <span className="block text-[10px] text-slate-400 leading-none truncate">
                            {item.label}
                          </span>
                        </div>
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
        <div className="flex-shrink-0 p-3 bg-slate-950 border-t border-slate-800/80 sticky bottom-0 z-20">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0 text-slate-400">
              <div className="text-slate-200 font-bold truncate">महाराष्ट्र राज्य भू-अभिलेख</div>
              <div className="text-[10px] text-slate-500 truncate">NIC Node: Pune & Nagpur Live</div>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
