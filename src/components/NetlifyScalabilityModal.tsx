import React, { useState } from 'react';
import { X, Globe, Users, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Server } from 'lucide-react';

interface NetlifyScalabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetlifyScalabilityModal: React.FC<NetlifyScalabilityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [estimatedUsers, setEstimatedUsers] = useState(1000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden text-slate-800 max-h-[90vh] flex flex-col">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

        <button
          onClick={onClose}
          aria-label="Close Netlify scalability guide"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Netlify Hosting & User Capacity Guide
            </h3>
            <p className="text-xs text-slate-500">
              Kitne log apna data save rakh sakte hain? (Scalability & Architecture)
            </p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-slate-600 leading-relaxed">
          {/* Main Direct Answer Box */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <h4 className="font-bold text-emerald-950 text-sm">
                Short Answer: UNLIMITED USERS (Millions of Users)
              </h4>
            </div>
            <p className="text-emerald-900 text-[11px] leading-relaxed">
              Because this website is deployed to Netlify as a modern client-partitioned Web App, <strong>files are stored directly on each user's device/phone via browser IndexedDB and Web Storage</strong>. Netlify does not store the files on its central web server hard drive.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Result: 1,000, 10,000, or 1,000,000+ people can each save up to 10GB independently!</span>
            </div>
          </div>

          {/* Breakdown: How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <HardDrive className="w-4 h-4 text-cyan-600" />
                <span>On-Device 10GB Sandbox</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Each phone or PC gets its own dedicated, encrypted 10GB vault in the browser's persistent storage. One user's files never affect another user's storage.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>Netlify Free Tier Safety</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Netlify only serves the lightweight application code (~150 KB). You will not exceed Netlify's bandwidth or disk limits because file data never clogs Netlify's server.
              </p>
            </div>
          </div>

          {/* Zero Data Loss & Website Full Protection */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-[11px] text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Zero Data Loss & "Storage Full" Protection</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-amber-900">
              <li>
                <strong>Hard Quota Lock:</strong> If a user's vault reaches 10.00 GB, further uploads are automatically locked to prevent file truncation, browser storage overflow, or data loss.
              </li>
              <li>
                <strong>Lossless Bit-Perfect Download:</strong> Maximum GZIP compression saves web storage space, but decompressing upon download ensures 100% original bytes are restored.
              </li>
              <li>
                <strong>Vault Backup Export:</strong> Users can export a `.json` backup file anytime to safely preserve files across device wipes or switch mobile devices.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium text-[11px]">
            Architecture: Client-Partitioned Progressive Web Vault
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
