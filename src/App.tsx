/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Upload, ShieldAlert, Sparkles, Laptop, Globe } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StorageMeter } from './components/StorageMeter';
import { StorageHistoryChart } from './components/StorageHistoryChart';
import { FileList } from './components/FileList';
import { UploadModal } from './components/UploadModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { SecurityBanModal } from './components/SecurityBanModal';
import { SecurityStatusModal } from './components/SecurityStatusModal';
import { LifetimeCertificateModal } from './components/LifetimeCertificateModal';
import { AutoPurgeNotificationModal } from './components/AutoPurgeNotificationModal';
import { DeviceManagerModal } from './components/DeviceManagerModal';
import { NetlifyScalabilityModal } from './components/NetlifyScalabilityModal';
import { AuthScreen } from './components/AuthScreen';
import {
  SecurityState,
  INITIAL_SECURITY_STATE,
  normalizeSecurityState,
  evaluateLoginAttempt,
  unbanIpAddress,
  resetSecurityRecords,
  IpBanRecord,
  cleanIp,
} from './utils/security';
import {
  VaultFile,
  calculateStorageUsage,
  TOTAL_STORAGE_BYTES,
} from './utils/storage';
import {
  saveFileToIndexedDB,
  getFilesFromIndexedDB,
  deleteFileFromIndexedDB,
  clearAllFilesForUser,
} from './utils/indexedDb';
import {
  getExpirationInfo,
  generate30DayStorageHistory,
} from './utils/lifecycle';

const DEFAULT_USER_EMAIL = 'rafyvoidex@gmail.com';
const SECURITY_STORAGE_KEY = 'vault10_security_state';
const CURRENT_USER_KEY = 'vault10_current_user';
const CLIENT_IP_KEY = 'vault10_client_ip';
const ACCOUNT_CREATED_KEY = 'vault10_account_created_at';

export default function App() {
  // 1. IP and Security State
  const [clientIp, setClientIp] = useState<string>(() => {
    return localStorage.getItem(CLIENT_IP_KEY) || '192.168.1.105';
  });

  const [securityState, setSecurityState] = useState<SecurityState>(() => {
    try {
      const stored = localStorage.getItem(SECURITY_STORAGE_KEY);
      return stored ? normalizeSecurityState(JSON.parse(stored)) : INITIAL_SECURITY_STATE;
    } catch {
      return INITIAL_SECURITY_STATE;
    }
  });

  // Current authenticated user (null if on auth screen)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || null;
  });

  // Account creation timestamp for 1-year auto-purge
  const [accountCreatedAt, setAccountCreatedAt] = useState<number>(() => {
    const stored = localStorage.getItem(ACCOUNT_CREATED_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  });

  // Files stored in 10GB vault
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false);
  const [isNetlifyModalOpen, setIsNetlifyModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Active Ban state
  const isCurrentIpBanned = !!securityState?.bannedIps?.[cleanIp(clientIp)];
  const [activeBanRecord, setActiveBanRecord] = useState<IpBanRecord | null>(
    securityState?.bannedIps?.[cleanIp(clientIp)] || null
  );

  // Sync security state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(securityState));
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, [securityState]);

  // Sync client IP to localStorage
  useEffect(() => {
    localStorage.setItem(CLIENT_IP_KEY, clientIp);
  }, [clientIp]);

  // Auto-detect real IP if available in browser
  useEffect(() => {
    if (!localStorage.getItem(CLIENT_IP_KEY)) {
      fetch('https://api64.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.ip) {
            setClientIp(data.ip);
          }
        })
        .catch(() => {
          // Graceful fallback to default client IP
        });
    }
  }, []);

  // Check URL query parameters (e.g. ?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !currentUserEmail && !isCurrentIpBanned) {
      handleOAuthLogin(DEFAULT_USER_EMAIL);
    }
  }, []);

  // Check 1-Year Expiration on mount or when user changes
  useEffect(() => {
    if (currentUserEmail) {
      const expirationInfo = getExpirationInfo(accountCreatedAt);
      if (expirationInfo.isExpired) {
        // Trigger auto-purge
        handleExecuteAutoPurge();
      }
    }
  }, [currentUserEmail, accountCreatedAt]);

  // Load files from IndexedDB when user is logged in
  useEffect(() => {
    if (currentUserEmail) {
      setIsLoadingFiles(true);
      getFilesFromIndexedDB(currentUserEmail)
        .then((userFiles) => {
          setFiles(userFiles);
        })
        .catch((err) => {
          console.error('Error loading vault files:', err);
        })
        .finally(() => {
          setIsLoadingFiles(false);
        });
    } else {
      setFiles([]);
    }
  }, [currentUserEmail]);

  // Handle OAuth Sign In with Strict 1-IP 1-Account Enforcement + Multi-Device Gmail Support
  const handleOAuthLogin = (email: string) => {
    const result = evaluateLoginAttempt(clientIp, email, securityState);

    setSecurityState(result.updatedState);

    if (result.isBanned) {
      setActiveBanRecord(result.banRecord || result.updatedState.bannedIps[cleanIp(clientIp)]);
      setCurrentUserEmail(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      return;
    }

    if (result.allowed) {
      setCurrentUserEmail(email);
      localStorage.setItem(CURRENT_USER_KEY, email);
      setActiveBanRecord(null);

      // Initialize or load account created timestamp
      if (!localStorage.getItem(ACCOUNT_CREATED_KEY)) {
        const now = Date.now();
        localStorage.setItem(ACCOUNT_CREATED_KEY, now.toString());
        setAccountCreatedAt(now);
      }
    }
  };

  // Sign out
  const handleSignOut = () => {
    setCurrentUserEmail(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Execute 1-Year Auto-Purge (Wipe all data)
  const handleExecuteAutoPurge = async () => {
    if (!currentUserEmail) return;
    await clearAllFilesForUser(currentUserEmail);
    setFiles([]);
    // Reset account creation timestamp to now
    const now = Date.now();
    localStorage.setItem(ACCOUNT_CREATED_KEY, now.toString());
    setAccountCreatedAt(now);
    setIsPurgeModalOpen(true);
  };

  // Simulate 1-Year Expiration for Testing
  const handleSimulate1YearExpire = () => {
    handleExecuteAutoPurge();
  };

  // Simulate 2nd Account Violation for Testing
  const handleSimulateViolation = () => {
    const secondEmail = 'intruder2@unauthorized-domain.com';
    const result = evaluateLoginAttempt(clientIp, secondEmail, securityState);
    setSecurityState(result.updatedState);
    setActiveBanRecord(result.banRecord || null);
    setCurrentUserEmail(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Admin Unban IP
  const handleUnbanIp = (ipToUnban: string) => {
    const updated = unbanIpAddress(ipToUnban, securityState);
    setSecurityState(updated);
    setActiveBanRecord(null);
  };

  // Admin Reset All
  const handleResetAll = () => {
    const clean = resetSecurityRecords();
    setSecurityState(clean);
    setActiveBanRecord(null);
    setCurrentUserEmail(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SECURITY_STORAGE_KEY);
  };

  // Add new file to 10GB vault
  const handleFileUploaded = async (newFile: VaultFile) => {
    if (!currentUserEmail) return;
    await saveFileToIndexedDB(newFile, currentUserEmail);
    setFiles((prev) => [newFile, ...prev]);
  };

  // Delete file from vault
  const handleDeleteFile = async (id: string) => {
    if (!currentUserEmail) return;
    await deleteFileFromIndexedDB(id, currentUserEmail);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewFile?.id === id) {
      setPreviewFile(null);
    }
  };

  // Toggle Pin/Star
  const handleTogglePin = async (id: string) => {
    if (!currentUserEmail) return;
    const target = files.find((f) => f.id === id);
    if (!target) return;
    const updated: VaultFile = { ...target, isPinned: !target.isPinned };
    await saveFileToIndexedDB(updated, currentUserEmail);
    setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  // When a backup is restored from another device or JSON file
  const handleBackupRestored = async () => {
    if (currentUserEmail) {
      const refreshed = await getFilesFromIndexedDB(currentUserEmail);
      setFiles(refreshed);
    }
  };

  const storageUsage = calculateStorageUsage(files, TOTAL_STORAGE_BYTES);
  const isStorageFull = storageUsage.usedBytes >= TOTAL_STORAGE_BYTES;
  const currentBinding = securityState?.ipBindings?.[cleanIp(clientIp)];
  const expirationInfo = getExpirationInfo(accountCreatedAt);
  const historyData = generate30DayStorageHistory(files);
  const registeredDevices = (currentUserEmail && securityState?.accountDevices?.[currentUserEmail]) || [];
  const deviceCount = Math.max(1, registeredDevices.length);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white antialiased">
      {/* 1. Permanent Ban Lockout Screen (Highest Priority) */}
      {(isCurrentIpBanned || activeBanRecord) && (
        <SecurityBanModal
          banRecord={activeBanRecord}
          clientIp={clientIp}
          securityState={securityState}
          onUnbanIp={handleUnbanIp}
          onResetAll={handleResetAll}
        />
      )}

      {/* 2. Authentication Screen (when not logged in) */}
      {!currentUserEmail && !isCurrentIpBanned && !activeBanRecord && (
        <AuthScreen
          clientIp={clientIp}
          isBanned={isCurrentIpBanned}
          boundEmail={currentBinding?.email}
          defaultEmail={DEFAULT_USER_EMAIL}
          onContinueOAuth={handleOAuthLogin}
          onChangeIp={(newIp) => setClientIp(newIp)}
          onTriggerViolationTest={handleSimulateViolation}
        />
      )}

      {/* 3. Main 10GB Vault Dashboard (when authenticated) */}
      {currentUserEmail && !isCurrentIpBanned && !activeBanRecord && (
        <>
          <Navbar
            userEmail={currentUserEmail}
            clientIp={clientIp}
            isBanned={isCurrentIpBanned}
            totalUsageFormatted={storageUsage.formattedUsed}
            totalSavedFormatted={storageUsage.formattedSaved}
            savingsPercentage={storageUsage.savingsPercentage}
            deviceCount={deviceCount}
            onSignOut={handleSignOut}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onOpenDeviceManager={() => setIsDeviceManagerOpen(true)}
            onOpenNetlifyGuide={() => setIsNetlifyModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 pb-24 sm:pb-12">
            {/* Storage Full Banner if 10GB limit is hit */}
            {isStorageFull && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-rose-900">
                  <p className="font-bold text-sm">Vault Full (10.00 GB Reached) — Uploads Locked For Safety</p>
                  <p className="text-rose-700 mt-0.5">
                    To guarantee zero data loss, no new files can be uploaded until you delete unneeded items or download your vault backup. All existing files remain 100% safe.
                  </p>
                </div>
              </div>
            )}

            {/* 10 GB Storage Capacity Meter & Live Analytics */}
            <StorageMeter
              usage={storageUsage}
              onUploadClick={() => setIsUploadOpen(true)}
              isStorageFull={isStorageFull}
            />

            {/* Storage History (Past 30 Days) with recharts & 1-Year Expiration */}
            <StorageHistoryChart
              historyData={historyData}
              expirationDateFormatted={expirationInfo.formattedExpiration}
              remainingDays={expirationInfo.remainingDays}
              onSimulate1YearExpire={handleSimulate1YearExpire}
            />

            {/* Action Bar (Upload button & Live Count) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Your Vault Files</span>
                  <span className="text-xs bg-sky-50 text-sky-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                    {files.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {files.length === 0
                    ? 'Vault empty. Maximum lossless compression will automatically protect uploaded files.'
                    : `Managing ${files.length} permanent ${files.length === 1 ? 'file' : 'files'} • Uncompressed bit-perfect download`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  disabled={isStorageFull}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-xs transition-all ${
                    isStorageFull
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20 active:scale-95'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isStorageFull ? 'Storage Full (Uploads Locked)' : 'Upload Files to 10GB Space'}</span>
                </button>
              </div>
            </div>

            {/* File Browser with Search & Dropdowns */}
            {isLoadingFiles ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
                <div className="w-8 h-8 mx-auto border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-slate-600">Loading compressed 10GB vault...</p>
              </div>
            ) : (
              <FileList
                files={files}
                onUploadClick={() => setIsUploadOpen(true)}
                onPreviewFile={(file) => setPreviewFile(file)}
                onDeleteFile={handleDeleteFile}
                onTogglePin={handleTogglePin}
                onOpenDeviceManager={() => setIsDeviceManagerOpen(true)}
                isStorageFull={isStorageFull}
              />
            )}
          </main>

          {/* Mobile Floating Action Button (FAB) for Easy Upload on the Go */}
          <div className="sm:hidden fixed bottom-5 right-5 z-20">
            <button
              onClick={() => setIsUploadOpen(true)}
              disabled={isStorageFull}
              className={`w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-all ${
                isStorageFull
                  ? 'bg-slate-400 cursor-not-allowed opacity-80'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30 active:scale-95'
              }`}
              title="Upload File"
              aria-label="Upload File"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          {/* Clean Light Footer */}
          <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>© 2026 Lifetime Cloud Vault • 10 GB Zero-Loss Storage • 1-Year Retention Policy</span>
              </p>
              <div className="flex items-center space-x-3 text-[11px]">
                <button
                  onClick={() => setIsNetlifyModalOpen(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                >
                  Netlify Capacity
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsDeviceManagerOpen(true)}
                  className="hover:text-sky-600 font-medium transition-colors"
                >
                  Tracked Devices ({deviceCount})
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="hover:text-sky-600 transition-colors"
                >
                  10GB Guarantee
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="hover:text-sky-600 transition-colors"
                >
                  1-IP Security Status
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileUploaded={handleFileUploaded}
        currentUsedBytes={storageUsage.usedBytes}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <SecurityStatusModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        clientIp={clientIp}
        securityState={securityState}
        currentEmail={currentUserEmail || ''}
        onSimulateViolation={handleSimulateViolation}
      />

      <LifetimeCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        userEmail={currentUserEmail || DEFAULT_USER_EMAIL}
        clientIp={clientIp}
      />

      <AutoPurgeNotificationModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        userEmail={currentUserEmail || DEFAULT_USER_EMAIL}
      />

      <DeviceManagerModal
        isOpen={isDeviceManagerOpen}
        onClose={() => setIsDeviceManagerOpen(false)}
        userEmail={currentUserEmail || DEFAULT_USER_EMAIL}
        devices={registeredDevices}
        currentIp={clientIp}
        onBackupRestored={handleBackupRestored}
      />

      <NetlifyScalabilityModal
        isOpen={isNetlifyModalOpen}
        onClose={() => setIsNetlifyModalOpen(false)}
      />
    </div>
  );
}
