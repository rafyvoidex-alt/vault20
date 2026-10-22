import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, KeyRound, CheckCircle } from 'lucide-react';
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
}) => {
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const activeBan = banRecord || securityState?.bannedIps?.[clientIp];

  const handleAdminUnban = () => {
    onUnbanIp(clientIp);
    setOverrideMessage('IP ban successfully revoked. Security access restored.');
    setTimeout(() => {
      setOverrideMessage(null);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border-2 border-rose-200 w-full max-w-lg rounded-3xl shadow-2xl shadow-rose-900/10 p-6 sm:p-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-100 rounded-full blur-2xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="text-center space-y-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/70 border border-rose-200 px-3 py-1 rounded-full">
            Permanent Security Ban Active
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            1-IP 1-Account Policy Violated
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A second, different account attempted to register or login from an IP address already bound to a primary user.
          </p>
        </div>

        {/* Incident Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Target IP Address:</span>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {activeBan ? activeBan.ip : clientIp}
            </span>
          </div>

          {activeBan && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Original Bound Account:</span>
                <span className="text-emerald-700 font-semibold truncate max-w-[200px]">
                  {activeBan.originalEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Violating 2nd Account:</span>
                <span className="text-rose-600 font-semibold truncate max-w-[200px]">
                  {activeBan.attemptedEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Security Incident ID:</span>
                <span className="font-mono text-slate-500">{activeBan.incidentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ban Duration:</span>
                <span className="text-rose-600 font-bold uppercase tracking-wider">
                  Permanent (Lifetime Lockout)
                </span>
              </div>
            </>
          )}
        </div>

        {overrideMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{overrideMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-[11px] text-slate-500">
              Note: You can use your original Gmail on multiple devices. Only registering a second different account from the same IP is blocked.
            </p>
          </div>

          {/* Admin Override / Testing Unban Button */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleAdminUnban}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Admin Unban (For Testing)</span>
            </button>

            <button
              onClick={onResetAll}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 flex items-center justify-center gap-1.5 transition-colors"
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
