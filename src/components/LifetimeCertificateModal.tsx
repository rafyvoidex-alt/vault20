import React from 'react';
import { X, Award, CheckCircle2, Shield, Calendar, Infinity as InfinityIcon, Zap } from 'lucide-react';

interface LifetimeCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  clientIp: string;
}

export const LifetimeCertificateModal: React.FC<LifetimeCertificateModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  clientIp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-white">
        {/* Top Gold Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500" />

        <button
          onClick={onClose}
          aria-label="Close certificate dialog"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
            <Award className="w-9 h-9" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Official Storage Policy Guarantee
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Lifetime Cloud Vault Covenant
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Issued to <strong className="text-slate-200 font-medium">{userEmail}</strong>
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">10 GB Dedicated Lifetime Quota</h5>
              <p className="text-slate-400 text-[11px]">
                Full 10,240 MB dedicated capacity with zero recurring subscription fees and no hidden trial end periods.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Maximum Lossless Compression Standard</h5>
              <p className="text-slate-400 text-[11px]">
                Files are compressed in web storage to save space, but decompressed upon download to return the 100% exact, bit-perfect original file.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Zero Hidden Deletion Policy</h5>
              <p className="text-slate-400 text-[11px]">
                Your stored files will never be automatically purged, archived into cold storage, or deleted due to account inactivity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Hardware & 1-IP Security Shield</h5>
              <p className="text-slate-400 text-[11px]">
                Strict 1-IP 1-Account enforcement prevents fraud, preserving your dedicated 10GB cloud allocation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span className="block text-[10px] text-slate-500">DIGITAL SIGNATURE</span>
            <span className="font-mono text-cyan-400 text-[11px]">VAULT10-LIFETIME-VERIFIED</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
