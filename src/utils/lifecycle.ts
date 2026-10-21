/**
 * Account Lifecycle & 1-Year Auto-Purge Policy Engine
 */

import { VaultFile } from './storage';

export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface ExpirationInfo {
  expirationDate: Date;
  isExpired: boolean;
  remainingDays: number;
  remainingHours: number;
  formattedExpiration: string;
}

/**
 * Calculates remaining lifetime before the 1-year auto-delete trigger
 */
export function getExpirationInfo(
  registeredAt: number,
  currentTimestamp = Date.now()
): ExpirationInfo {
  const expirationTimestamp = registeredAt + ONE_YEAR_MS;
  const diffMs = expirationTimestamp - currentTimestamp;
  const isExpired = diffMs <= 0;

  const totalRemainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const remainingDays = Math.floor(totalRemainingHours / 24);
  const remainingHours = totalRemainingHours % 24;

  const expirationDate = new Date(expirationTimestamp);
  const formattedExpiration = expirationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    expirationDate,
    isExpired,
    remainingDays,
    remainingHours,
    formattedExpiration,
  };
}

/**
 * Filters files by recency/date range
 */
export function filterFilesByDate(
  files: VaultFile[],
  dateFilter: 'all' | 'today' | '7days' | '30days' | 'older',
  referenceTime = Date.now()
): VaultFile[] {
  if (dateFilter === 'all') return files;

  const ONE_DAY = 24 * 60 * 60 * 1000;

  return files.filter((f) => {
    const age = referenceTime - f.uploadedAt;
    switch (dateFilter) {
      case 'today':
        return age <= ONE_DAY;
      case '7days':
        return age <= 7 * ONE_DAY;
      case '30days':
        return age <= 30 * ONE_DAY;
      case 'older':
        return age > 30 * ONE_DAY;
      default:
        return true;
    }
  });
}

export interface StorageHistoryPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  usedBytes: number;
  usedMB: number;
  savedMB: number;
  filesCount: number;
}

/**
 * Generates daily storage trends over the past 30 days based on files in the vault
 */
export function generate30DayStorageHistory(
  files: VaultFile[],
  now = Date.now()
): StorageHistoryPoint[] {
  const points: StorageHistoryPoint[] = [];
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const sortedFiles = [...files].sort((a, b) => a.uploadedAt - b.uploadedAt);

  for (let i = 29; i >= 0; i--) {
    const dayTimestamp = now - i * ONE_DAY;
    const dateObj = new Date(dayTimestamp);
    const dateKey = dateObj.toISOString().split('T')[0];
    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Sum files uploaded on or before this day's end
    const filesUpToDay = sortedFiles.filter((f) => f.uploadedAt <= dayTimestamp + ONE_DAY - 1);
    const usedBytes = filesUpToDay.reduce((sum, f) => sum + (f.size || 0), 0);
    const originalBytes = filesUpToDay.reduce((sum, f) => sum + (f.originalSize || f.size || 0), 0);
    const savedBytes = Math.max(0, originalBytes - usedBytes);

    points.push({
      date: dateKey,
      displayDate,
      timestamp: dayTimestamp,
      usedBytes,
      usedMB: parseFloat((usedBytes / (1024 * 1024)).toFixed(2)),
      savedMB: parseFloat((savedBytes / (1024 * 1024)).toFixed(2)),
      filesCount: filesUpToDay.length,
    });
  }

  return points;
}
