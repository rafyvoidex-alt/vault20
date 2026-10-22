import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLoginAttempt,
  unbanIpAddress,
  cleanIp,
  detectDeviceName,
  INITIAL_SECURITY_STATE,
  SecurityState,
} from './security';

test('Security Engine - detectDeviceName detects platforms', () => {
  assert.equal(detectDeviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'iPhone Mobile');
  assert.equal(detectDeviceName('Mozilla/5.0 (Linux; Android 14)'), 'Android Mobile');
  assert.equal(detectDeviceName('Mozilla/5.0 (Macintosh; Intel Mac OS X)'), 'Mac Desktop');
  assert.equal(detectDeviceName('Mozilla/5.0 (Windows NT 10.0)'), 'Windows PC');
});

test('Security Engine - cleanIp removes IPv6 prefix', () => {
  assert.equal(cleanIp('::ffff:192.168.1.1'), '192.168.1.1');
  assert.equal(cleanIp(' 10.0.0.5 '), '10.0.0.5');
  assert.equal(cleanIp(''), '127.0.0.1');
});

test('Security Engine - multi-device support: same Gmail allowed from different mobile/IP', () => {
  const email = 'rafyvoidex@gmail.com';
  const ipDevice1 = '192.168.1.100';
  const ipDevice2 = '192.168.2.200'; // Second mobile phone on cellular/different WiFi

  // Login on Device 1 (e.g. PC)
  const res1 = evaluateLoginAttempt(ipDevice1, email, INITIAL_SECURITY_STATE, 'Windows PC');
  assert.equal(res1.allowed, true);
  assert.equal(res1.isBanned, false);

  // Login on Device 2 (Mobile phone) with SAME Gmail!
  const res2 = evaluateLoginAttempt(ipDevice2, email, res1.updatedState, 'iPhone Mobile');
  assert.equal(res2.allowed, true, 'User should be able to access their data from a second mobile device using the same Gmail');
  assert.equal(res2.isBanned, false);

  // Account should now have 2 tracked authorized devices
  const devices = res2.updatedState.accountDevices[email];
  assert.equal(devices.length, 2);
  assert.equal(devices[0].ip, ipDevice1);
  assert.equal(devices[1].ip, ipDevice2);
});

test('Security Engine - 2nd DIFFERENT account on SAME IP/device triggers PERMANENT BAN', () => {
  const ip = '198.51.100.24';
  const account1 = 'rafyvoidex@gmail.com';
  const account2 = 'second_user@example.com';

  const state1 = evaluateLoginAttempt(ip, account1, INITIAL_SECURITY_STATE).updatedState;

  // Try to log in with 2nd DIFFERENT account on this IP
  const result = evaluateLoginAttempt(ip, account2, state1);
  assert.equal(result.allowed, false);
  assert.equal(result.isBanned, true);
  assert.equal(result.violationTriggered, true);
  assert.ok(result.banRecord);
  assert.equal(result.banRecord?.attemptedEmail, account2);
  assert.equal(result.banRecord?.originalEmail, account1);
});

test('Security Engine - admin unban restores access', () => {
  const ip = '198.51.100.24';
  const bannedState: SecurityState = {
    ipBindings: { [ip]: { email: 'original@example.com', boundAt: 1000, devices: [] } },
    accountDevices: {},
    bannedIps: {
      [ip]: {
        ip,
        bannedAt: 2000,
        reason: 'Violation',
        attemptedEmail: 'other@example.com',
        originalEmail: 'original@example.com',
        incidentId: 'INC-1',
      },
    },
    securityLogs: [],
  };

  const restored = unbanIpAddress(ip, bannedState);
  assert.equal(restored.bannedIps[ip], undefined);
});

test('Security Engine - normalizeSecurityState protects against missing accountDevices from legacy state', () => {
  // Legacy state without accountDevices
  const legacyState = {
    ipBindings: {
      '192.168.1.50': { email: 'mtgame835@gmail.com', boundAt: 1000, devices: [] },
    },
    bannedIps: {},
    securityLogs: [],
  } as unknown as SecurityState;

  // Running evaluateLoginAttempt with legacy state must not throw TypeError
  const res = evaluateLoginAttempt('192.168.1.50', 'mtgame835@gmail.com', legacyState);
  assert.equal(res.allowed, true);
  assert.ok(res.updatedState.accountDevices['mtgame835@gmail.com']);
  assert.equal(res.updatedState.accountDevices['mtgame835@gmail.com'].length, 1);
});

