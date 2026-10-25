import React, { useState } from 'react';
import { 
  SurveyRequest, 
  LandParcel, 
  SurveyType, 
  SurveyStatus, 
  UserProfile 
} from '../types';
import { 
  Compass, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  X, 
  Search, 
  Download, 
  UserCheck, 
  MapPin, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatDateIndian } from '../lib/utils';
import jsPDF from 'jspdf';
import { ActiveTab } from '../components/layout/Sidebar';

interface LandSurveyViewProps {
  surveys: SurveyRequest[];
  parcels: LandParcel[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  initialSelectedParcelId?: string;
}

export const LandSurveyView: React.FC<LandSurveyViewProps> = ({
  surveys,
  parcels,
  currentUser,
  onRefresh,
  onNavigate,
  initialSelectedParcelId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRequest | null>(null);

  // Status Update modal state
  const [updatingStatus, setUpdatingStatus] = useState<SurveyStatus>('IN_PROGRESS');
  const [fieldNotes, setFieldNotes] = useState('');
  const [calculatedArea, setCalculatedArea] = useState<number>(0);

  // New Survey Form state
  const [newSurveyData, setNewSurveyData] = useState({
    parcelId: initialSelectedParcelId || parcels[0]?.id || '',
    applicantName: currentUser.role === 'CITIZEN' ? currentUser.fullName : '',
    applicantContact: '+91 98220 11223',
    surveyType: 'REGULAR_MEASUREMENT' as SurveyType,
    scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    fieldNotes: 'Applicant requested boundary measurement and stone demarcation.',
  });

  const filteredSurveys = surveys.filter(s => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch = 
      s.surveyNumberRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.surveyorName && s.surveyorName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyData.applicantName || !newSurveyData.parcelId) {
      alert('Please fill all required fields');
      return;
    }

    dataService.createSurvey({
      parcelId: newSurveyData.parcelId,
      applicantName: newSurveyData.applicantName,
      applicantContact: newSurveyData.applicantContact,
      surveyType: newSurveyData.surveyType,
      scheduledDate: newSurveyData.scheduledDate,
      status: 'REQUESTED',
      fieldNotes: newSurveyData.fieldNotes,
      disputeFlag: false,
    });

    onRefresh();
    setIsNewModalOpen(false);
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurvey) return;

    dataService.updateSurveyStatus(
      selectedSurvey.id,
      updatingStatus,
      fieldNotes,
      calculatedArea > 0 ? calculatedArea : undefined
    );

    onRefresh();
    setSelectedSurvey(null);
  };

  // Generate Official Cadastral Survey Report PDF
  const handleDownloadSurveyReportPDF = (survey: SurveyRequest) => {
    const parcel = parcels.find(p => p.id === survey.parcelId);
    const doc = new jsPDF();

    // Gov Header & Watermark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text('GOVERNMENT OF MAHARASHTRA', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('DIRECTORATE OF LAND RECORDS & CADASTRAL SURVEY (DDLR PUNE)', 105, 25, { align: 'center' });
    doc.text('OFFICIAL CADASTRAL SURVEY DEMARCATION CERTIFICATE (MOJANI PATRAK)', 105, 31, { align: 'center' });

    // Watermark
    doc.setFontSize(36);
    doc.setTextColor(220, 38, 38);
    doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
    doc.text('PROTOTYPE DEMO - NOT LEGAL RECORD', 105, 140, { align: 'center', angle: 45 });
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Metadata Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 38, 180, 24, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Survey Reference: ${survey.surveyNumberRef}`, 20, 46);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, 130, 46);
    doc.text(`Applicant Name: ${survey.applicantName}`, 20, 54);
    doc.text(`Survey Type: ${survey.surveyType.replace(/_/g, ' ')}`, 130, 54);

    // Parcel Cadastral Table
    doc.rect(15, 68, 180, 52);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 68, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CADASTRAL PARCEL SPECIFICATIONS', 20, 74);

    doc.setFont('helvetica', 'normal');
    doc.text(`District: ${parcel?.district || 'Pune'}`, 20, 84);
    doc.text(`Taluka: ${parcel?.taluka || 'Haveli'}`, 80, 84);
    doc.text(`Village: ${parcel?.village || 'Wagholi'}`, 140, 84);

    doc.text(`Gat Number: ${parcel?.gatNumber || 'N/A'}`, 20, 94);
    doc.text(`Survey Number: ${parcel?.surveyNumber || 'N/A'}`, 80, 94);
    doc.text(`Bhu-Aadhaar (ULPIN): ${parcel?.ulpin || 'N/A'}`, 140, 94);

    doc.text(`Recorded Record Area: ${parcel?.areaHectare} Ha ${parcel?.areaAre} Are`, 20, 104);
    doc.text(`Field Total Station Area: ${survey.calculatedAreaSqm ? `${survey.calculatedAreaSqm.toLocaleString()} sq.m` : 'In Progress'}`, 100, 104);

    doc.text(`Survey Status: ${survey.status}`, 20, 114);
    doc.text(`Assigned Surveyor: ${survey.surveyorName || 'Officer Saza'}`, 100, 114);

    // Surveyor Findings & Notes
    doc.rect(15, 126, 180, 40);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 126, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL FIELD NOTES & BOUNDARY STONES REPORT', 20, 132);

    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(survey.fieldNotes || 'Boundary stones checked and verified against village tipan sheet without encroachment.', 170);
    doc.text(splitNotes, 20, 142);

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.text('Sample Field Surveyor (Demonstration Only)', 20, 200);
    doc.text('Prototype Review Authority (Not an Official Survey)', 110, 200);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PROTOTYPE DEMONSTRATION RECORD - NOT AN OFFICIAL STATUTORY DEMARCATION', 105, 276, { align: 'center' });
    doc.text('Generated by Digital Bhoomi Maharashtra prototype. Official demarcation requires statutory SC&DLR survey.', 105, 281, { align: 'center' });

    doc.save(`Cadastral_Survey_Report_${survey.surveyNumberRef}.pdf`);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700" />
            Land Survey Management (जमीन मोजणी व सीमांकन)
          </h2>
          <p className="text-xs text-slate-500">
            Cadastral Mojani bookings, Total Station GPS demarcation, surveyor assignment, and boundary report generation.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Book Mojani Survey
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by survey ref, applicant, surveyor..."
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
            <option value="REQUESTED">Requested</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FIELD_COMPLETED">Field Completed</option>
            <option value="APPROVED">Approved</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-end font-medium">
          Showing {filteredSurveys.length} survey applications
        </div>
      </div>

      {/* Surveys Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Survey Ref</th>
                <th className="py-3 px-4">Parcel / Gat</th>
                <th className="py-3 px-4">Applicant & Contact</th>
                <th className="py-3 px-4">Survey Type</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Assigned Surveyor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No survey records found.
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => {
                  const parcel = parcels.find(p => p.id === survey.parcelId);

                  return (
                    <tr key={survey.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {survey.surveyNumberRef}
                        {survey.disputeFlag && (
                          <span className="block text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Boundary Dispute
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
                        <span className="font-medium text-slate-900">{survey.applicantName}</span>
                        <span className="block text-[11px] text-slate-500 font-mono">{survey.applicantContact}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {survey.surveyType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {formatDateIndian(survey.scheduledDate)}
                      </td>

                      <td className="py-3 px-4">
                        {survey.surveyorName ? (
                          <span className="text-slate-800 font-medium">{survey.surveyorName}</span>
                        ) : (
                          <span className="text-amber-700 text-[11px] font-semibold">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          survey.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          survey.status === 'FIELD_COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          survey.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {survey.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSurvey(survey);
                              setUpdatingStatus(survey.status);
                              setFieldNotes(survey.fieldNotes || '');
                              setCalculatedArea(survey.calculatedAreaSqm || 0);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300"
                            title="Update survey status & notes"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDownloadSurveyReportPDF(survey)}
                            className="p-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="Download official PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
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

      {/* Modal: New Survey Request */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Book Mojani Cadastral Survey</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Land Parcel</label>
                <select
                  value={newSurveyData.parcelId}
                  onChange={(e) => setNewSurveyData({ ...newSurveyData, parcelId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                  required
                >
                  {parcels.map(p => (
                    <option key={p.id} value={p.id}>
                      Gat No. {p.gatNumber} ({p.village}, {p.taluka}, {p.district}) - {p.ulpin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    value={newSurveyData.applicantName}
                    onChange={(e) => setNewSurveyData({ ...newSurveyData, applicantName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="Full legal name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newSurveyData.applicantContact}
                    onChange={(e) => setNewSurveyData({ ...newSurveyData, applicantContact: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Survey Type</label>
                  <select
                    value={newSurveyData.surveyType}
                    onChange={(e) => setNewSurveyData({ ...newSurveyData, surveyType: e.target.value as SurveyType })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="REGULAR_MEASUREMENT">Regular Mojani (साधी मोजणी)</option>
                    <option value="URGENT_TATKAL">Urgent Tatkal (तातडीची मोजणी)</option>
                    <option value="SUB_DIVISION_PARTITION">Sub-division / Partition (हिस्सा मोजणी)</option>
                    <option value="BOUNDARY_DEMARCATION">Boundary Demarcation (हद्द कायम)</option>
                    <option value="COURT_COMMISSION">Court Commission (न्यायालयीन आयोग)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={newSurveyData.scheduledDate}
                    onChange={(e) => setNewSurveyData({ ...newSurveyData, scheduledDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Application Remarks / Reason</label>
                <textarea
                  rows={2}
                  value={newSurveyData.fieldNotes}
                  onChange={(e) => setNewSurveyData({ ...newSurveyData, fieldNotes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Schedule Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Survey Status & Surveyor Notes */}
      {selectedSurvey && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Update Survey: {selectedSurvey.surveyNumberRef}
                </h3>
                <p className="text-xs text-slate-500">Cadastral Surveyor Field Action</p>
              </div>
              <button
                onClick={() => setSelectedSurvey(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Workflow Status</label>
                <select
                  value={updatingStatus}
                  onChange={(e) => setUpdatingStatus(e.target.value as SurveyStatus)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold bg-slate-50 text-slate-900"
                >
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="ASSIGNED">ASSIGNED (Surveyor Allocated)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Field Work Underway)</option>
                  <option value="FIELD_COMPLETED">FIELD COMPLETED (Measurements Done)</option>
                  <option value="APPROVED">APPROVED (Tehsildar / DDLR Sign-off)</option>
                  <option value="REVISION_REQUIRED">REVISION REQUIRED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Calculated Total Station Area (sq. meters)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calculatedArea}
                  onChange={(e) => setCalculatedArea(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  placeholder="e.g. 11985.50"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Surveyor Field Notes & Demarcation Log</label>
                <textarea
                  rows={4}
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Notes regarding corner boundary stones, adjoining land owner notices, Total Station reading conformity..."
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleDownloadSurveyReportPDF(selectedSurvey)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download Report
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSurvey(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Save Status Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
