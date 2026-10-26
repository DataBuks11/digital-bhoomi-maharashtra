import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

interface WatermarkBannerProps {
  onDismiss?: () => void;
}

export const WatermarkBanner: React.FC<WatermarkBannerProps> = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' • ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-shrink-0 z-30 select-none">
      {/* 1. Official National Tricolor Accent Bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      {/* 2. Official Government Advisory & Metadata Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-3 sm:px-5 py-1 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
        
        {/* Left: Government Secretariat Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-amber-400 font-bold tracking-tight">महाराष्ट्र शासन</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-200 hidden sm:inline">Government of Maharashtra</span>
            <span className="text-slate-500 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">महसूल व वन विभाग (Revenue & Forest Department)</span>
          </div>
        </div>

        {/* Center: System Architecture & Node Notice */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[10px]">
          <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 font-medium">
            शासकीय संशोधन प्रणाली (State Demonstration Prototype)
          </span>
          <span className="text-slate-500">•</span>
          <span>Bhu-Abhilekh Central Node: Pune & Nagpur</span>
        </div>

        {/* Right: Security & Live IST Clock */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 ml-auto">
          <div className="hidden sm:flex items-center gap-1 text-emerald-400 font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>NIC State Gateway</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="font-mono text-slate-300 tracking-tight">{timeStr || 'LIVE SECURE'}</span>
        </div>

      </div>
    </div>
  );
};
