import React, { useState } from 'react';
import { 
  PropertyRegistration, 
  LandParcel, 
  UserProfile 
} from '../types';
import { 
  FileSignature, 
  Plus, 
  Search, 
  Calculator, 
  Calendar, 
  Building, 
  CheckCircle2, 
  CreditCard, 
  X, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatCurrencyINR, formatDateIndian } from '../lib/utils';
import { ActiveTab } from '../components/layout/Sidebar';
import jsPDF from 'jspdf';

interface PropertyRegistrationViewProps {
  registrations: PropertyRegistration[];
  parcels: LandParcel[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const PropertyRegistrationView: React.FC<PropertyRegistrationViewProps> = ({
  registrations,
  parcels,
  currentUser,
  onRefresh,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard State
  const [selectedParcelId, setSelectedParcelId] = useState<string>(parcels[0]?.id || '');
  const [sellerName, setSellerName] = useState('Shri Rameshwar Tukaram Patil');
  const [buyerName, setBuyerName] = useState('Dr. Sanjay M. Deshpande');
  const [considerationAmount, setConsiderationAmount] = useState<number>(3500000);
  const [readyReckonerRatePerSqm, setReadyReckonerRatePerSqm] = useState<number>(320); // Rs per sq.m in Wagholi/Haveli
  const [selectedSroOffice, setSelectedSroOffice] = useState('Haveli-1 (Shivajinagar, Pune)');
  const [appointmentDate, setAppointmentDate] = useState(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [appointmentSlot, setAppointmentSlot] = useState('11:00 AM - 11:30 AM');

  const activeParcel = parcels.find(p => p.id === selectedParcelId) || parcels[0];

  // Stamp duty calculation
  const calculatedMarketValuation = activeParcel 
    ? activeParcel.totalAreaSqm * readyReckonerRatePerSqm 
    : considerationAmount;

  const effectiveValuation = Math.max(considerationAmount, calculatedMarketValuation);
  const stampDutyRate = 0.06; // 6% in Maharashtra (5% Stamp Duty + 1% Local Body Cess)
  const calculatedStampDuty = Math.round(effectiveValuation * stampDutyRate);
  const registrationFee = 30000; // Cap in Maharashtra

  const handleCreateRegistration = (e: React.FormEvent) => {
    e.preventDefault();

    dataService.createRegistration({
      parcelId: selectedParcelId,
      sellerName,
      buyerName,
      marketValuation: effectiveValuation,
      considerationAmount,
      stampDutyPaid: calculatedStampDuty,
      registrationFee,
      sroOffice: selectedSroOffice,
      appointmentDate,
      appointmentSlot,
      status: 'FEES_PAID',
    });

    onRefresh();
    setIsWizardOpen(false);
    setWizardStep(1);
  };

  const handleDownloadSlip = (reg: PropertyRegistration) => {
    const parcel = parcels.find(p => p.id === reg.parcelId);
    const doc = new jsPDF();

    // Border
    doc.setDrawColor(21, 128, 61);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 186, 273);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(21, 128, 61);
    doc.text('GOVERNMENT OF MAHARASHTRA (IGR DEMO)', 105, 24, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('REGISTRATION & STAMPS DEPARTMENT (मुद्रांक व नोंदणी विभाग)', 105, 30, { align: 'center' });
    doc.text('SUB-REGISTRAR OFFICE (SRO) APPOINTMENT & CHALLAN RECEIPT', 105, 36, { align: 'center' });

    // Demonstration Watermark
    doc.setFontSize(28);
    doc.setTextColor(220, 38, 38);
    doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
    doc.text('DEMONSTRATION SAMPLE TOKEN', 105, 140, { align: 'center', angle: 45 });
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Token Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.rect(16, 44, 178, 28, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Booking Token: ${reg.tokenNumber}`, 20, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Booking Date: ${formatDateIndian(reg.createdAt)}`, 120, 52);
    doc.text(`SRO Office: ${reg.sroOffice}`, 20, 60);
    doc.text(`Deed Reference: ${reg.deedNumber || 'Deed of Conveyance (Sale Deed)'}`, 20, 68);
    doc.text(`Token Status: ${reg.status}`, 120, 68);

    // Parties
    doc.rect(16, 76, 178, 32);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 76, 178, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PARTIES & CONVEYANCING ATTRIBUTES', 20, 81);

    doc.setFont('helvetica', 'normal');
    doc.text(`Seller / Transferor: ${reg.sellerName}`, 20, 90);
    doc.text(`Buyer / Transferee: ${reg.buyerName}`, 110, 90);
    doc.text(`Market Valuation (RR Rate): ${formatCurrencyINR(reg.marketValuation)}`, 20, 98);
    doc.text(`Agreed Consideration: ${formatCurrencyINR(reg.considerationAmount)}`, 110, 98);

    // Parcel Info
    doc.rect(16, 112, 178, 28);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 112, 178, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PROPERTY IDENTIFICATION', 20, 117);

    doc.setFont('helvetica', 'normal');
    doc.text(`Gat No: ${parcel?.gatNumber || 'N/A'} (Survey ${parcel?.surveyNumber || 'N/A'})`, 20, 126);
    doc.text(`Village: ${parcel?.village || 'N/A'}, Taluka: ${parcel?.taluka || 'N/A'}`, 110, 126);
    doc.text(`District: ${parcel?.district || 'N/A'}`, 20, 134);
    doc.text(`Bhu-Aadhaar ULPIN: ${parcel?.ulpin || 'N/A'}`, 110, 134);

    // Fee Breakdown Challan
    doc.rect(16, 144, 178, 40);
    doc.setFillColor(241, 245, 249);
    doc.rect(16, 144, 178, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('STAMP DUTY & e-CHALLAN FEE SCHEDULE', 20, 149);

    doc.setFont('helvetica', 'normal');
    doc.text(`Stamp Duty (Maharashtra Stamp Act): ${formatCurrencyINR(reg.stampDutyPaid)}`, 20, 158);
    doc.text(`Local Body Cess (1% included): Included in Total`, 110, 158);
    doc.text(`SRO Registration Document Handling Fee: ${formatCurrencyINR(reg.registrationFee)}`, 20, 166);
    doc.text(`Payment Status: ${reg.status === 'REGISTERED' || reg.status === 'FEES_PAID' ? 'PAID (e-GRAS Demo Challan)' : 'PENDING COUNTER DEPOSIT'}`, 110, 166);

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL LEVY PAID: ${formatCurrencyINR((reg.stampDutyPaid || 0) + (reg.registrationFee || 0))}`, 20, 178);

    // Instructions Box
    doc.rect(16, 188, 178, 38);
    doc.setFillColor(254, 242, 242);
    doc.rect(16, 188, 178, 7, 'F');
    doc.setTextColor(185, 28, 28);
    doc.text('INSTRUCTIONS & LEGAL DISCLAIMER', 20, 193);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Both parties must carry original Aadhaar cards, PAN cards, and 2 passport-sized photographs.', 20, 201);
    doc.text('2. Please arrive 15 minutes before the allotted appointment time slot at the designated SRO counter.', 20, 207);
    doc.text('3. Demonstration Notice: This appointment token is an illustrative simulation generated by Digital Bhoomi.', 20, 213);
    doc.text('   It does not constitute an authentic e-GRAS challan or statutory deed entry from IGR Maharashtra.', 20, 219);

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Sub-Registrar Authority (Sample Demo)', 20, 245);
    doc.text('Applicant Signature (Seller / Buyer)', 120, 245);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Digital Bhoomi Maharashtra Prototype | Demonstration document only | Hash verification valid', 105, 280, { align: 'center' });

    doc.save(`SRO_Appointment_Token_${reg.tokenNumber}.pdf`);
  };

  const filteredRegistrations = registrations.filter(r => 
    r.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.sroOffice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-emerald-700" />
            Sub-Registrar Office (SRO) Deed Registration (नोंदणी व मुद्रांक विभाग)
          </h2>
          <p className="text-xs text-slate-500">
            Valuation calculator based on Ready Reckoner rates, stamp duty challans, and SRO token appointment scheduling.
          </p>
        </div>

        <button
          onClick={() => setIsWizardOpen(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Book SRO Registration
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SRO Token, buyer, seller, office..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredRegistrations.length} registered deeds
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Token Number</th>
                <th className="py-3 px-4">Parcel / Gat</th>
                <th className="py-3 px-4">Seller & Buyer</th>
                <th className="py-3 px-4">Valuation (Market / Cons.)</th>
                <th className="py-3 px-4">Stamp Duty & Fees</th>
                <th className="py-3 px-4">SRO Office & Appointment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrations.map((reg) => {
                const parcel = parcels.find(p => p.id === reg.parcelId);

                return (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {reg.tokenNumber}
                      {reg.deedNumber && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Deed: {reg.deedNumber}
                        </span>
                      )}
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
                      <div className="text-slate-600 text-[11px]">Seller: {reg.sellerName}</div>
                      <div className="font-bold text-slate-900">Buyer: {reg.buyerName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {formatCurrencyINR(reg.considerationAmount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Reckoner: {formatCurrencyINR(reg.marketValuation)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-800">
                        {formatCurrencyINR(reg.stampDutyPaid)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        + {formatCurrencyINR(reg.registrationFee)} SRO Fee
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{reg.sroOffice}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDateIndian(reg.appointmentDate)} ({reg.appointmentSlot || 'Morning'})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        reg.status === 'REGISTERED' ? 'bg-emerald-100 text-emerald-800' :
                        reg.status === 'FEES_PAID' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {reg.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadSlip(reg)}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors border border-emerald-200 flex items-center gap-1"
                          title="Download SRO Appointment Slip PDF"
                        >
                          <Download className="w-3 h-3" /> Slip
                        </button>
                        <button
                          onClick={() => onNavigate('records', { selectedParcelId: reg.parcelId })}
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Wizard: Book SRO Registration */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Book Sub-Registrar Deed Registration Token
                </h3>
                <p className="text-xs text-slate-500">Step {wizardStep} of 4: {
                  wizardStep === 1 ? 'Party Details' :
                  wizardStep === 2 ? 'Property & Ready Reckoner Valuation' :
                  wizardStep === 3 ? 'Stamp Duty & Registration Fee Challan' :
                  'SRO Appointment Slot Booking'
                }</p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-6 pt-3 bg-white flex items-center justify-between text-xs font-semibold">
              <span className={wizardStep >= 1 ? 'text-emerald-700' : 'text-slate-400'}>1. Parties</span>
              <span className="text-slate-300">→</span>
              <span className={wizardStep >= 2 ? 'text-emerald-700' : 'text-slate-400'}>2. Valuation</span>
              <span className="text-slate-300">→</span>
              <span className={wizardStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}>3. Stamp Duty</span>
              <span className="text-slate-300">→</span>
              <span className={wizardStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}>4. SRO Slot</span>
            </div>

            <form onSubmit={handleCreateRegistration} className="p-6 space-y-4 text-xs">
              
              {/* STEP 1: PARTIES */}
              {wizardStep === 1 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Select Property to Transfer</label>
                    <select
                      value={selectedParcelId}
                      onChange={(e) => setSelectedParcelId(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                    >
                      {parcels.map(p => (
                        <option key={p.id} value={p.id}>
                          Gat {p.gatNumber} ({p.village}, {p.district}) - {p.totalAreaSqm.toLocaleString()} sq.m - {p.ulpin}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Transferor / Seller Name *</label>
                      <input
                        type="text"
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Transferee / Buyer Name *</label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      Next: Valuation <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: VALUATION */}
              {wizardStep === 2 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1">Property Specifications</div>
                    <div className="text-slate-600">
                      Total Area: <strong>{activeParcel?.totalAreaSqm.toLocaleString()} sq. meters</strong> ({activeParcel?.areaHectare} Ha {activeParcel?.areaAre} Are)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Government Ready Reckoner Rate (₹/sq.m)</label>
                      <input
                        type="number"
                        value={readyReckonerRatePerSqm}
                        onChange={(e) => setReadyReckonerRatePerSqm(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Agreed Transaction Consideration (₹) *</label>
                      <input
                        type="number"
                        value={considerationAmount}
                        onChange={(e) => setConsiderationAmount(Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-1">
                    <div>Minimum Government Valuation: <strong>{formatCurrencyINR(calculatedMarketValuation)}</strong></div>
                    <div>Assessable Consideration Value: <strong>{formatCurrencyINR(effectiveValuation)}</strong></div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      Next: Calculate Duties <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: STAMP DUTY */}
              {wizardStep === 3 && (
                <div className="space-y-3.5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-sm">Challan Duty Breakdown (Maharashtra Rates)</div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Assessable Property Valuation:</span>
                      <strong className="font-mono">{formatCurrencyINR(effectiveValuation)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Stamp Duty (5% Base + 1% Local Cess = 6%):</span>
                      <strong className="font-mono text-emerald-800">{formatCurrencyINR(calculatedStampDuty)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Statutory Registration Fee (Capped):</span>
                      <strong className="font-mono">{formatCurrencyINR(registrationFee)}</strong>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-bold text-slate-900 border-t border-slate-300">
                      <span>Total Government Dues Payable:</span>
                      <span className="font-mono text-emerald-800">{formatCurrencyINR(calculatedStampDuty + registrationFee)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                    <span>e-Challan GRAS payment simulation successful. Transaction reference GRAS-MH-2024-9982 authenticated.</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      Next: Choose SRO Slot <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SRO APPOINTMENT */}
              {wizardStep === 4 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Sub-Registrar Office (SRO)</label>
                    <select
                      value={selectedSroOffice}
                      onChange={(e) => setSelectedSroOffice(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                    >
                      <option value="Haveli-1 (Shivajinagar, Pune)">Haveli-1 (Shivajinagar, Pune)</option>
                      <option value="Haveli-2 (Shivajinagar, Pune)">Haveli-2 (Shivajinagar, Pune)</option>
                      <option value="Mulshi (Paud, Pune)">Mulshi (Paud, Pune)</option>
                      <option value="Nagpur-Rural (Civil Lines)">Nagpur-Rural (Civil Lines)</option>
                      <option value="Nashik-Central (Old Agra Road)">Nashik-Central (Old Agra Road)</option>
                      <option value="Aurangabad-Waluj">Aurangabad-Waluj</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Appointment Date</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Time Slot</label>
                      <select
                        value={appointmentSlot}
                        onChange={(e) => setAppointmentSlot(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      >
                        <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                        <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                        <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                        <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs"
                    >
                      Confirm Booking & Generate Token
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
