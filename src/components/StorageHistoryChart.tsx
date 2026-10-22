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
import { TrendingUp, Calendar, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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
        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-slate-500 font-normal">Vault History</span>
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-cyan-700 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                <span>Compressed Storage:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {payload[0]?.value} MB
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Space Saved:</span>
                </span>
                <span className="font-mono font-bold text-emerald-600">
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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-50 to-cyan-50 text-indigo-700 rounded-2xl border border-indigo-200 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">
                Storage History (Past 30 Days)
              </h3>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                30-Day Trend
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual trajectory of compressed vault capacity and compression efficiency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* 1-Year Expiration Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="hidden sm:inline">1-Year Auto-Purge:</span>
            <strong className="font-mono font-bold text-amber-900">{remainingDays}d left</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
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
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-medium">CURRENT USAGE</span>
              <span className="font-mono font-bold text-cyan-700 text-xs">
                {latestPoint.usedMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-medium">SPACE SAVED</span>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                {latestPoint.savedMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-medium">30-DAY GROWTH</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                +{growthMB} MB
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-medium">PURGE SCHEDULE</span>
              <span className="font-semibold text-amber-800 text-[11px] truncate block">
                {expirationDateFormatted}
              </span>
            </div>
          </div>

          {/* Recharts Area Chart in Light Theme */}
          <div className="w-full h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val}MB`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="usedMB"
                  name="Compressed Storage"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#storageGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="savedMB"
                  name="Space Saved"
                  stroke="#059669"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#savedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 1-Year Auto-Purge Policy Disclosure & Simulation Bar */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">
                  1-Year Auto-Delete Policy Active
                </span>
                <p className="text-[11px] text-amber-800">
                  All account files and stored data will be automatically and permanently purged 1 year after creation on{' '}
                  <strong className="text-amber-950 font-bold">{expirationDateFormatted}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSimulate1YearExpire}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px] whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 self-start sm:self-center shadow-xs"
              title="Test the 1-year auto-purge trigger"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Test 1-Year Expiration Purge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
