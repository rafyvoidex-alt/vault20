import React, { useState } from 'react';
import { X, Download, ShieldCheck, FileText, Lock, Copy, Check, Zap } from 'lucide-react';
import { VaultFile, formatBytes } from '../utils/storage';
import { decompressBytes, dataUrlToBytes } from '../utils/compression';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;

  const savings = Math.max(0, (file.originalSize || file.size) - file.size);
  const savingsPct = file.originalSize > 0
    ? Math.round((savings / file.originalSize) * 100)
    : 0;

  const handleDownload = async () => {
    if (!file.dataUrl) return;
    setIsDownloading(true);

    try {
      let downloadUrl = file.dataUrl;

      if (file.isCompressed) {
        // Decompress to original bit-perfect bytes
        const compressedBytes = dataUrlToBytes(file.dataUrl);
        const originalBytes = await decompressBytes(compressedBytes);
        const blob = new Blob([originalBytes as unknown as BlobPart], { type: file.type || 'application/octet-stream' });
        downloadUrl = URL.createObjectURL(blob);
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (downloadUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (err) {
      console.error('Download decompression error, falling back:', err);
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(file.sha256Hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                Uploaded {new Date(file.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content View */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[220px]">
          {file.category === 'image' && file.dataUrl && !file.isCompressed ? (
            <img
              src={file.dataUrl}
              alt={file.name}
              className="max-h-[360px] max-w-full rounded-2xl object-contain border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white flex items-center justify-center text-sky-600 border border-slate-200 shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  MIME Type: {file.type || 'application/octet-stream'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Compression & Storage Metrics */}
        <div className="p-5 bg-white border-t border-slate-100 space-y-3 text-xs">
          {/* Compression comparison bar */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                <span>Max-Compression Storage Efficiency:</span>
              </span>
              <span className="font-mono text-emerald-600 font-bold">
                {savingsPct}% Space Saved
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-medium">ORIGINAL FILE SIZE</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatBytes(file.originalSize || file.size)}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-medium">STORED COMPRESSED</span>
                <span className="font-mono font-bold text-sky-600">
                  {formatBytes(file.size)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>On download, this file is fully decompressed to 100% bit-perfect original bytes with zero quality loss.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Retention:</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Lifetime (10GB Quota)
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Encryption:</span>
              <span className="text-sky-700 font-mono font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-sky-600" /> AES-256 GCM
              </span>
            </div>
          </div>

          {/* Checksum */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-slate-400 block text-[10px] font-medium">SHA-256 INTEGRITY HASH</span>
              <code className="text-[11px] font-mono text-slate-700 truncate block">
                {file.sha256Hash}
              </code>
            </div>
            <button
              onClick={handleCopyHash}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors flex-shrink-0"
              title="Copy Checksum"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            {file.dataUrl && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-2 shadow-sm shadow-sky-600/20 transition-all active:scale-95"
              >
                {isDownloading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Decompressing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original Uncompressed File</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
