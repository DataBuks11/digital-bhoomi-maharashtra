import React, { useState } from 'react';
import { 
  MutationApplication, 
  LandParcel, 
  UserProfile, 
  MutationStatus 
} from '../types';
import { 
  CheckSquare, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  X, 
  Eye, 
  MessageSquare,
  Award
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatDateIndian } from '../lib/utils';
import { ActiveTab } from '../components/layout/Sidebar';

interface VerificationApprovalViewProps {
  mutations: MutationApplication[];
  parcels: LandParcel[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const VerificationApprovalView: React.FC<VerificationApprovalViewProps> = ({
  mutations,
  parcels,
  currentUser,
  onRefresh,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMutation, setSelectedMutation] = useState<MutationApplication | null>(null);

  // Review Form State
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [checks, setChecks] = useState({
    titleChainVerified: false,
    deedIndexVerified: false,
    mojaniConformity: false,
    noticePeriodServed: false,
  });

  const filteredMutations = mutations.filter(m => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesSearch = 
      m.mutationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.transfereeNames.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleDecision = (status: MutationStatus) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_OFFICER') {
      alert(`Unauthorized Action: Current role "${currentUser.role}" does not have statutory approval rights. Only Verification Officers (Talathi/Mandal Adhikari) or Admins can record mutation decisions.`);
      return;
    }

    if (!selectedMutation) return;
    if (!reviewRemarks.trim()) {
      alert('Please enter mandatory officer remarks before submitting decision.');
      return;
    }

    dataService.reviewMutation(selectedMutation.id, status, reviewRemarks);
    onRefresh();
    setSelectedMutation(null);
    setReviewRemarks('');
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-700" />
            Verification & Approval Queue (मंडळ अधिकारी व तलाठी फेरफार मान्यता)
          </h2>
          <p className="text-xs text-slate-500">
            Official statutory workflow for reviewing 15-day public notices, title deed conformity, and digital signing of mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Active Reviewer: {currentUser.fullName} ({currentUser.role})</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ferfar number, applicant, buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_TALATHI_REVIEW">Pending Talathi Review</option>
            <option value="NOTICE_PERIOD">In Notice Period</option>
            <option value="CORRECTION_REQUESTED">Correction Requested</option>
            <option value="APPROVED_BY_MANDAL_ADHIKARI">Approved by Mandal Adhikari</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-end font-medium">
          Showing {filteredMutations.length} verification cases
        </div>
      </div>

      {/* Applications Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ferfar Number</th>
                <th className="py-3 px-4">Parcel / Gat</th>
                <th className="py-3 px-4">Mutation Type</th>
                <th className="py-3 px-4">Transferor (विक्रेता / हस्तांतरक)</th>
                <th className="py-3 px-4">Transferee (खरेदीदार / वारसदार)</th>
                <th className="py-3 px-4">15-Day Notice Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No mutation records found.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => {
                  const parcel = parcels.find(p => p.id === m.parcelId);
                  const isExpired = new Date(m.noticeEndDate) <= new Date();

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {m.mutationNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          Gat {parcel?.gatNumber || 'N/A'}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {parcel?.village}, {parcel?.district}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {m.mutationType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {m.transferorNames.join(', ')}
                      </td>

                      <td className="py-3 px-4 font-semibold text-emerald-900">
                        {m.transfereeNames.join(', ')}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateIndian(m.noticeEndDate)}</span>
                        </div>
                        {isExpired ? (
                          <span className="text-[10px] text-emerald-700 font-bold">Notice Expired (Clear)</span>
                        ) : (
                          <span className="text-[10px] text-amber-700">Active Notice Period</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          m.status === 'APPROVED_BY_MANDAL_ADHIKARI' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          m.status === 'CORRECTION_REQUESTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          m.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {m.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedMutation(m);
                            setReviewRemarks(m.officerRemarks || '');
                            setChecks({
                              titleChainVerified: true,
                              deedIndexVerified: true,
                              mojaniConformity: true,
                              noticePeriodServed: new Date(m.noticeEndDate) <= new Date(),
                            });
                          }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Decision Modal */}
      {selectedMutation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Ferfar Statutory Review: {selectedMutation.mutationNumber}
                </h3>
                <p className="text-xs text-slate-500">Mandal Adhikari / Tehsildar Judicial Hearing</p>
              </div>
              <button
                onClick={() => setSelectedMutation(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Mutation Category</span>
                    <strong className="text-slate-800">{selectedMutation.mutationType.replace(/_/g, ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Applicant</span>
                    <strong className="text-slate-800">{selectedMutation.applicantName}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Transferor(s)</span>
                    <span className="text-slate-700">{selectedMutation.transferorNames.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Transferee(s)</span>
                    <span className="font-bold text-emerald-800">{selectedMutation.transfereeNames.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Checklist */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800">Revenue Inspection Checklist (पडताळणी यादी)</div>
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.titleChainVerified}
                      onChange={(e) => setChecks({ ...checks, titleChainVerified: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>1. Title Deed & 30-year chain document verified against Sub-Registrar records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.deedIndexVerified}
                      onChange={(e) => setChecks({ ...checks, deedIndexVerified: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>2. SRO Index-II registered entry authenticated and stamp duty confirmed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.mojaniConformity}
                      onChange={(e) => setChecks({ ...checks, mojaniConformity: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>3. Cadastral Mojani map boundaries match registered area without encroachment</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.noticePeriodServed}
                      onChange={(e) => setChecks({ ...checks, noticePeriodServed: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>4. 15-Day Public Notice expired with zero pending legal disputes / objections</span>
                  </label>
                </div>
              </div>

              {/* Officer Remarks */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mandal Adhikari / Talathi Mandatory Remarks *
                </label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter detailed statutory reasons for approval, defects requiring rectification, or grounds for objection..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              {/* Role Authorization Warning */}
              {(currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_OFFICER') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Read-Only Mode ({currentUser.role}):</strong> Current user lacks statutory verification authority. Switch to <strong>Verification Officer</strong> or <strong>Admin</strong> via the role selector in the top header to test signing or rejecting mutations.
                  </span>
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_OFFICER'}
                  onClick={() => handleDecision('REJECTED')}
                  className={`px-3.5 py-2 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Reject Mutation
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_OFFICER'}
                    onClick={() => handleDecision('CORRECTION_REQUESTED')}
                    className={`px-3.5 py-2 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                      currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-amber-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Request Correction
                  </button>

                  <button
                    type="button"
                    disabled={currentUser.role !== 'ADMIN' && currentUser.role !== 'VERIFICATION_OFFICER'}
                    onClick={() => handleDecision('APPROVED_BY_MANDAL_ADHIKARI')}
                    className={`px-4 py-2 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs ${
                      currentUser.role === 'ADMIN' || currentUser.role === 'VERIFICATION_OFFICER'
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-emerald-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Award className="w-4 h-4" /> Approve & Sign Ferfar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
