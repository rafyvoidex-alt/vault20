import React from 'react';
import { Cloud, ShieldCheck, ShieldAlert, LogOut, Award, Zap, HardDrive } from 'lucide-react';

interface NavbarProps {
  userEmail: string;
  clientIp: string;
  isBanned: boolean;
  totalUsageFormatted: string;
  totalSavedFormatted: string;
  savingsPercentage: number;
  onSignOut: () => void;
  onOpenSecurityModal: () => void;
  onOpenCertificate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  clientIp,
  isBanned,
  totalUsageFormatted,
  totalSavedFormatted,
  savingsPercentage,
  onSignOut,
  onOpenSecurityModal,
  onOpenCertificate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Vault10
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                10 GB Lifetime
              </span>
              {savingsPercentage > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{savingsPercentage}% Compressed</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Max-Compressed Zero Expiration Storage
            </p>
          </div>
        </div>

        {/* Status badges & Security Status */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* IP Security Status button */}
          <button
            onClick={onOpenSecurityModal}
            className={`flex items-center space-x-1.5 sm:space-x-2 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors ${
              isBanned
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700/80'
            }`}
            title="Click to view IP security & 1-Account enforcement status"
          >
            {isBanned ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            )}
            <span className="hidden sm:inline font-mono text-[11px]">{clientIp}</span>
            <span className="text-[10px] bg-slate-700/90 text-cyan-300 px-1.5 py-0.5 rounded font-medium">
              1-IP Guard
            </span>
          </button>

          {/* Lifetime Guarantee button */}
          <button
            onClick={onOpenCertificate}
            className="hidden lg:flex items-center space-x-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>10GB Policy</span>
          </button>

          {/* User Account & Sign Out */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-800/60 border border-slate-700/70 rounded-full pl-2 sm:pl-3 pr-1 py-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white uppercase flex-shrink-0">
              {userEmail.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-slate-200 max-w-[90px] sm:max-w-[150px] md:max-w-[180px] truncate">
              {userEmail}
            </span>
            <button
              onClick={onSignOut}
              aria-label="Sign out of account"
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
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
