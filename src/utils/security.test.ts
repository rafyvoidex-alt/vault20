import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLoginAttempt,
  unbanIpAddress,
  cleanIp,
  INITIAL_SECURITY_STATE,
  SecurityState,
} from './security';

test('Security Engine - cleanIp removes IPv6 prefix', () => {
  assert.equal(cleanIp('::ffff:192.168.1.1'), '192.168.1.1');
  assert.equal(cleanIp(' 10.0.0.5 '), '10.0.0.5');
  assert.equal(cleanIp(''), '127.0.0.1');
});

test('Security Engine - initial login binds IP to first account', () => {
  const ip = '198.51.100.24';
  const email = 'user1@example.com';
  const result = evaluateLoginAttempt(ip, email, INITIAL_SECURITY_STATE);

  assert.equal(result.allowed, true);
  assert.equal(result.isBanned, false);
  assert.equal(result.violationTriggered, false);
  assert.ok(result.updatedState.ipBindings[ip]);
  assert.equal(result.updatedState.ipBindings[ip].email, email);
});

test('Security Engine - same account logging in from bound IP is allowed', () => {
  const ip = '198.51.100.24';
  const email = 'user1@example.com';
  const state1 = evaluateLoginAttempt(ip, email, INITIAL_SECURITY_STATE).updatedState;

  // Attempt login again with same account (different casing)
  const result = evaluateLoginAttempt(ip, 'USER1@example.com', state1);
  assert.equal(result.allowed, true);
  assert.equal(result.isBanned, false);
  assert.equal(result.violationTriggered, false);
});

test('Security Engine - 2nd account from SAME IP triggers PERMANENT BAN', () => {
  const ip = '198.51.100.24';
  const account1 = 'user1@example.com';
  const account2 = 'second_user@example.com';

  const state1 = evaluateLoginAttempt(ip, account1, INITIAL_SECURITY_STATE).updatedState;

  // Try to log in with 2nd account
  const result = evaluateLoginAttempt(ip, account2, state1);
  assert.equal(result.allowed, false);
  assert.equal(result.isBanned, true);
  assert.equal(result.violationTriggered, true);
  assert.ok(result.banRecord);
  assert.equal(result.banRecord?.ip, ip);
  assert.equal(result.banRecord?.attemptedEmail, account2);
  assert.equal(result.banRecord?.originalEmail, account1);
  assert.ok(result.updatedState.bannedIps[ip]);

  // Any subsequent attempt on this IP is permanently rejected
  const subsequentResult = evaluateLoginAttempt(ip, account1, result.updatedState);
  assert.equal(subsequentResult.allowed, false);
  assert.equal(subsequentResult.isBanned, true);
});

test('Security Engine - admin unban restores access', () => {
  const ip = '198.51.100.24';
  const bannedState: SecurityState = {
    ipBindings: { [ip]: { email: 'original@example.com', boundAt: 1000 } },
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
