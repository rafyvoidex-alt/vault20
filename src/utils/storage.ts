/**
 * Cloud Storage Engine: 10GB Free Lifetime Storage Calculations, Live Breakdown and Compression Stats
 */

// 10 Gigabytes in Bytes (10 * 1024 * 1024 * 1024)
export const TOTAL_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10,737,418,240 bytes

export interface VaultFile {
  id: string;
  name: string;
  size: number;          // Compressed size stored in the vault
  originalSize: number;  // Original uncompressed size
  type: string;
  category: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  uploadedAt: number;
  dataUrl?: string;      // Base64 data (compressed in storage, decompressed upon download)
  sha256Hash: string;
  isEncrypted: boolean;
  isLifetimeGuaranteed: boolean;
  isCompressed: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface CategoryBreakdown {
  category: VaultFile['category'];
  label: string;
  bytes: number;
  formatted: string;
  count: number;
  color: string;
  percentage: number;
}

export function calculateStorageUsage(files: VaultFile[], totalQuota = TOTAL_STORAGE_BYTES) {
  const usedBytes = files.reduce((acc, file) => acc + (file.size || 0), 0);
  const totalOriginalBytes = files.reduce((acc, file) => acc + (file.originalSize || file.size || 0), 0);
  const savedBytes = Math.max(0, totalOriginalBytes - usedBytes);
  const remainingBytes = Math.max(0, totalQuota - usedBytes);
  const percentage = Math.min(100, Math.max(0, (usedBytes / totalQuota) * 100));

  const savingsPercentage = totalOriginalBytes > 0
    ? Math.round((savedBytes / totalOriginalBytes) * 100)
    : 0;

  // Live breakdown by category
  const categoriesMap: Record<VaultFile['category'], { bytes: number; count: number; color: string; label: string }> = {
    document: { bytes: 0, count: 0, color: '#38bdf8', label: 'Documents' },
    image: { bytes: 0, count: 0, color: '#34d399', label: 'Images' },
    video: { bytes: 0, count: 0, color: '#f43f5e', label: 'Videos' },
    audio: { bytes: 0, count: 0, color: '#fbbf24', label: 'Audio' },
    archive: { bytes: 0, count: 0, color: '#a855f7', label: 'Archives' },
    code: { bytes: 0, count: 0, color: '#06b6d4', label: 'Code' },
    other: { bytes: 0, count: 0, color: '#94a3b8', label: 'Other' },
  };

  for (const f of files) {
    const cat = categoriesMap[f.category] ? f.category : 'other';
    categoriesMap[cat].bytes += (f.size || 0);
    categoriesMap[cat].count += 1;
  }

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoriesMap)
    .filter(([_, data]) => data.count > 0)
    .map(([cat, data]) => ({
      category: cat as VaultFile['category'],
      label: data.label,
      bytes: data.bytes,
      formatted: formatBytes(data.bytes),
      count: data.count,
      color: data.color,
      percentage: usedBytes > 0 ? parseFloat(((data.bytes / usedBytes) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    usedBytes,
    totalBytes: totalQuota,
    remainingBytes,
    totalOriginalBytes,
    savedBytes,
    savingsPercentage,
    percentage: parseFloat(percentage.toFixed(2)),
    formattedUsed: formatBytes(usedBytes),
    formattedRemaining: formatBytes(remainingBytes),
    formattedSaved: formatBytes(savedBytes),
    formattedOriginal: formatBytes(totalOriginalBytes),
    formattedTotal: formatBytes(totalQuota, 0), // "10 GB"
    fileCount: files.length,
    categoryBreakdown,
  };
}

export function validateFileUpload(
  fileSize: number,
  currentUsedBytes: number,
  totalQuota = TOTAL_STORAGE_BYTES
): { valid: boolean; error?: string } {
  if (fileSize <= 0) {
    return { valid: false, error: 'File appears to be empty (0 bytes).' };
  }

  if (currentUsedBytes + fileSize > totalQuota) {
    const available = totalQuota - currentUsedBytes;
    return {
      valid: false,
      error: `Storage quota exceeded. You have ${formatBytes(available)} remaining of your 10 GB vault.`,
    };
  }

  return { valid: true };
}

export function getFileCategory(
  mimeType: string,
  filename: string
): VaultFile['category'] {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const type = (mimeType || '').toLowerCase();

  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (type.startsWith('video/') || ['mp4', 'mkv', 'mov', 'webm', 'avi', 'flv'].includes(ext)) {
    return 'video';
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (
    ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'html', 'css', 'go', 'rs', 'java', 'c', 'cpp', 'sh', 'sql'].includes(ext) ||
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('json')
  ) {
    return 'code';
  }
  if (
    type.includes('pdf') ||
    type.includes('word') ||
    type.includes('document') ||
    type.includes('sheet') ||
    type.includes('presentation') ||
    type.includes('text/') ||
    ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'rtf', 'md', 'csv'].includes(ext)
  ) {
    return 'document';
  }
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'tgz'].includes(ext) ||
    type.includes('zip') ||
    type.includes('compressed') ||
    type.includes('tar')
  ) {
    return 'archive';
  }

  return 'other';
}

/**
 * Generates deterministic mock SHA-256 integrity hash for display
 */
export function generateChecksum(filename: string, size: number, timestamp: number): string {
  const seed = `${filename}-${size}-${timestamp}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, '0');
  const tail = Math.abs((hash ^ 0x5a5a5a5a) * 31).toString(16).padStart(8, '0');
  return `sha256:${hexPart}${tail}e8f49b2c${hexPart.slice(0, 4)}c91f034a`;
}
