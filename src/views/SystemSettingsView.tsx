import React, { useState } from 'react';
import { SystemSettings, UserProfile } from '../types';
import { 
  Settings, 
  RotateCcw, 
  Database, 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Plus, 
  Trash2,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { isSupabaseConfigured } from '../lib/supabase';
import { ActiveTab } from '../components/layout/Sidebar';

interface SystemSettingsViewProps {
  currentUser: UserProfile;
  onRefresh: () => void;
  onNavigate: (tab: ActiveTab, params?: any) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  currentUser,
  onRefresh,
  onNavigate,
}) => {
  const [settings, setSettings] = useState<SystemSettings>(dataService.getSettings());
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [newSroOffice, setNewSroOffice] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const isAdmin = currentUser.role === 'ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(`Unauthorized Action: Current role "${currentUser.role}" does not have administrative privileges.`);
      return;
    }
    dataService.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefresh();
  };

  const handleAddSro = () => {
    if (!isAdmin) {
      alert('Only administrators can configure active SRO offices.');
      return;
    }
    if (!newSroOffice.trim()) return;
    const updated = [...settings.sroOfficesActive, newSroOffice.trim()];
    setSettings({ ...settings, sroOfficesActive: updated });
    dataService.updateSettings({ sroOfficesActive: updated });
    setNewSroOffice('');
    onRefresh();
  };

  const handleRemoveSro = (index: number) => {
    if (!isAdmin) {
      alert('Only administrators can remove SRO offices.');
      return;
    }
    const updated = settings.sroOfficesActive.filter((_, i) => i !== index);
    setSettings({ ...settings, sroOfficesActive: updated });
    dataService.updateSettings({ sroOfficesActive: updated });
    onRefresh();
  };

  const handleConfirmReset = () => {
    if (!isAdmin) {
      alert('Only administrators can reset the demonstration database.');
      return;
    }
    dataService.resetDemoData();
    setSettings(dataService.getSettings());
    setIsResetConfirmOpen(false);
    onRefresh();
    alert('System database reset to initial Maharashtra demonstration baseline.');
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            System Configuration & Demonstration Engine (प्रणाली सेटिंग्ज)
          </h2>
          <p className="text-xs text-slate-500">
            Configure system masters, Ready Reckoner rates, SRO active locations, and reset demo data.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-red-200"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Database
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-5">
          
          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                <strong>Administrative Access Restricted:</strong> Current user role is <strong>{currentUser.role}</strong>. Only <strong>ADMIN</strong> users can alter system parameters, adjust Ready Reckoner rates, or reset the database. Switch to Administrator in the top header to enable modifications.
              </span>
            </div>
          )}
          
          {/* General System Parameters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              General Portal Parameters
            </h3>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Portal Display Title
              </label>
              <input
                type="text"
                value={settings.portalName}
                onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Prominent Demo Watermark</div>
                  <div className="text-[11px] text-slate-500">Display "DEMO PROTOTYPE" watermark overlay</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.disclaimerWatermark}
                  onChange={(e) => setSettings({ ...settings, disclaimerWatermark: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Simulate Maintenance Mode</div>
                  <div className="text-[11px] text-slate-500">Show maintenance warning banner</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Default Maharashtra Stamp Duty Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.005"
                  value={settings.defaultStampDutyRate}
                  onChange={(e) => setSettings({ ...settings, defaultStampDutyRate: Number(e.target.value) })}
                  className="w-32 p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
                <span className="text-slate-500">
                  (Currently {(settings.defaultStampDutyRate * 100).toFixed(1)}% = 5% Stamp Duty + 1% Local Body Cess)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {saveSuccess ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
                </span>
              ) : <span />}

              <button
                type="submit"
                disabled={!isAdmin}
                className={`px-5 py-2 font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors ${
                  isAdmin 
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                    : 'bg-emerald-300 text-white cursor-not-allowed opacity-60'
                }`}
              >
                <Save className="w-4 h-4" /> Save System Settings
              </button>
            </div>
          </div>

          {/* Sub-Registrar Offices Master List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              Active Sub-Registrar Offices (SRO) Master Directory
            </h3>
            <p className="text-slate-500">
              Citizens and applicants can book registration appointments at these designated offices.
            </p>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add new SRO office (e.g. Baramati Administrative SRO)..."
                value={newSroOffice}
                onChange={(e) => setNewSroOffice(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSro}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Office
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              {settings.sroOfficesActive.map((office, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{office}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSro(idx)}
                    className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                    title="Remove office"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </form>

        {/* Right Col: Database & Connection Guide */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              Database Engine Status
            </h3>

            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isSupabaseConfigured 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              {isSupabaseConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              ) : (
                <Database className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {isSupabaseConfigured ? 'Supabase Live Connected' : 'Local Persistence Active (Demo Mode)'}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {isSupabaseConfigured
                    ? 'Synchronizing with live PostgreSQL tables and storage buckets.'
                    : 'All 14 modules are running seamlessly with browser local storage persistence.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-[11px] text-slate-600">
              <div className="font-bold text-slate-800">PostgreSQL Migration Script:</div>
              <p>
                The complete SQL migration with Row Level Security (RLS) is ready at:
                <br/>
                <code className="text-emerald-800 font-mono">supabase/migrations/001_initial_schema.sql</code>
              </p>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              To link to a live Supabase project, provide <code className="font-mono text-slate-700">VITE_SUPABASE_URL</code> and <code className="font-mono text-slate-700">VITE_SUPABASE_ANON_KEY</code> in your <code className="font-mono text-slate-700">.env</code> file.
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">Reset Database to Initial Demo State?</h3>
              <p className="text-slate-500 mt-1">
                This will re-initialize all 14 modules with the standard sample Maharashtra records (Pune, Nagpur, Nashik, Sambhaji Nagar, Thane) and clear any custom parcels or mutations created during testing.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
