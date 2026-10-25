import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, BellRing, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../../types';
import { formatDateIndian } from '../../lib/utils';
import { ActiveTab } from './Sidebar';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">Notifications & Operational Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>{notifications.filter(n => !n.isRead).length} unread updates</span>
          <button
            onClick={onMarkAllRead}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Mark all as read
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((item) => {
              const getIcon = () => {
                switch (item.type) {
                  case 'SUCCESS':
                    return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
                  case 'WARNING':
                  case 'ALERT':
                    return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
                  default:
                    return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
                }
              };

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all ${
                    item.isRead
                      ? 'bg-white border-slate-200 text-slate-600'
                      : 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getIcon()}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateIndian(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                      
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                        {item.linkUrl ? (
                          <button
                            onClick={() => {
                              onMarkRead(item.id);
                              onNavigate(item.linkUrl as ActiveTab);
                              onClose();
                            }}
                            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                          >
                            Open Record <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : <span />}

                        {!item.isRead && (
                          <button
                            onClick={() => onMarkRead(item.id)}
                            className="text-[10px] text-slate-500 hover:text-slate-800"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
