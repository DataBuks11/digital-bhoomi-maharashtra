import React, { useState, useMemo } from 'react';
import { 
  LandParcel, 
  SurveyRequest, 
  PropertyRegistration, 
  MutationApplication, 
  UserProfile 
} from '../types';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Layers, 
  Compass, 
  Calendar,
  Filter
} from 'lucide-react';
import { formatCurrencyINR } from '../lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import { ActiveTab } from '../components/layout/Sidebar';

interface ReportsAnalyticsViewProps {
  parcels: LandParcel[];
  surveys: SurveyRequest[];
  registrations: PropertyRegistration[];
  mutations: MutationApplication[];
  currentUser: UserProfile;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  parcels,
  surveys,
  registrations,
  mutations,
  currentUser,
  onNavigate,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Filter parcels by district if selected
  const filteredParcels = selectedDistrict === 'ALL'
    ? parcels
    : parcels.filter(p => p.district.toLowerCase() === selectedDistrict.toLowerCase());

  // Land type distribution
  const landTypeMap: Record<string, number> = {};
  filteredParcels.forEach(p => {
    const key = p.landType.replace(/_/g, ' ');
    landTypeMap[key] = (landTypeMap[key] || 0) + 1;
  });
  const landTypeData = Object.entries(landTypeMap).map(([name, value]) => ({ name, value }));

  // Monthly Registration Trend Data dynamically aggregated from registrations
  const monthlyRevenueData = useMemo(() => {
    const monthMap: Record<string, { revenue: number; registrations: number }> = {
      'Jan 2024': { revenue: 4200000, registrations: 12 },
      'Feb 2024': { revenue: 5800000, registrations: 18 },
      'Mar 2024': { revenue: 8400000, registrations: 26 },
      'Apr 2024': { revenue: 9100000, registrations: 29 },
      'May 2024': { revenue: 7600000, registrations: 22 },
      'Jun 2024': { revenue: 11200000, registrations: 34 },
    };

    // Aggregate any newly registered deeds in active sessions
    registrations.forEach(r => {
      const d = new Date(r.createdAt);
      const mKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[mKey]) {
        monthMap[mKey] = { revenue: 0, registrations: 0 };
      }
      monthMap[mKey].revenue += (r.stampDutyPaid || 0) + (r.registrationFee || 0);
      monthMap[mKey].registrations += 1;
    });

    return Object.entries(monthMap).map(([month, val]) => ({
      month,
      revenue: val.revenue,
      registrations: val.registrations,
    }));
  }, [registrations]);

  // Survey status distribution
  const surveyStatusMap: Record<string, number> = {};
  surveys.forEach(s => {
    surveyStatusMap[s.status] = (surveyStatusMap[s.status] || 0) + 1;
  });
  const surveyStatusData = Object.entries(surveyStatusMap).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
  }));

  const COLORS = ['#15803d', '#0284c7', '#d97706', '#9333ea', '#e11d48', '#64748b'];

  // Export Filtered Land Records CSV
  const handleExportCSV = () => {
    const headers = [
      'ULPIN',
      'District',
      'Taluka',
      'Village',
      'Gat_Number',
      'Survey_Number',
      'Sub_Division',
      'Total_Area_Sqm',
      'Area_Hectares',
      'Area_Are',
      'Land_Type',
      'Tenure_Type',
      'Assessment_Tax_INR',
      'Status'
    ];

    const rows = filteredParcels.map(p => [
      p.ulpin,
      p.district,
      p.taluka,
      p.village,
      p.gatNumber,
      p.surveyNumber,
      p.subDivision,
      p.totalAreaSqm,
      p.areaHectare,
      p.areaAre,
      p.landType,
      p.tenureType,
      p.assessmentTax,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maharashtra_Land_Records_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Executive Cadastral Summary PDF
  const handleExportSummaryPDF = () => {
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(21, 128, 61);
    doc.text('GOVERNMENT OF MAHARASHTRA', 105, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('REVENUE & CADASTRAL LAND RECORDS DIRECTORATE', 105, 27, { align: 'center' });
    doc.text('STATE CADASTRAL LAND AUDIT & REVENUE REPORT', 105, 33, { align: 'center' });

    // Watermark
    doc.setFontSize(30);
    doc.setTextColor(220, 38, 38);
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.text('DEMONSTRATION AUDIT REPORT', 105, 140, { align: 'center', angle: 45 });
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 15, 45);
    doc.text(`Total Mapped Parcels: ${parcels.length}`, 15, 52);
    doc.text(`Active Mojani Surveys: ${surveys.length}`, 15, 59);
    doc.text(`Registered SRO Deeds: ${registrations.length}`, 15, 66);

    // Summary Table
    doc.rect(15, 75, 180, 80);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 75, 180, 8, 'F');
    doc.text('DISTRICT-WISE CADASTRAL LAND DISTRIBUTION', 20, 81);

    let y = 92;
    ['Pune', 'Nagpur', 'Nashik', 'Chhatrapati Sambhaji Nagar', 'Thane'].forEach((dist) => {
      const count = parcels.filter(p => p.district === dist).length;
      doc.setFont('helvetica', 'bold');
      doc.text(dist, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${count} Land Parcels Enrolled`, 120, y);
      y += 10;
    });

    doc.save(`State_Land_Cadastre_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            Reports & Cadastral Analytics (अहवाल व विश्लेषण)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time data visualization of revenue collections, cadastral survey turnaround times, and CSV report export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Filtered CSV
          </button>
          <button
            onClick={handleExportSummaryPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" /> State Audit PDF
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Filter Analysis by District:
        </span>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium max-w-xs"
        >
          <option value="ALL">All Maharashtra Districts</option>
          <option value="Pune">Pune District</option>
          <option value="Nagpur">Nagpur District</option>
          <option value="Nashik">Nashik District</option>
          <option value="Chhatrapati Sambhaji Nagar">Chhatrapati Sambhaji Nagar</option>
          <option value="Thane">Thane District</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue & Deed Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Monthly SRO Stamp Duty Collection Trend</h3>
              <p className="text-xs text-slate-500">Gross revenue collected (INR ₹)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatCurrencyINR(val), 'Revenue']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Land Classification Donut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Land Use & Classification Ratio</h3>
              <p className="text-xs text-slate-500">Breakdown of surveyed plots in selected scope</p>
            </div>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={landTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {landTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${val} parcels`, 'Count']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Survey Operational Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Mojani Cadastral Survey Lifecycle Funnel</h3>
              <p className="text-xs text-slate-500">Distribution of field requests from intake to approval</p>
            </div>
            <Compass className="w-4 h-4 text-amber-600" />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={surveyStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
