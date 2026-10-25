import React, { useState, useEffect } from 'react';
import { 
  LandParcel, 
  OwnershipRecord, 
  CropRecord, 
  SurveyRequest, 
  MutationApplication, 
  PropertyRegistration, 
  QRCodeRecord, 
  DocumentRecord, 
  AuditLog, 
  NotificationItem, 
  UserProfile, 
  UserRole 
} from './types';
import { dataService } from './services/dataService';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { WatermarkBanner } from './components/layout/WatermarkBanner';
import { NotificationDrawer } from './components/layout/NotificationDrawer';

// 14 Module Views
import { DashboardView } from './views/DashboardView';
import { LandRecordsView } from './views/LandRecordsView';
import { InteractiveLandMapView } from './views/InteractiveLandMapView';
import { LandSurveyView } from './views/LandSurveyView';
import { QRCodeManagementView } from './views/QRCodeManagementView';
import { OwnershipRecordsView } from './views/OwnershipRecordsView';
import { VerificationApprovalView } from './views/VerificationApprovalView';
import { PropertyRegistrationView } from './views/PropertyRegistrationView';
import { DigitalPropertyCardsView } from './views/DigitalPropertyCardsView';
import { DocumentManagementView } from './views/DocumentManagementView';
import { ReportsAnalyticsView } from './views/ReportsAnalyticsView';
import { UserRoleManagementView } from './views/UserRoleManagementView';
import { AuditLogsView } from './views/AuditLogsView';
import { SystemSettingsView } from './views/SystemSettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeParams, setActiveParams] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Central Application Data State
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataService.getCurrentUser());
  const [parcels, setParcels] = useState<LandParcel[]>(dataService.getParcels());
  const [ownerships, setOwnerships] = useState<OwnershipRecord[]>(dataService.getOwnershipRecords());
  const [crops, setCrops] = useState<CropRecord[]>(dataService.getCrops());
  const [surveys, setSurveys] = useState<SurveyRequest[]>(dataService.getSurveys());
  const [mutations, setMutations] = useState<MutationApplication[]>(dataService.getMutations());
  const [registrations, setRegistrations] = useState<PropertyRegistration[]>(dataService.getRegistrations());
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>(dataService.getQRCodes());
  const [documents, setDocuments] = useState<DocumentRecord[]>(dataService.getDocuments());
  const [notifications, setNotifications] = useState<NotificationItem[]>(dataService.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(dataService.getAuditLogs());
  const [settings, setSettings] = useState(dataService.getSettings());

  // Refresh all state from data service
  const refreshData = () => {
    setCurrentUser(dataService.getCurrentUser());
    setParcels(dataService.getParcels());
    setOwnerships(dataService.getOwnershipRecords());
    setCrops(dataService.getCrops());
    setSurveys(dataService.getSurveys());
    setMutations(dataService.getMutations());
    setRegistrations(dataService.getRegistrations());
    setQrCodes(dataService.getQRCodes());
    setDocuments(dataService.getDocuments());
    setNotifications(dataService.getNotifications());
    setAuditLogs(dataService.getAuditLogs());
    setSettings(dataService.getSettings());
  };

  const handleRoleChange = (role: UserRole) => {
    const updatedUser = dataService.setCurrentUserRole(role);
    setCurrentUser(updatedUser);
    refreshData();
  };

  const handleNavigate = (tab: ActiveTab, params: any = {}) => {
    setActiveTab(tab);
    setActiveParams(params);
    setIsSidebarOpen(false);
  };

  // Search handler: If user types in global search and presses enter or types, navigate to records with query
  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== 'records') {
      setActiveTab('records');
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const pendingVerificationsCount = mutations.filter(m => m.status === 'PENDING_TALATHI_REVIEW' || m.status === 'NOTICE_PERIOD').length;
  const pendingSurveysCount = surveys.filter(s => s.status !== 'APPROVED' && s.status !== 'REJECTED').length;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 antialiased font-sans">
      
      {/* 1. Official Demonstration Disclaimer Watermark Banner */}
      {settings.disclaimerWatermark && <WatermarkBanner />}

      {/* Maintenance Mode Simulation Banner */}
      {settings.maintenanceMode && (
        <div className="flex-shrink-0 bg-red-600 text-white text-xs px-4 py-1 text-center font-bold z-30">
          SYSTEM MAINTENANCE NOTICE: Demonstration system in scheduled simulation maintenance.
        </div>
      )}

      {/* 2. Top Header Navigation */}
      <Header
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onSearch={handleGlobalSearch}
        searchQuery={searchQuery}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* 3. Main Workspace: Sidebar + Dynamic Module View */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => handleNavigate(tab)}
          pendingVerificationsCount={pendingVerificationsCount}
          pendingSurveysCount={pendingSurveysCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto min-h-0 min-w-0 p-4 md:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {activeTab === 'dashboard' && (
              <DashboardView
                parcels={parcels}
                surveys={surveys}
                mutations={mutations}
                registrations={registrations}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onQuickAction={(action) => console.log('Quick action:', action)}
              />
            )}

            {activeTab === 'records' && (
              <LandRecordsView
                parcels={parcels}
                ownerships={ownerships}
                crops={crops}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                initialSelectedParcelId={activeParams?.selectedParcelId}
              />
            )}

            {activeTab === 'map' && (
              <InteractiveLandMapView
                parcels={parcels}
                ownerships={ownerships}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'surveys' && (
              <LandSurveyView
                surveys={surveys}
                parcels={parcels}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                initialSelectedParcelId={activeParams?.selectedParcelId}
              />
            )}

            {activeTab === 'qr' && (
              <QRCodeManagementView
                parcels={parcels}
                qrCodes={qrCodes}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
                initialSelectedParcelId={activeParams?.selectedParcelId}
              />
            )}

            {activeTab === 'ownership' && (
              <OwnershipRecordsView
                ownerships={ownerships}
                parcels={parcels}
                mutations={mutations}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'verification' && (
              <VerificationApprovalView
                mutations={mutations}
                parcels={parcels}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'registration' && (
              <PropertyRegistrationView
                registrations={registrations}
                parcels={parcels}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'cards' && (
              <DigitalPropertyCardsView
                parcels={parcels}
                ownerships={ownerships}
                qrCodes={qrCodes}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                initialSelectedParcelId={activeParams?.selectedParcelId}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentManagementView
                documents={documents}
                parcels={parcels}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsAnalyticsView
                parcels={parcels}
                surveys={surveys}
                registrations={registrations}
                mutations={mutations}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'users' && (
              <UserRoleManagementView
                currentUser={currentUser}
                onRoleChange={handleRoleChange}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogsView
                auditLogs={auditLogs}
                notifications={notifications}
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'settings' && (
              <SystemSettingsView
                currentUser={currentUser}
                onRefresh={refreshData}
                onNavigate={handleNavigate}
              />
            )}

          </div>
        </main>

      </div>

      {/* 4. Rock-Solid Institutional Status Footer - Anchors the entire viewport and eliminates any vertical jumping */}
      <footer className="flex-shrink-0 h-8 bg-slate-900 border-t border-slate-800 text-slate-400 text-[11px] px-3 md:px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Digital Bhoomi Maharashtra</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline truncate">NIC Node: Nagpur & Pune</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-slate-400 hidden md:inline truncate">Active Cadastre: Nagpur ({parcels.filter(p => p.district === 'Nagpur').length} Zones Mapped)</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-[10px] flex-shrink-0">
          <span className="text-amber-400 font-medium hidden lg:inline">
            Fictional Demonstration Prototype
          </span>
          <span className="text-slate-400 hidden md:inline">
            Session: <strong className="text-slate-200 font-medium">{currentUser.fullName.split(' ')[0]}</strong> ({currentUser.role})
          </span>
          <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-mono font-semibold">
            v1.2.0-LIVE
          </span>
        </div>
      </footer>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => {
          dataService.markNotificationAsRead(id);
          refreshData();
        }}
        onMarkAllRead={() => {
          dataService.markAllNotificationsAsRead();
          refreshData();
        }}
        onNavigate={handleNavigate}
      />

    </div>
  );
};
