import React from 'react';
import { Cloud, ShieldCheck, ShieldAlert, LogOut, Award, Smartphone, Globe, Zap } from 'lucide-react';

interface NavbarProps {
  userEmail: string;
  clientIp: string;
  isBanned: boolean;
  totalUsageFormatted: string;
  totalSavedFormatted: string;
  savingsPercentage: number;
  deviceCount: number;
  onSignOut: () => void;
  onOpenSecurityModal: () => void;
  onOpenCertificate: () => void;
  onOpenDeviceManager: () => void;
  onOpenNetlifyGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  clientIp,
  isBanned,
  totalUsageFormatted,
  totalSavedFormatted,
  savingsPercentage,
  deviceCount,
  onSignOut,
  onOpenSecurityModal,
  onOpenCertificate,
  onOpenDeviceManager,
  onOpenNetlifyGuide,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/20 flex-shrink-0">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Vault10
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                10 GB Lifetime
              </span>
              {savingsPercentage > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-cyan-600" />
                  <span>{savingsPercentage}% Compressed</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Light • Smooth • Zero Data Loss
            </p>
          </div>
        </div>

        {/* Status badges & Security / Device Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Netlify Capacity Guide button */}
          <button
            onClick={onOpenNetlifyGuide}
            className="flex items-center space-x-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 text-teal-800 hover:bg-teal-100 transition-colors shadow-xs"
            title="How many people can save data on Netlify?"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span className="hidden sm:inline font-semibold">Netlify Capacity</span>
            <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold">
              Info
            </span>
          </button>

          {/* Device Manager button */}
          <button
            onClick={onOpenDeviceManager}
            className="flex items-center space-x-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100 transition-colors shadow-xs"
            title="Tracked Devices & Mobile Sync"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="hidden md:inline font-semibold">Devices</span>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
              {deviceCount}
            </span>
          </button>

          {/* IP Security Status button */}
          <button
            onClick={onOpenSecurityModal}
            className={`flex items-center space-x-1.5 text-xs px-2 sm:px-2.5 py-1.5 rounded-xl border transition-colors shadow-xs ${
              isBanned
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Click to view IP security & 1-Account enforcement status"
          >
            {isBanned ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            )}
            <span className="hidden lg:inline font-mono text-[11px] font-medium">{clientIp}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
              1-IP Guard
            </span>
          </button>

          {/* User Account & Sign Out */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100 border border-slate-200 rounded-full pl-2 sm:pl-3 pr-1 py-1 shadow-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white uppercase flex-shrink-0">
              {userEmail.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-800 max-w-[80px] sm:max-w-[130px] md:max-w-[160px] truncate">
              {userEmail}
            </span>
            <button
              onClick={onSignOut}
              aria-label="Sign out of account"
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
