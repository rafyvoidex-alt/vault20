import React, { useState } from 'react';
import { HardDrive, Shield, Sparkles, CheckCircle, Infinity as InfinityIcon, Zap, PieChart } from 'lucide-react';
import { calculateStorageUsage } from '../utils/storage';

interface StorageMeterProps {
  usage: ReturnType<typeof calculateStorageUsage>;
  onUploadClick: () => void;
}

export const StorageMeter: React.FC<StorageMeterProps> = ({ usage, onUploadClick }) => {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-5 relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 flex-shrink-0">
              <HardDrive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center flex-wrap gap-2">
                <span>Secure 10GB Cloud Storage</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <InfinityIcon className="w-3 h-3" /> Lifetime Free
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" /> Max Lossless Compression
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Stored compressed in browser vault • Restored 100% uncompressed on download
              </p>
            </div>
          </div>

          <div className="sm:text-right flex items-baseline sm:flex-col justify-between">
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                {usage.formattedUsed}
              </span>
              <span className="text-xs sm:text-sm text-slate-400"> / 10.0 GB ({usage.percentage}%)</span>
            </div>
            {usage.savedBytes > 0 && (
              <span className="text-xs text-emerald-400 font-medium">
                Saved {usage.formattedSaved} space ({usage.savingsPercentage}% ratio)
              </span>
            )}
          </div>
        </div>

        {/* Live Storage Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700/60 overflow-hidden flex">
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
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Available: <strong className="text-slate-200">{usage.formattedRemaining}</strong></span>
            </span>
            <div className="flex items-center gap-2">
              <span>{usage.fileCount} {usage.fileCount === 1 ? 'file' : 'files'} stored</span>
              {usage.categoryBreakdown.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                  className="text-cyan-400 hover:text-cyan-300 underline font-medium text-[11px]"
                >
                  {showDetailedBreakdown ? 'Hide Live Breakdown' : 'Live Breakdown'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Category Breakdown Pills (Interactive) */}
        {usage.categoryBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap">
                <PieChart className="w-3.5 h-3.5 text-cyan-400" /> Live Distribution:
              </span>
              {usage.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-200 whitespace-nowrap"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium">{cat.label}:</span>
                  <span className="font-mono text-slate-300">{cat.formatted}</span>
                  <span className="text-[10px] text-slate-400">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Compression Engine Efficiency Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
            <span className="text-slate-400 block">Total Quota</span>
            <span className="font-mono font-bold text-white text-xs">10.00 GB</span>
          </div>
          <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
            <span className="text-slate-400 block">Storage Used</span>
            <span className="font-mono font-bold text-cyan-400 text-xs">{usage.formattedUsed}</span>
          </div>
          <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
            <span className="text-slate-400 block">Space Saved</span>
            <span className="font-mono font-bold text-emerald-400 text-xs">
              {usage.savedBytes > 0 ? `${usage.formattedSaved} (${usage.savingsPercentage}%)` : 'Optimized'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
            <span className="text-slate-400 block">Retention Guarantee</span>
            <span className="font-medium text-emerald-400 text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3 flex-shrink-0" /> Zero Deletion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
