import React, { useState } from 'react';
import {
  Cloud,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  HardDrive,
  Infinity as InfinityIcon,
  CheckCircle,
  AlertTriangle,
  User,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AuthScreenProps {
  clientIp: string;
  isBanned: boolean;
  boundEmail?: string;
  defaultEmail: string;
  onContinueOAuth: (email: string) => void;
  onChangeIp: (newIp: string) => void;
  onTriggerViolationTest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  clientIp,
  isBanned,
  boundEmail,
  defaultEmail,
  onContinueOAuth,
  onChangeIp,
  onTriggerViolationTest,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showIpEditor, setShowIpEditor] = useState(false);
  const [ipInput, setIpInput] = useState(clientIp);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim()) {
      onContinueOAuth(customEmail.trim());
    }
  };

  const handleSaveIp = () => {
    if (ipInput.trim()) {
      onChangeIp(ipInput.trim());
      setShowIpEditor(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto relative z-10 space-y-5">
        {/* Brand & Title */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 mb-1">
            <Cloud className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>10 GB Lifetime Free Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Lifetime Cloud Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Maximum web storage compression saves space • 100% original uncompressed restoration on download • Strict 1-IP protection.
            </p>
          </div>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-4">
          {/* Security Notice Banner */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Shield:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIpEditor(!showIpEditor)}
                className="font-mono text-cyan-400 hover:underline text-[11px]"
                title="Click to change or simulate IP"
              >
                IP: {clientIp}
              </button>
            </div>

            {showIpEditor ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono flex-1 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. 192.168.1.100"
                />
                <button
                  type="button"
                  onClick={handleSaveIp}
                  className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Set IP
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Rule #1:</strong> Exactly <span className="text-cyan-400 font-semibold">1 account</span> permitted per IP address. Attempting to register or log into a second account will result in a <span className="text-rose-400 font-semibold">permanent ban</span>.
              </p>
            )}

            {boundEmail && (
              <div className="text-[11px] bg-slate-900 p-2 rounded-xl border border-slate-800 text-slate-300">
                Bound to IP: <strong className="text-emerald-400">{boundEmail}</strong>
              </div>
            )}
          </div>

          {/* Primary OAuth Button: Continue with Google */}
          <div className="space-y-2.5">
            <button
              onClick={() => onContinueOAuth(defaultEmail)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm shadow-xl shadow-white/5 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google ({defaultEmail})</span>
            </button>

            {/* Alternate Account / Custom Email Option */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
              >
                Or sign in with another email address →
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1 animate-in fade-in">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter custom email address"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 transition-colors"
                  >
                    Continue
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-400"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Quick Demo: Security Ban Simulator Button */}
          <div className="pt-2.5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Test 1-IP Security Enforcement:</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onTriggerViolationTest}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate 2nd Account Attempt (Triggers Ban)</span>
            </button>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">10 GB Vault</h4>
            <p className="text-[10px] text-slate-400">Zero recurring charges</p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">Max Compress</h4>
            <p className="text-[10px] text-slate-400">Lossless download</p>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-white">1-IP Shield</h4>
            <p className="text-[10px] text-slate-400">Permanent ban guard</p>
          </div>
        </div>
      </div>
    </div>
  );
};
