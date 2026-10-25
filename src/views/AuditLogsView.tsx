import React, { useState } from 'react';
import { 
  AuditLog, 
  NotificationItem, 
  UserProfile 
} from '../types';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { formatDateIndian } from '../lib/utils';
import { dataService } from '../services/dataService';
import { ActiveTab } from '../components/layout/Sidebar';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs,
  notifications,
  currentUser,
  onRefresh,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'notifications'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.userRole && log.userRole.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesModule && matchesSearch;
  });

  const modules = [
    'ALL',
    'Land Records',
    'Survey Management',
    'QR Management',
    'Ownership Records',
    'Verification & Approval',
    'Property Registration',
    'Document Management',
    'User Management',
    'System Settings'
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Audit Logs & Activity Trail (अभिलेख तपासणी व इतिहास)
          </h2>
          <p className="text-xs text-slate-500">
            Immutable government audit trail recording every parcel modification, survey update, QR scan, and title verification.
          </p>
        </div>

        {/* Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'audit' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'notifications' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications ({notifications.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit actions, emails, modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Module:</span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {modules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-end font-medium">
              Showing {filteredLogs.length} audit entries
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor & Role</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.userEmail || 'System'}</div>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">
                          {log.userRole || 'Automated'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                          {log.module}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        {log.action}
                      </td>

                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200" title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: NOTIFICATIONS */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">System Broadcasts & Alerts</h3>
            <button
              onClick={() => {
                dataService.markAllNotificationsAsRead();
                onRefresh();
              }}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Mark all notifications as read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  item.isRead ? 'bg-white border-slate-200' : 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.type === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : item.type === 'ALERT' || item.type === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      {formatDateIndian(item.createdAt)}
                    </span>
                  </div>
                </div>

                {item.linkUrl && (
                  <button
                    onClick={() => onNavigate(item.linkUrl as ActiveTab)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap self-center"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
