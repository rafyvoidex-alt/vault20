/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
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
import { AuthScreen } from './components/AuthScreen';
import {
  SecurityState,
  INITIAL_SECURITY_STATE,
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
      return stored ? JSON.parse(stored) : INITIAL_SECURITY_STATE;
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
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Active Ban state
  const isCurrentIpBanned = !!securityState.bannedIps[cleanIp(clientIp)];
  const [activeBanRecord, setActiveBanRecord] = useState<IpBanRecord | null>(
    securityState.bannedIps[cleanIp(clientIp)] || null
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

  // Handle OAuth Sign In with Strict 1-IP 1-Account Enforcement
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

  const storageUsage = calculateStorageUsage(files, TOTAL_STORAGE_BYTES);
  const currentBinding = securityState.ipBindings[cleanIp(clientIp)];
  const expirationInfo = getExpirationInfo(accountCreatedAt);
  const historyData = generate30DayStorageHistory(files);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
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
            onSignOut={handleSignOut}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 pb-24 sm:pb-12">
            {/* 10 GB Storage Capacity Meter & Live Analytics */}
            <StorageMeter
              usage={storageUsage}
              onUploadClick={() => setIsUploadOpen(true)}
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
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Your Vault Files</span>
                  <span className="text-xs bg-slate-800 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                    {files.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {files.length === 0
                    ? 'Vault empty. Maximum compression will automatically optimize uploaded files.'
                    : `Managing ${files.length} permanent ${files.length === 1 ? 'file' : 'files'} • Uncompressed bit-perfect download`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Files to 10GB Space</span>
                </button>
              </div>
            </div>

            {/* File Browser with Search & Dropdowns */}
            {isLoadingFiles ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Loading compressed 10GB vault...</p>
              </div>
            ) : (
              <FileList
                files={files}
                onUploadClick={() => setIsUploadOpen(true)}
                onPreviewFile={(file) => setPreviewFile(file)}
                onDeleteFile={handleDeleteFile}
                onTogglePin={handleTogglePin}
              />
            )}
          </main>

          {/* Mobile Floating Action Button (FAB) for Easy Upload on the Go */}
          <div className="sm:hidden fixed bottom-5 right-5 z-20">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-cyan-400/30"
              title="Upload File"
              aria-label="Upload File"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>© 2026 Lifetime Cloud Vault • 10 GB Guaranteed Free Storage • 1-Year Auto-Delete Retention</p>
              <div className="flex items-center space-x-4 text-[11px]">
                <button
                  onClick={() => setIsCertificateOpen(true)}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Storage Guarantee Policy
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="hover:text-cyan-400 transition-colors"
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
    </div>
  );
}
