import React from 'react';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, Activity, Database, Lock } from 'lucide-react';
import { SecurityState } from '../utils/security';

interface SecurityStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientIp: string;
  securityState: SecurityState;
  currentEmail: string;
  onSimulateViolation: () => void;
}

export const SecurityStatusModal: React.FC<SecurityStatusModalProps> = ({
  isOpen,
  onClose,
  clientIp,
  securityState,
  currentEmail,
  onSimulateViolation,
}) => {
  if (!isOpen) return null;

  const currentBinding = securityState.ipBindings[clientIp];
  const isBanned = !!securityState.bannedIps[clientIp];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close security status dialog"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              1-IP 1-Account Security Console
            </h3>
            <p className="text-xs text-slate-400">
              Active hardware & network anti-multi-account enforcement
            </p>
          </div>
        </div>

        {/* IP Guard Status Banner */}
        <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Your Current IP:</span>
            <span className="font-mono font-bold text-sm text-cyan-400">{clientIp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Bound Primary Account:</span>
            <span className="font-medium text-xs text-emerald-400">
              {currentBinding ? currentBinding.email : currentEmail || 'Not bound yet'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Enforcement Status:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> ACTIVE & ENFORCING
            </span>
          </div>
        </div>

        {/* Quick Test Trigger */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-300">
                Test Security Mechanism
              </p>
              <p className="text-[11px] text-slate-300">
                Want to test the automatic permanent ban? Click below to simulate an unauthorized 2nd account attempt from this IP.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSimulateViolation();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Simulate 2nd Account Violation Now
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] pr-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Security Audit Log
          </span>
          {securityState.securityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No events recorded yet.</p>
          ) : (
            securityState.securityLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono text-cyan-400">{log.type}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 text-[11px]">{log.description}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
