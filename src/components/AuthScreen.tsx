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
  Smartphone,
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans">
      {/* Background soft ambient radial gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-100/60 via-blue-100/40 to-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto relative z-10 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-600/20 mb-1">
            <Cloud className="w-9 h-9 text-white" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>10 GB Lifetime Free Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Lifetime Cloud Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Light • Smooth • Zero Data Loss • Maximum Lossless Web Storage Compression
            </p>
          </div>
        </div>

        {/* Auth Box in Light Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-md space-y-5">
          {/* Security & Device Notice Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Device & IP Guard:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIpEditor(!showIpEditor)}
                className="font-mono text-cyan-700 hover:underline text-[11px] font-bold"
                title="Click to simulate or switch IP"
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
                  className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-mono flex-1 focus:outline-none focus:border-cyan-600"
                  placeholder="e.g. 192.168.1.100"
                />
                <button
                  type="button"
                  onClick={handleSaveIp}
                  className="px-3 py-1 bg-cyan-600 text-white font-bold rounded-xl text-xs"
                >
                  Set IP
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
                <p>
                  <strong>Multi-Device:</strong> You can access your vault from any phone or PC using your registered Gmail!
                </p>
                <p>
                  <strong className="text-rose-700">Anti-Abuse Rule:</strong> Only <span className="font-bold text-slate-900">1 account</span> is allowed per IP/device. Attempting to log into a <em>second different account</em> triggers an automatic permanent ban.
                </p>
              </div>
            )}

            {boundEmail && (
              <div className="text-[11px] bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
                Bound Account on this IP: <strong>{boundEmail}</strong>
              </div>
            )}
          </div>

          {/* Primary OAuth Button: Continue with Google */}
          <div className="space-y-3">
            <button
              onClick={() => onContinueOAuth(defaultEmail)}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 font-medium transition-colors"
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
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-colors shadow-xs"
                  >
                    Continue
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Quick Demo: Security Ban Simulator Button */}
          <div className="pt-2.5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Test Anti-Abuse Permanent Ban:</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onTriggerViolationTest}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate 2nd Account Attempt on this IP (Triggers Ban)</span>
            </button>
          </div>
        </div>

        {/* 3 Value Pillars in Clean Light Theme */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <HardDrive className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-slate-900">10 GB Vault</h4>
            <p className="text-[10px] text-slate-500">Zero recurring charges</p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Smartphone className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-slate-900">Multi-Device</h4>
            <p className="text-[10px] text-slate-500">Same Gmail on phones</p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <h4 className="text-xs font-bold text-slate-900">Zero Loss</h4>
            <p className="text-[10px] text-slate-500">Hard quota protection</p>
          </div>
        </div>
      </div>
    </div>
  );
};
