import React from 'react';
import { X, ShieldCheck, AlertTriangle, Activity, Lock } from 'lucide-react';
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

  const currentBinding = securityState?.ipBindings?.[clientIp];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close security status dialog"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5 pr-8">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              1-IP 1-Account Security Console
            </h3>
            <p className="text-xs text-slate-500">
              Anti-abuse protection and multi-device binding verification
            </p>
          </div>
        </div>

        {/* IP Guard Status Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Your Current Device IP:</span>
            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{clientIp}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Bound Primary Account:</span>
            <span className="font-semibold text-emerald-700">
              {currentBinding ? currentBinding.email : currentEmail || 'Not bound yet'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Enforcement Policy:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE & ENFORCING
            </span>
          </div>
        </div>

        {/* Quick Test Trigger */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl mb-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-900">
                Test 1-IP 1-Account Security Ban
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Click below to simulate another person trying to log into a different Google account on this same IP. The system will trigger an immediate permanent ban.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSimulateViolation();
                }}
                className="mt-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Simulate 2nd Account Violation Now
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] pr-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-sky-600" /> Security Audit Log
          </span>
          {(!securityState?.securityLogs || securityState.securityLogs.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No events recorded yet.</p>
          ) : (
            securityState.securityLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono text-sky-700 font-semibold">{log.type}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-700 text-[11px]">{log.description}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
