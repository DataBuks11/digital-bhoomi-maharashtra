import React, { useState } from 'react';
import { 
  LandParcel, 
  OwnershipRecord, 
  CropRecord, 
  LandType, 
  TenureType, 
  ParcelStatus,
  UserProfile 
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  QrCode, 
  Compass, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  Building,
  Sprout,
  Users,
  ShieldCheck,
  Download
} from 'lucide-react';
import { formatCurrencyINR, generateULPIN } from '../lib/utils';
import { dataService } from '../services/dataService';
import { ActiveTab } from '../components/layout/Sidebar';

interface LandRecordsViewProps {
  parcels: LandParcel[];
  ownerships: OwnershipRecord[];
  crops: CropRecord[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  initialSelectedParcelId?: string;
}

export const LandRecordsView: React.FC<LandRecordsViewProps> = ({
  parcels,
  ownerships,
  crops,
  currentUser,
  onRefresh,
  onNavigate,
  initialSelectedParcelId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [landTypeFilter, setLandTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(() => {
    if (initialSelectedParcelId) {
      return parcels.find(p => p.id === initialSelectedParcelId) || null;
    }
    return null;
  });
  const [extractTab, setExtractTab] = useState<'7' | '12' | '8A'>('7');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Parcel Form State
  const [formData, setFormData] = useState({
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Wagholi',
    gatNumber: '',
    surveyNumber: '',
    subDivision: '1',
    areaHectare: 1,
    areaAre: 0,
    potKharabaSqm: 0,
    landType: 'AGRICULTURAL_BAGAYAT' as LandType,
    tenureType: 'BHOGVATA_CLASS_1' as TenureType,
    assessmentTax: 250,
    primaryOwnerName: '',
    ownerAadhaar: 'XXXX-XXXX-4521',
  });

  const districts = ['ALL', 'Pune', 'Nagpur', 'Nashik', 'Chhatrapati Sambhaji Nagar', 'Thane'];

  // Filter Logic
  const filteredParcels = parcels.filter((p) => {
    const matchesSearch = 
      p.gatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ulpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.taluka.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerships.some(o => o.parcelId === p.id && o.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDistrict = districtFilter === 'ALL' || p.district.toLowerCase() === districtFilter.toLowerCase();
    const matchesType = landTypeFilter === 'ALL' || p.landType === landTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesDistrict && matchesType && matchesStatus;
  });

  const handleCreateParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gatNumber) {
      alert('Please enter a valid Gat Number');
      return;
    }

    const totalAreaSqm = (formData.areaHectare * 10000) + (formData.areaAre * 100);
    const ulpin = generateULPIN('MH', formData.district.substring(0, 3).toUpperCase());

    const created = dataService.createParcel({
      ulpin,
      district: formData.district,
      taluka: formData.taluka,
      village: formData.village,
      gatNumber: formData.gatNumber,
      surveyNumber: formData.surveyNumber || formData.gatNumber,
      subDivision: formData.subDivision,
      totalAreaSqm,
      areaHectare: Number(formData.areaHectare),
      areaAre: Number(formData.areaAre),
      potKharabaSqm: Number(formData.potKharabaSqm),
      landType: formData.landType,
      tenureType: formData.tenureType,
      assessmentTax: Number(formData.assessmentTax),
      status: 'VERIFIED',
      boundaryCoordinates: [
        { lat: 18.5204 + (Math.random() - 0.5) * 0.1, lng: 73.8567 + (Math.random() - 0.5) * 0.1, label: 'Corner North' },
        { lat: 18.5214 + (Math.random() - 0.5) * 0.1, lng: 73.8587 + (Math.random() - 0.5) * 0.1, label: 'Corner East' },
        { lat: 18.5194 + (Math.random() - 0.5) * 0.1, lng: 73.8597 + (Math.random() - 0.5) * 0.1, label: 'Corner South' },
        { lat: 18.5184 + (Math.random() - 0.5) * 0.1, lng: 73.8557 + (Math.random() - 0.5) * 0.1, label: 'Corner West' },
      ],
    });

    // Create Initial Khatedar
    if (formData.primaryOwnerName) {
      dataService.addOwnershipRecord({
        parcelId: created.id,
        ownerName: formData.primaryOwnerName,
        relationType: 'SELF',
        aadhaarMasked: formData.ownerAadhaar,
        sharePercentage: 100,
        khataNumber: 'KH-' + Math.floor(1000 + Math.random() * 8999),
        entryDate: new Date().toISOString().split('T')[0],
        isPrimary: true,
        status: 'ACTIVE',
      });
    }

    onRefresh();
    setIsAddModalOpen(false);
    setSelectedParcel(created);
  };

  const handlePrintExtract = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            7/12 Land Records Repository (गाव नमुना सात/बारा)
          </h2>
          <p className="text-xs text-slate-500">
            Search, inspect, and verify official 7/12 extracts, Form 8A Khata holdings, and crop entries across Maharashtra.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Enroll New Land Parcel
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Gat, ULPIN, Owner, Village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
          />
        </div>

        {/* District Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">District:</span>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Land Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Type:</span>
          <select
            value={landTypeFilter}
            onChange={(e) => setLandTypeFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="AGRICULTURAL_BAGAYAT">Agricultural (Bagayat / Irrigated)</option>
            <option value="AGRICULTURAL_JIRAYAT">Agricultural (Jirayat / Rainfed)</option>
            <option value="NON_AGRICULTURAL_RESIDENTIAL">Non-Agri Residential</option>
            <option value="NON_AGRICULTURAL_COMMERCIAL">Non-Agri Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="GOVERNMENT_RESERVED">Government Reserved</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="MUTATION_IN_PROGRESS">Mutation In Progress</option>
            <option value="PENDING_SURVEY">Pending Survey</option>
            <option value="IN_DISPUTE">In Dispute</option>
          </select>
        </div>

      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Found <strong>{filteredParcels.length}</strong> land parcels in registry</span>
          <span className="text-slate-400">Click any row to view complete 7/12 extract</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Gat / Survey</th>
                <th className="py-3 px-4">ULPIN (Bhu-Aadhaar)</th>
                <th className="py-3 px-4">Primary Khatedar</th>
                <th className="py-3 px-4">Location (Village / Taluka / Dist)</th>
                <th className="py-3 px-4">Total Area</th>
                <th className="py-3 px-4">Tenure & Classification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No land records match the specified filters. Try adjusting your search query.
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel) => {
                  const parcelOwners = ownerships.filter(o => o.parcelId === parcel.id);
                  const primaryOwner = parcelOwners.find(o => o.isPrimary) || parcelOwners[0];

                  return (
                    <tr
                      key={parcel.id}
                      onClick={() => setSelectedParcel(parcel)}
                      className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-800">
                          Gat No. {parcel.gatNumber}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-normal">
                          Survey No. {parcel.surveyNumber} (Sub {parcel.subDivision})
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-emerald-800">
                        {parcel.ulpin}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {primaryOwner ? primaryOwner.ownerName : 'No Khatedar Linked'}
                        </span>
                        {parcelOwners.length > 1 && (
                          <span className="block text-[10px] text-slate-500">
                            +{parcelOwners.length - 1} Joint Holders
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <div>{parcel.village}, {parcel.taluka}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{parcel.district}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {parcel.areaHectare} Hectare {parcel.areaAre} Are
                        <span className="block text-[10px] text-slate-500">
                          ({parcel.totalAreaSqm.toLocaleString()} sq.m)
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] block font-medium text-slate-700">
                          {parcel.landType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {parcel.tenureType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          parcel.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          parcel.status === 'IN_DISPUTE' ? 'bg-red-100 text-red-800 border border-red-200' :
                          parcel.status === 'MUTATION_IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {parcel.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedParcel(parcel)}
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="View official 7/12 extract"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('cards', { selectedParcelId: parcel.id })}
                            className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                            title="Digital Property Card"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigate('qr', { selectedParcelId: parcel.id })}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
                            title="View Bhu-Aadhaar QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official 7/12 (Saat-Bara) Extract Modal */}
      {selectedParcel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">
                    महाराष्ट्र शासन - महसूल विभाग (गाव नमुना सात/बारा)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ULPIN: {selectedParcel.ulpin} | Gat No: {selectedParcel.gatNumber} ({selectedParcel.village})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintExtract}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedParcel(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: 7 (Rights), 12 (Crops), 8A (Holdings) */}
            <div className="px-5 pt-3 bg-white border-b border-slate-200 flex items-center gap-4 text-xs font-semibold no-print">
              <button
                onClick={() => setExtractTab('7')}
                className={`pb-2 border-b-2 transition-colors ${extractTab === '7' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                गाव नमुना ७ (अधिकार अभिलेख पत्रक)
              </button>
              <button
                onClick={() => setExtractTab('12')}
                className={`pb-2 border-b-2 transition-colors ${extractTab === '12' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                गाव नमुना १२ (पिकांची पाहणी व पाणीपुरवठा)
              </button>
              <button
                onClick={() => setExtractTab('8A')}
                className={`pb-2 border-b-2 transition-colors ${extractTab === '8A' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                गाव नमुना ८-अ (खातेदाराची नोंदवही)
              </button>
            </div>

            {/* Printable Official Maharashtra Form Content */}
            <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-900 bg-amber-50/15 demo-watermark-overlay" id="printable-document">
              
              {/* Document Banner */}
              <div className="text-center pb-4 border-b-2 border-slate-800 mb-4">
                <div className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1">
                  *** प्रात्यक्षिक नमुना प्रत (DEMONSTRATION PROTOTYPE EXTRACT - NOT FOR LEGAL COURT PURPOSES) ***
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 uppercase">
                  महाराष्ट्र शासन - महसूल व वन विभाग
                </h2>
                <div className="text-sm font-semibold text-slate-700">
                  {extractTab === '7' && 'गाव नमुना सात - अधिकार अभिलेख पत्रक (कलम १४८, महाराष्ट्र जमीन महसूल संहिता, १९६६)'}
                  {extractTab === '12' && 'गाव नमुना बारा - पिकांची पाहणी नोंदवही'}
                  {extractTab === '8A' && 'गाव नमुना आठ-अ - खातेदाराची जमीन धारण नोंदवही'}
                </div>
                <div className="mt-2 text-xs flex flex-wrap items-center justify-center gap-4 text-slate-600 font-sans">
                  <span><strong>गाव:</strong> {selectedParcel.village}</span>
                  <span><strong>तालुका:</strong> {selectedParcel.taluka}</span>
                  <span><strong>जिल्हा:</strong> {selectedParcel.district}</span>
                  <span><strong>गट क्र.:</strong> {selectedParcel.gatNumber}</span>
                  <span><strong>भू-आधार (ULPIN):</strong> <span className="font-mono text-emerald-800 font-bold">{selectedParcel.ulpin}</span></span>
                </div>
              </div>

              {/* Tab 7: Form 7 (Rights) */}
              {extractTab === '7' && (
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Land Specification Table */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-300">
                    <div>
                      <div className="text-slate-500 text-[11px]">भू-धारणा पद्धती (Tenure)</div>
                      <div className="font-bold text-slate-800">{selectedParcel.tenureType.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px]">एकूण क्षेत्र (Total Area)</div>
                      <div className="font-bold text-slate-800">{selectedParcel.areaHectare} हे. {selectedParcel.areaAre} आर</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px]">पोटखराब क्षेत्र (Uncultivable)</div>
                      <div className="font-bold text-slate-800">{selectedParcel.potKharabaSqm} चौ.मी.</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px]">आकारणी / जुडी (Assessment Tax)</div>
                      <div className="font-bold text-slate-800">{formatCurrencyINR(selectedParcel.assessmentTax)}</div>
                    </div>
                  </div>

                  {/* Khatedar & Rights Holder Table */}
                  <div className="border border-slate-300 rounded overflow-hidden bg-white">
                    <div className="p-2.5 bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                      भोगवटादार / खातेदारांची नावे व हक्क (Occupants & Khatedars)
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2">खाते क्र. (Khata)</th>
                          <th className="p-2">खातेदाराचे पूर्ण नाव (Khatedar Name)</th>
                          <th className="p-2">संबंध (Relation)</th>
                          <th className="p-2">हिस्सा (Share %)</th>
                          <th className="p-2">फेरफार क्र. (Mutation)</th>
                          <th className="p-2">स्थिती (Status)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ownerships.filter(o => o.parcelId === selectedParcel.id).map(owner => (
                          <tr key={owner.id}>
                            <td className="p-2 font-mono font-bold text-emerald-800">{owner.khataNumber}</td>
                            <td className="p-2 font-bold text-slate-800">
                              {owner.ownerName}
                              {owner.isPrimary && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-sans">प्रमुख खातेदार</span>
                              )}
                            </td>
                            <td className="p-2 text-slate-600">{owner.relationType}</td>
                            <td className="p-2 font-bold text-slate-800">{owner.sharePercentage}%</td>
                            <td className="p-2 font-mono text-slate-600">{owner.mutationNumber || 'N/A'}</td>
                            <td className="p-2">
                              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {owner.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Encumbrances & Other Rights Note */}
                  <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-slate-800">
                    <div className="font-bold text-xs text-amber-900 mb-1">इतर हक्क व बोजा (Encumbrances & Liabilities):</div>
                    <p className="text-[11px] leading-relaxed">
                      सदर जमिनीवर कोणतीही शासकीय जप्ती किंवा स्थगिती आदेश नाही. जमीन महसूल संहिता कलम १४८ अन्वये डिजिटल स्वाक्षरीत नमुना.
                    </p>
                  </div>

                </div>
              )}

              {/* Tab 12: Form 12 (Crops) */}
              {extractTab === '12' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="border border-slate-300 rounded overflow-hidden bg-white">
                    <div className="p-2.5 bg-slate-100 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
                      <span>पिकांची पाहणी (Crops Inspection Register)</span>
                      <span className="text-xs text-slate-500 font-normal">सन २०२३ - २०२४</span>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2">वर्ष व हंगाम (Season)</th>
                          <th className="p-2">पिकाचे नाव (Crop)</th>
                          <th className="p-2">बागायती क्षेत्र (Irrigated Ha)</th>
                          <th className="p-2">जिरायती क्षेत्र (Rainfed Ha)</th>
                          <th className="p-2">पाणीपुरवठ्याचे साधन (Water Source)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {crops.filter(c => c.parcelId === selectedParcel.id).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">
                              चालू वर्षासाठी कोणतीही विशिष्ट पिकांची नोंद नाही. (Fallow / Non-Agri Land)
                            </td>
                          </tr>
                        ) : (
                          crops.filter(c => c.parcelId === selectedParcel.id).map(crop => (
                            <tr key={crop.id}>
                              <td className="p-2 font-semibold text-slate-800">{crop.year} ({crop.season})</td>
                              <td className="p-2 font-bold text-emerald-800">{crop.cropMarathiName} ({crop.cropName})</td>
                              <td className="p-2 font-mono">{crop.irrigatedAreaHectares} हे.</td>
                              <td className="p-2 font-mono">{crop.unirrigatedAreaHectares} हे.</td>
                              <td className="p-2 text-slate-600">{crop.waterSource}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 8A: Holding Ledger */}
              {extractTab === '8A' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-3 bg-white rounded border border-slate-300 space-y-2">
                    <div className="font-bold text-slate-800 text-sm">खातेदारनिहाय एकूण जमीन धारणा तपशील (Form 8-A)</div>
                    <p className="text-slate-600 text-xs">
                      या गावातील खातेदाराच्या नावावर असलेली सर्व गट/सर्व्हे नंबर व एकूण महसूल आकारणीची संकलित नोंद.
                    </p>
                    <div className="pt-2">
                      {ownerships.filter(o => o.parcelId === selectedParcel.id).map(o => (
                        <div key={o.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 mb-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{o.ownerName}</span>
                            <span className="block text-slate-500 text-[11px]">खाते क्र. {o.khataNumber} | हिस्सा {o.sharePercentage}%</span>
                          </div>
                          <span className="font-mono text-emerald-800 font-bold">
                            {selectedParcel.areaHectare} हे. {selectedParcel.areaAre} आर
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Stamp & Officer Signature Block */}
              <div className="mt-6 pt-4 border-t-2 border-slate-300 flex items-end justify-between font-sans text-[11px] text-slate-600">
                <div>
                  <div><strong>डिजिटल पडताळणी तारीख:</strong> {new Date().toLocaleDateString('en-IN')}</div>
                  <div><strong>प्रमाणित अधिकारी:</strong> तलाठी / मंडळ अधिकारी (सझा {selectedParcel.village})</div>
                  <div className="text-[10px] text-slate-400 mt-1">सुरक्षित हॅश: {selectedParcel.qrCodeHash}</div>
                </div>

                <div className="text-center">
                  <div className="w-24 h-12 border-2 border-dashed border-emerald-700/60 rounded flex items-center justify-center text-emerald-800 font-bold text-[10px] mb-1">
                    डिजिटल स्वाक्षरीत<br/>MAHA-BHOOMI
                  </div>
                  <div className="font-bold text-slate-800">तलाठी, सझा {selectedParcel.village}</div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onNavigate('cards', { selectedParcelId: selectedParcel.id });
                    setSelectedParcel(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" /> View Property Card
                </button>
                <button
                  onClick={() => {
                    onNavigate('qr', { selectedParcelId: selectedParcel.id });
                    setSelectedParcel(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" /> Bhu-Aadhaar QR
                </button>
                <button
                  onClick={() => {
                    onNavigate('surveys', { selectedParcelId: selectedParcel.id });
                    setSelectedParcel(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" /> Request Survey
                </button>
              </div>

              <button
                onClick={() => setSelectedParcel(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Enroll New Land Parcel */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Enroll New Land Parcel (Bhu-Abhilekh)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateParcel} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Chhatrapati Sambhaji Nagar">Chhatrapati Sambhaji Nagar</option>
                    <option value="Thane">Thane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Taluka</label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Village</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gat Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 195"
                    value={formData.gatNumber}
                    onChange={(e) => setFormData({ ...formData, gatNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Survey Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 72/1"
                    value={formData.surveyNumber}
                    onChange={(e) => setFormData({ ...formData, surveyNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sub-Division (Hissa)</label>
                  <input
                    type="text"
                    value={formData.subDivision}
                    onChange={(e) => setFormData({ ...formData, subDivision: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Area (Hectares)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.areaHectare}
                    onChange={(e) => setFormData({ ...formData, areaHectare: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Area (Are / Gunthas)</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={formData.areaAre}
                    onChange={(e) => setFormData({ ...formData, areaAre: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pot Kharaba (sq.m)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.potKharabaSqm}
                    onChange={(e) => setFormData({ ...formData, potKharabaSqm: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Land Classification</label>
                  <select
                    value={formData.landType}
                    onChange={(e) => setFormData({ ...formData, landType: e.target.value as LandType })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="AGRICULTURAL_BAGAYAT">Agricultural Bagayat (Irrigated)</option>
                    <option value="AGRICULTURAL_JIRAYAT">Agricultural Jirayat (Rainfed)</option>
                    <option value="NON_AGRICULTURAL_RESIDENTIAL">Non-Agri Residential</option>
                    <option value="NON_AGRICULTURAL_COMMERCIAL">Non-Agri Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="GOVERNMENT_RESERVED">Government Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tenure Type</label>
                  <select
                    value={formData.tenureType}
                    onChange={(e) => setFormData({ ...formData, tenureType: e.target.value as TenureType })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="BHOGVATA_CLASS_1">Bhogvata Class 1 (Occupant Class I)</option>
                    <option value="BHOGVATA_CLASS_2">Bhogvata Class 2 (Occupant Class II)</option>
                    <option value="GOVERNMENT_LEASE">Government Lease</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800 mb-2">Initial Khatedar (Primary Land Owner)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Shri Prakash Narayan More"
                      value={formData.primaryOwnerName}
                      onChange={(e) => setFormData({ ...formData, primaryOwnerName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">Aadhaar Reference (Masked)</label>
                    <input
                      type="text"
                      value={formData.ownerAadhaar}
                      onChange={(e) => setFormData({ ...formData, ownerAadhaar: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save & Generate ULPIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
