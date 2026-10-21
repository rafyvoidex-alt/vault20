import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compressBytes,
  decompressBytes,
  calculateSavings,
  dataUrlToBytes,
  bytesToDataUrl,
} from './compression';

test('Compression Engine - roundtrip preserves exact original content', async () => {
  const originalText = 'Hello Lifetime Cloud Vault! '.repeat(50);
  const inputBytes = new TextEncoder().encode(originalText);

  const compressed = await compressBytes(inputBytes);
  assert.ok(compressed.length > 0);
  assert.ok(compressed.length < inputBytes.length, 'Compressed size should be smaller than repetitive input');

  const decompressed = await decompressBytes(compressed);
  const restoredText = new TextDecoder().decode(decompressed);

  assert.equal(restoredText, originalText);
});

test('Compression Engine - calculateSavings computes percentage accurately', () => {
  const { savedBytes, savingsPercentage } = calculateSavings(1000, 400);
  assert.equal(savedBytes, 600);
  assert.equal(savingsPercentage, 60);

  const zeroSavings = calculateSavings(500, 500);
  assert.equal(zeroSavings.savedBytes, 0);
  assert.equal(zeroSavings.savingsPercentage, 0);
});

test('Compression Engine - dataUrl roundtrip conversions', () => {
  const original = 'Test Data 12345';
  const encoded = `data:text/plain;base64,${btoa(original)}`;
  const bytes = dataUrlToBytes(encoded);
  const restoredUrl = bytesToDataUrl(bytes, 'text/plain');
  const restoredBytes = dataUrlToBytes(restoredUrl);

  assert.equal(new TextDecoder().decode(restoredBytes), original);
});
