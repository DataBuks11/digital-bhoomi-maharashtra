import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface WatermarkBannerProps {
  onDismiss?: () => void;
}

export const WatermarkBanner: React.FC<WatermarkBannerProps> = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-600 animate-pulse"></span>
        <span className="font-semibold uppercase tracking-wider text-amber-800">Demo Prototype:</span>
        <span>Digital Bhoomi Maharashtra is an interactive conceptual system prototype. Not an official government portal.</span>
      </div>
      <div className="flex items-center gap-4 text-amber-800/80">
        <span className="hidden md:inline-flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Fictional Cadastral Records & Simulated SRO Workflows
        </span>
        <span className="bg-amber-200/60 px-2 py-0.5 rounded font-mono text-[11px] font-semibold text-amber-900 border border-amber-300">
          v1.0.0-DEMO
        </span>
      </div>
    </div>
  );
};
