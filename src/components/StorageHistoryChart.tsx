import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar, Zap, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { StorageHistoryPoint } from '../utils/lifecycle';

interface StorageHistoryChartProps {
  historyData: StorageHistoryPoint[];
  expirationDateFormatted: string;
  remainingDays: number;
  onSimulate1YearExpire: () => void;
}

export const StorageHistoryChart: React.FC<StorageHistoryChartProps> = ({
  historyData,
  expirationDateFormatted,
  remainingDays,
  onSimulate1YearExpire,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const latestPoint = historyData[historyData.length - 1] || { usedMB: 0, savedMB: 0 };
  const firstPoint = historyData[0] || { usedMB: 0 };
  const growthMB = Math.max(0, parseFloat((latestPoint.usedMB - firstPoint.usedMB).toFixed(2)));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400">Vault Snapshot</span>
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Compressed Storage:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {payload[0]?.value} MB
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Space Saved:</span>
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  +{payload[1]?.value} MB
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                Storage History (Past 30 Days)
              </h3>
              <span className="text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                30-Day Trend
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live trajectory of compressed vault capacity and compression efficiency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* 1-Year Expiration Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">1-Year Auto-Purge:</span>
            <strong className="font-mono">{remainingDays}d left</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label={isExpanded ? 'Collapse Storage History' : 'Expand Storage History'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">CURRENT USAGE</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">
                {latestPoint.usedMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">SPACE SAVED</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {latestPoint.savedMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">30-DAY GROWTH</span>
              <span className="font-mono font-bold text-white text-xs">
                +{growthMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[10px]">PURGE SCHEDULE</span>
              <span className="font-medium text-amber-300 text-[11px] truncate block">
                {expirationDateFormatted}
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val}MB`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="usedMB"
                  name="Compressed Storage"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#storageGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="savedMB"
                  name="Space Saved"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#savedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 1-Year Auto-Purge Policy Disclosure & Simulation Bar */}
          <div className="p-3 bg-slate-950/70 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">
                  1-Year Auto-Delete Policy Active
                </span>
                <p className="text-[11px] text-slate-400">
                  All account files and stored data will be automatically and permanently purged 1 year after creation on{' '}
                  <strong className="text-slate-200">{expirationDateFormatted}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSimulate1YearExpire}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl font-medium text-[11px] whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 self-start sm:self-center"
              title="Test the 1-year auto-purge trigger"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Test 1-Year Expiration Purge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
