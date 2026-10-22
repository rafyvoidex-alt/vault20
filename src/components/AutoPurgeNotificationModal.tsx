import React from 'react';
import { Trash2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border-2 border-amber-200 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden text-center space-y-4">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-100 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <Trash2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Lifecycle Policy Triggered
          </span>
          <h3 className="text-xl font-bold text-slate-900">
            1-Year Account Data Auto-Purged
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All stored files, encryption keys, and cached data for{' '}
            <strong className="text-slate-800">{userEmail}</strong> have been permanently and safely deleted in accordance with your 1-year auto-delete policy.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Vault Capacity Reclaimed:</span>
            <span className="font-mono text-emerald-700 font-bold">10.00 GB Available</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Deletion Verification:</span>
            <span className="text-sky-700 font-semibold">Zero Residual Footprint</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
