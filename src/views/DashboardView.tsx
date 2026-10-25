import React from 'react';
import { 
  LandParcel, 
  SurveyRequest, 
  MutationApplication, 
  PropertyRegistration, 
  UserProfile 
} from '../types';
import { 
  FileText, 
  MapPin, 
  Compass, 
  CheckSquare, 
  QrCode, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrencyINR } from '../lib/utils';
import { ActiveTab } from '../components/layout/Sidebar';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardViewProps {
  parcels: LandParcel[];
  surveys: SurveyRequest[];
  mutations: MutationApplication[];
  registrations: PropertyRegistration[];
  currentUser: UserProfile;
  onNavigate: (tab: ActiveTab, params?: any) => void;
  onQuickAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  parcels,
  surveys,
  mutations,
  registrations,
  currentUser,
  onNavigate,
  onQuickAction,
}) => {
  // Aggregate Metrics
  const totalParcels = parcels.length;
  const verifiedParcels = parcels.filter(p => p.status === 'VERIFIED').length;
  const pendingSurveys = surveys.filter(s => s.status !== 'APPROVED' && s.status !== 'REJECTED').length;
  const pendingMutations = mutations.filter(m => m.status === 'PENDING_TALATHI_REVIEW' || m.status === 'NOTICE_PERIOD').length;
  
  const totalAreaHectares = parcels.reduce((sum, p) => sum + p.areaHectare + (p.areaAre / 100), 0);
  const totalRevenue = registrations.reduce((sum, r) => sum + r.stampDutyPaid + r.registrationFee, 0);

  // Chart data: Land types
  const landTypeCounts: Record<string, number> = {};
  parcels.forEach(p => {
    const key = p.landType.replace(/_/g, ' ');
    landTypeCounts[key] = (landTypeCounts[key] || 0) + 1;
  });
  const landTypeData = Object.entries(landTypeCounts).map(([name, value]) => ({ name, value }));

  // Chart data: District distribution
  const districtCounts: Record<string, number> = {};
  parcels.forEach(p => {
    districtCounts[p.district] = (districtCounts[p.district] || 0) + 1;
  });
  const districtData = Object.entries(districtCounts).map(([name, count]) => ({ name, count }));

  const COLORS = ['#15803d', '#0284c7', '#d97706', '#9333ea', '#e11d48', '#64748b'];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Role Context Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-xl p-5 md:p-6 shadow-sm border border-emerald-950 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-600/40">
                {currentUser.role.replace('_', ' ')} WORKSPACE
              </span>
              <span className="text-xs text-emerald-300">| Revenue Division Pune & Maharashtra State</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Namaskar, {currentUser.fullName}
            </h2>
            <p className="text-xs md:text-sm text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
              Bhu-Abhilekh Central Dashboard provides real-time cadastral survey tracking, 7/12 extract lifecycle, QR-based authenticity verification, and land mutation governance.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('records')}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-4 h-4" /> 7/12 Records
            </button>
            <button
              onClick={() => onNavigate('qr')}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-all border border-white/20"
            >
              <QrCode className="w-4 h-4" /> Scan QR
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-all border border-white/20"
            >
              <MapPin className="w-4 h-4" /> Land Map
            </button>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-600/20 blur-2xl pointer-events-none"></div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div 
          onClick={() => onNavigate('records')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Parcels</span>
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalParcels}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {verifiedParcels} Verified 7/12
          </div>
        </div>

        <div 
          onClick={() => onNavigate('surveys')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Surveys</span>
            <Compass className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingSurveys}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Mojani in progress
          </div>
        </div>

        <div 
          onClick={() => onNavigate('verification')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Ferfar Queue</span>
            <CheckSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingMutations}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>Pending Talathi Sign</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('map')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cadastral Area</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalAreaHectares.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Hectares mapped
          </div>
        </div>

        <div 
          onClick={() => onNavigate('registration')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Stamp Duty</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            {formatCurrencyINR(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Demo SRO collection
          </div>
        </div>

        <div 
          onClick={() => onNavigate('cards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 cursor-pointer transition-all hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Property Cards</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalParcels}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <span>Malmatta Patrak ready</span>
          </div>
        </div>

      </div>

      {/* Operational Highlights & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">District-wise Parcel Count</h3>
              <p className="text-xs text-slate-500">Distribution across major Maharashtra nodes</p>
            </div>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip 
                  formatter={(value: any) => [`${value} parcels`, 'Count']} 
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Land Classification Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Land Use & Classification</h3>
              <p className="text-xs text-slate-500">Bagayat, Jirayat, NA Commercial & Industrial</p>
            </div>
            <button 
              onClick={() => onNavigate('records')}
              className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
            >
              Filter <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={landTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {landTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} parcels`, 'Parcels']} 
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgent Action Attention Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Action Items</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                {pendingMutations + pendingSurveys} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Prioritized requests requiring surveyor field measurement or Talathi sign-off.
            </p>

            <div className="space-y-3">
              {mutations.slice(0, 2).map(m => (
                <div 
                  key={m.id}
                  onClick={() => onNavigate('verification')}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{m.mutationNumber}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 truncate">
                    Applicant: {m.applicantName} ({m.mutationType.replace(/_/g, ' ')})
                  </div>
                </div>
              ))}

              {surveys.slice(0, 1).map(s => (
                <div 
                  key={s.id}
                  onClick={() => onNavigate('surveys')}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{s.surveyNumberRef}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 truncate">
                    Applicant: {s.applicantName} ({s.surveyType.replace(/_/g, ' ')})
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('verification')}
            className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Open Officer Verification Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Quick Land Parcel Directory Preview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Recent 7/12 Land Parcel Records</h3>
            <p className="text-xs text-slate-500">Live cadastral abstracts with Bhu-Aadhaar ULPIN reference</p>
          </div>
          <button
            onClick={() => onNavigate('records')}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            View all {totalParcels} records <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Gat / Survey</th>
                <th className="py-2.5 px-3 font-semibold">ULPIN (Bhu-Aadhaar)</th>
                <th className="py-2.5 px-3 font-semibold">Village & Taluka</th>
                <th className="py-2.5 px-3 font-semibold">Area</th>
                <th className="py-2.5 px-3 font-semibold">Classification</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parcels.slice(0, 4).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    Gat No. {p.gatNumber}
                    <span className="block text-[11px] text-slate-500 font-normal">Survey {p.surveyNumber}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-emerald-800">
                    {p.ulpin}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {p.village}, {p.taluka}
                    <span className="block text-[11px] text-slate-500">{p.district}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">
                    {p.areaHectare}H {p.areaAre}R
                    <span className="block text-[11px] text-slate-500">({p.totalAreaSqm.toLocaleString()} m²)</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {p.landType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'IN_DISPUTE' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onNavigate('records', { selectedParcelId: p.id })}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      Inspect 7/12
                    </button>
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
