import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getExpirationInfo,
  filterFilesByDate,
  generate30DayStorageHistory,
  ONE_YEAR_MS,
} from './lifecycle';
import { VaultFile } from './storage';

test('Lifecycle Engine - getExpirationInfo computes 1-year remaining time correctly', () => {
  const registeredAt = Date.now();
  const info = getExpirationInfo(registeredAt);

  assert.equal(info.isExpired, false);
  assert.equal(info.remainingDays, 365);
  assert.ok(info.formattedExpiration.length > 0);

  // Past 1 year
  const pastYear = registeredAt - (ONE_YEAR_MS + 1000);
  const expiredInfo = getExpirationInfo(pastYear);
  assert.equal(expiredInfo.isExpired, true);
  assert.equal(expiredInfo.remainingDays, 0);
});

test('Lifecycle Engine - filterFilesByDate filters correctly', () => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const files: VaultFile[] = [
    {
      id: 'f1',
      name: 'today.txt',
      size: 100,
      originalSize: 200,
      type: 'text/plain',
      category: 'document',
      uploadedAt: now - 1000 * 60, // 1 min ago
      sha256Hash: 'a',
      isEncrypted: true,
      isLifetimeGuaranteed: true,
      isCompressed: true,
    },
    {
      id: 'f2',
      name: 'lastweek.txt',
      size: 200,
      originalSize: 400,
      type: 'text/plain',
      category: 'document',
      uploadedAt: now - 3 * ONE_DAY, // 3 days ago
      sha256Hash: 'b',
      isEncrypted: true,
      isLifetimeGuaranteed: true,
      isCompressed: true,
    },
    {
      id: 'f3',
      name: 'old.txt',
      size: 300,
      originalSize: 600,
      type: 'text/plain',
      category: 'document',
      uploadedAt: now - 40 * ONE_DAY, // 40 days ago
      sha256Hash: 'c',
      isEncrypted: true,
      isLifetimeGuaranteed: true,
      isCompressed: true,
    },
  ];

  assert.equal(filterFilesByDate(files, 'all', now).length, 3);
  assert.equal(filterFilesByDate(files, 'today', now).length, 1);
  assert.equal(filterFilesByDate(files, '7days', now).length, 2);
  assert.equal(filterFilesByDate(files, '30days', now).length, 2);
  assert.equal(filterFilesByDate(files, 'older', now).length, 1);
});

test('Lifecycle Engine - generate30DayStorageHistory produces 30 consecutive data points', () => {
  const now = Date.now();
  const history = generate30DayStorageHistory([], now);
  assert.equal(history.length, 30);
  assert.equal(history[29].usedBytes, 0);
});
