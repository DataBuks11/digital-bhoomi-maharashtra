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
      
      {/* Welcome & State Revenue Command Center Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white rounded-xl p-5 md:p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-emerald-800 text-amber-300 border border-emerald-600/50">
                महाराष्ट्र शासन • महसूल विभाग
              </span>
              <span className="text-xs text-slate-300 font-medium">
                राज्य भू-अभिलेख व जमाबंदी नियंत्रण कक्ष | Pune & Nagpur State Node
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>सस्नेह नमस्कार,</span>
              <span className="text-amber-300 font-serif">{currentUser.fullName}</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              डिजिटल भूमी महाराष्ट्र पोर्टल अंतर्गत पुणे व नागपूर विभागातील सातबारा, भू-नकाशा (३D ड्रोन सर्वेक्षण), ई-फेरफार मंजुरी, भू-आधार ULPIN आणि मालमत्ता पत्रक व्यवस्थापन प्रणाली.
            </p>
          </div>

          {/* Quick Action Statutory Desks */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('records')}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all border border-emerald-500"
            >
              <FileText className="w-4 h-4" /> गाव नमुना ७/१२ (7/12)
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <MapPin className="w-4 h-4 text-cyan-400" /> भू-नकाशा व ३D
            </button>
            <button
              onClick={() => onNavigate('verification')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <CheckSquare className="w-4 h-4 text-amber-400" /> फेरफार कक्ष
            </button>
          </div>
        </div>

        {/* Subtle decorative background watermarks */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div 
          onClick={() => onNavigate('records')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">एकूण भूखंड (Parcels)</span>
            <FileText className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalParcels}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {verifiedParcels} प्रमाणित सातबारा
          </div>
        </div>

        <div 
          onClick={() => onNavigate('surveys')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">जमीन मोजणी (Surveys)</span>
            <Compass className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingSurveys}</div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> मोजणी चालू (Active)
          </div>
        </div>

        <div 
          onClick={() => onNavigate('verification')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">फेरफार नोंद (Mutations)</span>
            <CheckSquare className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingMutations}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <span>तलाठी स्वाक्षरी प्रलंबित</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('map')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">मोजणी क्षेत्र (Cadastre)</span>
            <Layers className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalAreaHectares.toFixed(2)}</div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">
            हेक्टर क्षेत्र नकाशावर
          </div>
        </div>

        <div 
          onClick={() => onNavigate('registration')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">मुद्रांक महसूल (GRAS)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 truncate">
            {formatCurrencyINR(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            SRO नोंदणी संकलन
          </div>
        </div>

        <div 
          onClick={() => onNavigate('cards')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all hover:shadow-sm group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">मिळकत पत्रक (Cards)</span>
            <CreditCard className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalParcels}</div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-1 flex items-center gap-1">
            <span>डिजिटल स्वाक्षरीत तयार</span>
          </div>
        </div>

      </div>

      {/* Operational Highlights & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* District Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>जिल्हानिहाय भूखंड सांख्यिकी</span>
                <span className="text-slate-400 font-normal text-xs">(District Cadastre)</span>
              </h3>
              <p className="text-xs text-slate-500">Distribution across major Maharashtra nodes</p>
            </div>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
            >
              तपशील (Details) <ArrowRight className="w-3 h-3" />
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
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>जमीन वापर व वर्गवारी</span>
                <span className="text-slate-400 font-normal text-xs">(Land Classification)</span>
              </h3>
              <p className="text-xs text-slate-500">बागायत, जिरायत, अकृषक वाणिज्यिक व औद्योगिक</p>
            </div>
            <button 
              onClick={() => onNavigate('records')}
              className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-0.5"
            >
              फिल्टर <ArrowRight className="w-3 h-3" />
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
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>महसूल कृती डेस्क</span>
                <span className="text-slate-400 font-normal text-xs">(Officer Action Desk)</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                {pendingMutations + pendingSurveys} प्रलंबित (Pending)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              तलाठी व मंडळ अधिकारी यांच्या स्वाक्षरीसाठी प्रलंबित फेरफार आणि भूमापक मोजणी प्रकरणे.
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
                    अर्जदार: {m.applicantName} ({m.mutationType.replace(/_/g, ' ')})
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
                    मोजणी अर्ज: {s.applicantName} ({s.surveyType.replace(/_/g, ' ')})
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('verification')}
            className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            फेरफार मंजुरी डेस्क उघडा (Open Verification Desk) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Quick Land Parcel Directory Preview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>गाव नमुना ७/१२ नोंदवही (थेट सारांश)</span>
              <span className="text-slate-400 font-normal text-xs">(Live 7/12 Cadastral Directory)</span>
            </h3>
            <p className="text-xs text-slate-500">भू-आधार ULPIN क्रमांकासह प्रमाणित व अद्ययावत भूखंड सूची</p>
          </div>
          <button
            onClick={() => onNavigate('records')}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            सर्व {totalParcels} भूखंड पहा (View All) <ArrowRight className="w-3.5 h-3.5" />
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
