import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Compass, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  KeyRound,
  Lock,
  Building
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ActiveTab } from '../components/layout/Sidebar';

interface UserRoleManagementViewProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const UserRoleManagementView: React.FC<UserRoleManagementViewProps> = ({
  currentUser,
  onRoleChange,
  onRefresh,
  onNavigate,
}) => {
  const profiles = dataService.getProfiles();

  // Permissions Matrix
  const permissionsData = [
    { module: 'Dashboard & Global Search', admin: true, officer: true, surveyor: true, citizen: true },
    { module: '7/12 Land Records (Read / View)', admin: true, officer: true, surveyor: true, citizen: true },
    { module: 'Enroll New Land Parcel (Write)', admin: true, officer: true, surveyor: false, citizen: false },
    { module: 'Cadastral Land Map & Measurement', admin: true, officer: true, surveyor: true, citizen: true },
    { module: 'Schedule Mojani Survey', admin: true, officer: true, surveyor: true, citizen: true },
    { module: 'Survey Field Demarcation & Notes', admin: true, officer: false, surveyor: true, citizen: false },
    { module: 'Generate & Scan Bhu-Aadhaar QR', admin: true, officer: true, surveyor: true, citizen: true },
    { module: 'Review & Approve Ferfar Mutations', admin: true, officer: true, surveyor: false, citizen: false },
    { module: 'SRO Deed Registration Wizard', admin: true, officer: true, surveyor: false, citizen: true },
    { module: 'Digital Property Cards (PDF Export)', admin: true, officer: true, surveyor: true, citizen: true },
    { module: 'System Settings & Demo Reset', admin: true, officer: false, surveyor: false, citizen: false },
    { module: 'Access Immutable Audit Logs', admin: true, officer: true, surveyor: false, citizen: false },
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-700" />
            User & Role-Based Access Control (RBAC) (वापरकर्ता व भूमिका व्यवस्थापन)
          </h2>
          <p className="text-xs text-slate-500">
            Enforce role boundaries across Super Admin, Cadastral Surveyor, Talathi / Verification Officer, and Citizen personas.
          </p>
        </div>

        <div className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <span>Active Role: {currentUser.role}</span>
        </div>
      </div>

      {/* Quick Role Switcher Banner for Evaluator */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Prototype Evaluation Control
          </div>
          <div className="text-sm font-bold mt-0.5">Switch Persona to Experience Role Workflows</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instantly switch the simulated credentials to test surveyor field forms, officer approval queues, or citizen self-service.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ADMIN', 'VERIFICATION_OFFICER', 'SURVEYOR', 'CITIZEN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.role === r
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* User Profiles Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" /> System Personnel Directory
          </span>
          <span className="text-slate-400">{profiles.length} Active System Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role & Persona</th>
                <th className="py-3 px-4">Department & Office</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4 text-right">Switch Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-300 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{p.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      p.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      p.role === 'VERIFICATION_OFFICER' ? 'bg-amber-100 text-amber-800' :
                      p.role === 'SURVEYOR' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.role.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {p.department}
                  </td>

                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {p.district}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600">
                    {p.phone}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {currentUser.id === p.id ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => onRoleChange(p.role)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300"
                      >
                        Assume Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 font-semibold">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Granular Access Control Policy Matrix
          </span>
          <span className="text-slate-400">Enforced at Supabase RLS and Frontend level</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">System Operation / Module</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
                <th className="py-3 px-4 text-center">Verification Officer</th>
                <th className="py-3 px-4 text-center">Cadastral Surveyor</th>
                <th className="py-3 px-4 text-center">Citizen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsData.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {perm.module}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.officer ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.surveyor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.citizen ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
