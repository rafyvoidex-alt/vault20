import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, RefreshCw, KeyRound, CheckCircle, ExternalLink } from 'lucide-react';
import { IpBanRecord, SecurityState } from '../utils/security';

interface SecurityBanModalProps {
  banRecord: IpBanRecord | null;
  clientIp: string;
  securityState: SecurityState;
  onUnbanIp: (ip: string) => void;
  onResetAll: () => void;
  onClose?: () => void;
  isOverlayOnly?: boolean;
}

export const SecurityBanModal: React.FC<SecurityBanModalProps> = ({
  banRecord,
  clientIp,
  securityState,
  onUnbanIp,
  onResetAll,
  onClose,
  isOverlayOnly = false,
}) => {
  const [overrideKey, setOverrideKey] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const activeBan = banRecord || securityState.bannedIps[clientIp];

  const handleAdminUnban = () => {
    onUnbanIp(clientIp);
    setOverrideMessage('IP ban successfully revoked. Security access restored.');
    setTimeout(() => {
      setOverrideMessage(null);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-rose-500/60 w-full max-w-lg rounded-3xl shadow-2xl shadow-rose-950/50 p-6 sm:p-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-5 animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="text-center space-y-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full">
            Permanent Security Ban Active
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            1-IP 1-Account Policy Violated
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            You attempted to register or login with a second account from an IP address already bound to a primary user.
          </p>
        </div>

        {/* Incident Box */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Target IP Address:</span>
            <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
              {activeBan ? activeBan.ip : clientIp}
            </span>
          </div>

          {activeBan && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Original Bound Account:</span>
                <span className="text-emerald-400 font-medium truncate max-w-[200px]">
                  {activeBan.originalEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Violating 2nd Account:</span>
                <span className="text-rose-400 font-medium truncate max-w-[200px]">
                  {activeBan.attemptedEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security Incident ID:</span>
                <span className="font-mono text-slate-400">{activeBan.incidentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ban Duration:</span>
                <span className="text-rose-400 font-bold uppercase tracking-wider">
                  Permanent (Lifetime Lockout)
                </span>
              </div>
            </>
          )}
        </div>

        {overrideMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{overrideMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-[11px] text-slate-400">
              Per strict security architecture, this device and IP are blocked from creating or accessing alternate accounts.
            </p>
          </div>

          {/* Admin Override / Testing Unban Button */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleAdminUnban}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Admin Unban (For Testing)</span>
            </button>

            <button
              onClick={onResetAll}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 text-xs text-slate-400 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors"
              title="Reset All Security Database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
