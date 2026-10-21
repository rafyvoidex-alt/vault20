/**
 * High-Efficiency Compression Engine
 * Compresses data for vault storage to save maximum space,
 * and restores 100% original uncompressed data upon download.
 */

/**
 * Compresses a Uint8Array using gzip/deflate CompressionStream
 */
export async function compressBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const blob = new Blob([input as unknown as BlobPart]);
    const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    if (stream) {
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
  }

  // Fallback for environments where CompressionStream is not available (e.g. older node)
  try {
    const zlib = await import('node:zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(input, (err, result) => {
        if (err) reject(err);
        else resolve(new Uint8Array(result));
      });
    });
  } catch {
    return input;
  }
}

/**
 * Decompresses a Uint8Array back to original exact bytes
 */
export async function decompressBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const blob = new Blob([compressed as unknown as BlobPart]);
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    if (stream) {
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
  }

  try {
    const zlib = await import('node:zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressed, (err, result) => {
        if (err) reject(err);
        else resolve(new Uint8Array(result));
      });
    });
  } catch {
    return compressed;
  }
}

/**
 * Convert base64 data URL to Uint8Array
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf('base64,');
  if (base64Index !== -1) {
    const base64 = dataUrl.substring(base64Index + 7);
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
  // If plain text or svg
  const text = decodeURIComponent(dataUrl.split(',')[1] || dataUrl);
  return new TextEncoder().encode(text);
}

/**
 * Convert Uint8Array back to Data URL with original MIME type
 */
export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType || 'application/octet-stream'};base64,${base64}`;
}

/**
 * Calculates compression savings percentage
 */
export function calculateSavings(originalSize: number, compressedSize: number): {
  savedBytes: number;
  savingsPercentage: number;
} {
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercentage = originalSize > 0
    ? Math.round((savedBytes / originalSize) * 100)
    : 0;
  return { savedBytes, savingsPercentage };
}
