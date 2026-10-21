import React from 'react';
import { Trash2, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface AutoPurgeNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const AutoPurgeNotificationModal: React.FC<AutoPurgeNotificationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden text-center space-y-4">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <Trash2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Lifecycle Policy Triggered
          </span>
          <h3 className="text-xl font-bold text-white">
            1-Year Account Data Auto-Purged
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All stored files, encryption keys, and cached credentials for{' '}
            <strong className="text-white">{userEmail}</strong> have been permanently and automatically deleted in accordance with your 1-year data self-destruction policy.
          </p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Vault Capacity Reclaimed:</span>
            <span className="font-mono text-emerald-400 font-bold">10.00 GB Available</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Deletion Verification:</span>
            <span className="text-cyan-400 font-medium">Zero Residual Footprint</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
