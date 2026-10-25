import React, { useState } from 'react';
import { 
  OwnershipRecord, 
  LandParcel, 
  MutationApplication, 
  UserProfile 
} from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatDateIndian } from '../lib/utils';
import { ActiveTab } from '../components/layout/Sidebar';

interface OwnershipRecordsViewProps {
  ownerships: OwnershipRecord[];
  parcels: LandParcel[];
  mutations: MutationApplication[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const OwnershipRecordsView: React.FC<OwnershipRecordsViewProps> = ({
  ownerships,
  parcels,
  mutations,
  currentUser,
  onRefresh,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Joint Owner Form State
  const [formData, setFormData] = useState({
    parcelId: parcels[0]?.id || '',
    ownerName: '',
    relationType: 'JOINT_HOLDER' as const,
    guardianName: '',
    aadhaarMasked: 'XXXX-XXXX-9182',
    sharePercentage: 25,
    khataNumber: 'KH-' + Math.floor(1000 + Math.random() * 8999),
  });

  const filteredOwnerships = ownerships.filter(o => {
    const parcel = parcels.find(p => p.id === o.parcelId);
    const matchesSearch = 
      o.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.khataNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parcel && parcel.gatNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (parcel && parcel.village.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesParcel = selectedParcelId === 'ALL' || o.parcelId === selectedParcelId;
    return matchesSearch && matchesParcel;
  });

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerName || !formData.parcelId) {
      alert('Please fill owner name and parcel');
      return;
    }

    dataService.addOwnershipRecord({
      parcelId: formData.parcelId,
      ownerName: formData.ownerName,
      relationType: formData.relationType,
      guardianName: formData.guardianName || undefined,
      aadhaarMasked: formData.aadhaarMasked,
      sharePercentage: Number(formData.sharePercentage),
      khataNumber: formData.khataNumber,
      entryDate: new Date().toISOString().split('T')[0],
      isPrimary: false,
      status: 'ACTIVE',
    });

    onRefresh();
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Ownership & Khatedar Registry (खातेदार व संयुक्त धारणा नोंद)
          </h2>
          <p className="text-xs text-slate-500">
            Maintain land rights, joint khatedar percentage allocations, ancestral shares, and Gaon Namuna 6 mutation links.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Joint Khatedar
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by owner name, Khata no, Gat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Parcel:</span>
          <select
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Parcels</option>
            {parcels.map(p => (
              <option key={p.id} value={p.id}>
                Gat {p.gatNumber} - {p.village} ({p.ulpin})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-end font-medium">
          Showing {filteredOwnerships.length} khatedar records
        </div>
      </div>

      {/* Khatedar Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Khata Number</th>
                <th className="py-3 px-4">Khatedar Full Name</th>
                <th className="py-3 px-4">Relation / Type</th>
                <th className="py-3 px-4">Parcel & Location</th>
                <th className="py-3 px-4">Ownership Share</th>
                <th className="py-3 px-4">Aadhaar (Masked)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOwnerships.map((owner) => {
                const parcel = parcels.find(p => p.id === owner.parcelId);

                return (
                  <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {owner.khataNumber}
                      {owner.isPrimary && (
                        <span className="block text-[10px] text-emerald-700 font-sans font-semibold">
                          ★ Primary Khatedar
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{owner.ownerName}</div>
                      {owner.guardianName && (
                        <div className="text-[11px] text-slate-500">Guardian: {owner.guardianName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {owner.relationType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold text-slate-800">
                        Gat No. {parcel?.gatNumber || 'N/A'}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {parcel?.village}, {parcel?.district}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Percent className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{owner.sharePercentage}%</span>
                      </div>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="bg-emerald-600 h-full rounded-full" 
                          style={{ width: `${owner.sharePercentage}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {owner.aadhaarMasked}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        owner.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        owner.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {owner.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('records', { selectedParcelId: owner.parcelId })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-200"
                      >
                        Inspect 7/12
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ferfar / Gaon Namuna 6 Summary Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Gaon Namuna 6 - Mutation Register (गाव नमुना ६ फेरफार नोंदवही)
            </h3>
            <p className="text-xs text-slate-500">
              Statutory 15-day notice period and title mutation history.
            </p>
          </div>
          <button
            onClick={() => onNavigate('verification')}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            Open Officer Verification Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {mutations.map(m => (
            <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{m.mutationNumber}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  m.status === 'APPROVED_BY_MANDAL_ADHIKARI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {m.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-slate-700">
                Type: <strong>{m.mutationType.replace(/_/g, ' ')}</strong>
              </div>
              <div className="text-slate-600 text-[11px]">
                Notice End: <strong>{formatDateIndian(m.noticeEndDate)}</strong> ({m.objectionsCount} Objections)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Joint Khatedar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Add Joint Khatedar (सह-खातेदार)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOwner} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Land Parcel</label>
                <select
                  value={formData.parcelId}
                  onChange={(e) => setFormData({ ...formData, parcelId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                  required
                >
                  {parcels.map(p => (
                    <option key={p.id} value={p.id}>
                      Gat No. {p.gatNumber} ({p.village}, {p.taluka}) - {p.ulpin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Khatedar Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Smt. Mangala Pandurang Jadhav"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Relation Type</label>
                  <select
                    value={formData.relationType}
                    onChange={(e) => setFormData({ ...formData, relationType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="JOINT_HOLDER">Joint Holder (सह-धारक)</option>
                    <option value="LEGAL_HEIR">Legal Heir (वारसदार)</option>
                    <option value="WIFE_OF">Wife Of (पत्नी)</option>
                    <option value="SON_OF">Son Of (मुलगा)</option>
                    <option value="SELF">Self (स्वतः)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Ownership Share (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.sharePercentage}
                    onChange={(e) => setFormData({ ...formData, sharePercentage: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Aadhaar (Masked)</label>
                  <input
                    type="text"
                    value={formData.aadhaarMasked}
                    onChange={(e) => setFormData({ ...formData, aadhaarMasked: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Khata Number</label>
                  <input
                    type="text"
                    value={formData.khataNumber}
                    onChange={(e) => setFormData({ ...formData, khataNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Khatedar Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
