import React, { useRef, useState } from 'react';
import { X, Smartphone, Monitor, ShieldCheck, Download, Upload, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { DeviceRecord } from '../utils/security';
import { exportVaultBackup, importVaultBackup } from '../utils/indexedDb';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  devices: DeviceRecord[];
  currentIp: string;
  onBackupRestored: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  devices,
  currentIp,
  onBackupRestored,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportVaultBackup(userEmail);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault10-backup-${userEmail.replace(/[@.]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImportStatus('Complete vault backup exported successfully! You can transfer this to your other mobile.');
      setIsError(false);
    } catch (e: any) {
      setImportStatus(`Export failed: ${e.message}`);
      setIsError(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importVaultBackup(content, userEmail);
      if (res.success) {
        setImportStatus(res.message);
        setIsError(false);
        onBackupRestored();
      } else {
        setImportStatus(res.message);
        setIsError(true);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close device manager"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Tracked Devices & Mobile Sync
            </h3>
            <p className="text-xs text-slate-500">
              Linked to <strong className="text-slate-700">{userEmail}</strong>
            </p>
          </div>
        </div>

        {/* Cross-Device Access Explanation */}
        <div className="p-3.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl mb-4 text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-800">
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
            <span>Multi-Device Access with Same Gmail</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            You can log into this vault from your other mobile phones or PCs using this same Gmail account (<strong className="text-slate-800">{userEmail}</strong>) without being blocked! Each device is tracked with its own distinct IP and hardware fingerprint.
          </p>
        </div>

        {/* Connected Devices List */}
        <div className="space-y-2 mb-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Authorized Devices ({devices.length})
          </span>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {devices.map((dev, idx) => {
              const isCurrent = dev.ip === currentIp;
              const isMobile = dev.deviceName.toLowerCase().includes('phone') || dev.deviceName.toLowerCase().includes('android');

              return (
                <div
                  key={dev.deviceId || idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                    isCurrent
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-xl ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">{dev.deviceName}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        IP: {dev.ip} • Last active {new Date(dev.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zero Data Loss: Export / Import Backup Section */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Zero Data Loss Transfer</span>
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              100% Safe
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Want to transfer all your files to another phone? Export a backup file, send it to your other device, and click Import!
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Export Vault (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import / Sync Vault</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
              isError
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
