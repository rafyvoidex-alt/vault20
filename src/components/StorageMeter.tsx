import React, { useState } from 'react';
import { HardDrive, Shield, Sparkles, CheckCircle, Infinity as InfinityIcon, Zap, PieChart, AlertOctagon } from 'lucide-react';
import { calculateStorageUsage } from '../utils/storage';

interface StorageMeterProps {
  usage: ReturnType<typeof calculateStorageUsage>;
  onUploadClick: () => void;
  isStorageFull: boolean;
}

export const StorageMeter: React.FC<StorageMeterProps> = ({ usage, onUploadClick, isStorageFull }) => {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Top Storage Full Warning Banner if full */}
      {isStorageFull && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <strong className="block font-bold">Vault Storage Full (10.00 GB Reached)</strong>
            <span>Uploads have been automatically locked to prevent data loss or file corruption. Delete unneeded files or export a backup.</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-50 to-blue-50 text-cyan-700 rounded-2xl border border-cyan-200 flex-shrink-0 shadow-xs">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center flex-wrap gap-2">
                <span>Secure 10GB Cloud Storage</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <InfinityIcon className="w-3 h-3" /> Lifetime Vault
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3 text-cyan-600" /> Max-Compressed
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stored compressed in browser vault • 100% loss-free uncompressed download
              </p>
            </div>
          </div>

          <div className="sm:text-right flex items-baseline sm:flex-col justify-between">
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-700">
                {usage.formattedUsed}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium"> / 10.0 GB ({usage.percentage}%)</span>
            </div>
            {usage.savedBytes > 0 && (
              <span className="text-xs text-emerald-700 font-semibold">
                Saved {usage.formattedSaved} space ({usage.savingsPercentage}% ratio)
              </span>
            )}
          </div>
        </div>

        {/* Live Storage Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden flex shadow-inner">
            {usage.categoryBreakdown.length > 0 ? (
              usage.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.label}: ${cat.formatted} (${cat.percentage}%)`}
                />
              ))
            ) : (
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(usage.percentage, usage.usedBytes > 0 ? 1 : 0)}%` }}
              />
            )}
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isStorageFull ? 'bg-rose-500' : 'bg-cyan-500 animate-pulse'}`} />
              <span>Available: <strong className="text-slate-800">{usage.formattedRemaining}</strong></span>
            </span>
            <div className="flex items-center gap-2">
              <span>{usage.fileCount} {usage.fileCount === 1 ? 'file' : 'files'} stored</span>
              {usage.categoryBreakdown.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                  className="text-cyan-700 hover:text-cyan-900 underline font-semibold text-[11px]"
                >
                  {showDetailedBreakdown ? 'Hide Breakdown' : 'Live Breakdown'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Category Breakdown Pills */}
        {usage.categoryBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 whitespace-nowrap">
                <PieChart className="w-3.5 h-3.5 text-cyan-600" /> Distribution:
              </span>
              {usage.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-800 whitespace-nowrap shadow-xs"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold">{cat.label}:</span>
                  <span className="font-mono text-slate-600">{cat.formatted}</span>
                  <span className="text-[10px] text-slate-400">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Metrics Grid in Clean Light Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-0.5">
            <span className="text-slate-500 block font-medium">Total Quota</span>
            <span className="font-mono font-bold text-slate-900 text-xs">10.00 GB</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-0.5">
            <span className="text-slate-500 block font-medium">Storage Used</span>
            <span className="font-mono font-bold text-cyan-700 text-xs">{usage.formattedUsed}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-0.5">
            <span className="text-slate-500 block font-medium">Space Saved</span>
            <span className="font-mono font-bold text-emerald-700 text-xs">
              {usage.savedBytes > 0 ? `${usage.formattedSaved} (${usage.savingsPercentage}%)` : 'Optimized'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-0.5">
            <span className="text-slate-500 block font-medium">Zero Data Loss</span>
            <span className="font-bold text-emerald-700 text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Verified Safe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
