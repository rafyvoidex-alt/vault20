/**
 * Security Engine: Strict 1-IP 1-Account Enforcement & Permanent Ban Policy
 */

export interface IpBanRecord {
  ip: string;
  bannedAt: number;
  reason: string;
  attemptedEmail: string;
  originalEmail: string;
  incidentId: string;
}

export interface IpBindingRecord {
  email: string;
  boundAt: number;
  userAgent?: string;
}

export interface SecurityState {
  ipBindings: Record<string, IpBindingRecord>; // IP -> Primary Bound Account
  bannedIps: Record<string, IpBanRecord>;       // IP -> Ban Record
  securityLogs: Array<{
    id: string;
    timestamp: number;
    ip: string;
    type: 'LOGIN_SUCCESS' | 'IP_BOUND' | 'POLICY_VIOLATION' | 'PERMANENT_BAN' | 'ADMIN_UNBAN' | 'RESET';
    description: string;
  }>;
}

export const INITIAL_SECURITY_STATE: SecurityState = {
  ipBindings: {},
  bannedIps: {},
  securityLogs: [],
};

export interface AuthAttemptResult {
  allowed: boolean;
  isBanned: boolean;
  violationTriggered: boolean;
  message: string;
  banRecord?: IpBanRecord;
  updatedState: SecurityState;
}

export function cleanIp(ip: string): string {
  if (!ip) return '127.0.0.1';
  // Remove ipv6 prefix if present (e.g., ::ffff:192.168.1.1)
  return ip.replace(/^::ffff:/, '').trim();
}

/**
 * Validates login attempt under strict 1-IP 1-Account enforcement.
 * If 2nd account is attempted from the same IP, permanently bans the IP.
 */
export function evaluateLoginAttempt(
  rawIp: string,
  rawEmail: string,
  state: SecurityState,
  userAgent?: string
): AuthAttemptResult {
  const ip = cleanIp(rawIp);
  const email = (rawEmail || '').trim().toLowerCase();
  const timestamp = Date.now();

  const clonedState: SecurityState = {
    ipBindings: { ...state.ipBindings },
    bannedIps: { ...state.bannedIps },
    securityLogs: [...state.securityLogs],
  };

  // 1. Check if IP is already banned
  if (clonedState.bannedIps[ip]) {
    const ban = clonedState.bannedIps[ip];
    clonedState.securityLogs.unshift({
      id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      ip,
      type: 'POLICY_VIOLATION',
      description: `Blocked login attempt for ${email}. IP is permanently banned under anti-abuse rule.`,
    });

    return {
      allowed: false,
      isBanned: true,
      violationTriggered: false,
      message: `Access Denied: Your IP (${ip}) is permanently banned due to multiple account violations.`,
      banRecord: ban,
      updatedState: clonedState,
    };
  }

  // 2. Check if IP is already bound to another account
  const existingBinding = clonedState.ipBindings[ip];

  if (existingBinding) {
    if (existingBinding.email.toLowerCase() === email) {
      // Legitimate user accessing from their registered IP
      clonedState.securityLogs.unshift({
        id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        ip,
        type: 'LOGIN_SUCCESS',
        description: `Verified login for registered account: ${email}`,
      });

      return {
        allowed: true,
        isBanned: false,
        violationTriggered: false,
        message: 'Authentication successful. Bound IP verified.',
        updatedState: clonedState,
      };
    } else {
      // VIOLATION: Second account attempted from the same IP!
      const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const banRecord: IpBanRecord = {
        ip,
        bannedAt: timestamp,
        reason: 'Violation of 1-IP 1-Account strict security policy. Second account login attempted.',
        attemptedEmail: email,
        originalEmail: existingBinding.email,
        incidentId,
      };

      clonedState.bannedIps[ip] = banRecord;
      clonedState.securityLogs.unshift({
        id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        ip,
        type: 'PERMANENT_BAN',
        description: `PERMANENT BAN: IP ${ip} tried to login with ${email} while already assigned to ${existingBinding.email}.`,
      });

      return {
        allowed: false,
        isBanned: true,
        violationTriggered: true,
        message: `Security Lock: 1-IP 1-Account policy violated. IP ${ip} has been permanently banned!`,
        banRecord,
        updatedState: clonedState,
      };
    }
  }

  // 3. New IP binding for first account
  clonedState.ipBindings[ip] = {
    email,
    boundAt: timestamp,
    userAgent,
  };

  clonedState.securityLogs.unshift({
    id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    ip,
    type: 'IP_BOUND',
    description: `IP ${ip} permanently bound to initial account: ${email}`,
  });

  return {
    allowed: true,
    isBanned: false,
    violationTriggered: false,
    message: 'Account registered and IP binding established.',
    updatedState: clonedState,
  };
}

/**
 * Administrative unban function for testing/recovery
 */
export function unbanIpAddress(ip: string, state: SecurityState): SecurityState {
  const targetIp = cleanIp(ip);
  const updatedBans = { ...state.bannedIps };
  delete updatedBans[targetIp];

  return {
    ...state,
    bannedIps: updatedBans,
    securityLogs: [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        ip: targetIp,
        type: 'ADMIN_UNBAN',
        description: `IP ${targetIp} unbanned by administrator.`,
      },
      ...state.securityLogs,
    ],
  };
}

/**
 * Resets all security records
 */
export function resetSecurityRecords(): SecurityState {
  return {
    ipBindings: {},
    bannedIps: {},
    securityLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        type: 'RESET',
        description: 'Security tables cleared.',
      },
    ],
  };
}
