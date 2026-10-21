import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStorageUsage,
  validateFileUpload,
  formatBytes,
  getFileCategory,
  TOTAL_STORAGE_BYTES,
  VaultFile,
} from './storage';

test('Storage Engine - formatBytes handles various magnitudes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(1073741824), '1 GB');
  assert.equal(formatBytes(TOTAL_STORAGE_BYTES), '10 GB');
});

test('Storage Engine - calculateStorageUsage calculates 10GB percentage and savings correctly', () => {
  const mockFiles: VaultFile[] = [
    {
      id: '1',
      name: 'doc.pdf',
      size: 536870912,        // 0.5 GB compressed
      originalSize: 1073741824, // 1 GB original
      type: 'application/pdf',
      category: 'document',
      uploadedAt: 1000,
      sha256Hash: 'abc',
      isEncrypted: true,
      isLifetimeGuaranteed: true,
      isCompressed: true,
    },
    {
      id: '2',
      name: 'photo.jpg',
      size: 536870912,        // 0.5 GB compressed
      originalSize: 1073741824, // 1 GB original
      type: 'image/jpeg',
      category: 'image',
      uploadedAt: 2000,
      sha256Hash: 'def',
      isEncrypted: true,
      isLifetimeGuaranteed: true,
      isCompressed: true,
    },
  ];

  const usage = calculateStorageUsage(mockFiles);
  assert.equal(usage.usedBytes, 1073741824); // 1 GB used in vault
  assert.equal(usage.percentage, 10); // 1 GB / 10 GB = 10%
  assert.equal(usage.fileCount, 2);
  assert.equal(usage.formattedTotal, '10 GB');
  assert.equal(usage.savedBytes, 1073741824); // 1 GB saved through compression
  assert.equal(usage.savingsPercentage, 50); // 50% savings
  assert.equal(usage.categoryBreakdown.length, 2);
});

test('Storage Engine - validateFileUpload prevents quota overflow against 10GB', () => {
  const emptyValidation = validateFileUpload(0, 0);
  assert.equal(emptyValidation.valid, false);

  const validValidation = validateFileUpload(500000000, 0); // 500 MB
  assert.equal(validValidation.valid, true);

  // Exceeding 10 GB
  const exceedValidation = validateFileUpload(
    TOTAL_STORAGE_BYTES + 1024,
    0
  );
  assert.equal(exceedValidation.valid, false);
});

test('Storage Engine - getFileCategory detects file types', () => {
  assert.equal(getFileCategory('image/png', 'avatar.png'), 'image');
  assert.equal(getFileCategory('application/pdf', 'contract.pdf'), 'document');
  assert.equal(getFileCategory('video/mp4', 'intro.mp4'), 'video');
  assert.equal(getFileCategory('application/zip', 'backup.zip'), 'archive');
  assert.equal(getFileCategory('text/javascript', 'script.js'), 'code');
});
