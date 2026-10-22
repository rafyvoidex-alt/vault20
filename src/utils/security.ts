/**
 * Security Engine: Multi-Device Account Tracking & Strict 1-IP 1-Account Enforcement
 * - Same Gmail account can be accessed across multiple authorized devices/IPs
 * - Attempting to log into a SECOND/DIFFERENT account from an already bound IP/device triggers a permanent ban
 */

export interface DeviceRecord {
  deviceId: string;
  deviceName: string;
  ip: string;
  lastActive: number;
  userAgent: string;
}

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
  devices: DeviceRecord[];
}

export interface SecurityState {
  ipBindings: Record<string, IpBindingRecord>; // IP -> Primary Bound Account
  accountDevices: Record<string, DeviceRecord[]>; // Email -> All authorized devices
  bannedIps: Record<string, IpBanRecord>; // IP -> Ban Record
  securityLogs: Array<{
    id: string;
    timestamp: number;
    ip: string;
    type: 'LOGIN_SUCCESS' | 'DEVICE_CONNECTED' | 'IP_BOUND' | 'POLICY_VIOLATION' | 'PERMANENT_BAN' | 'ADMIN_UNBAN' | 'RESET';
    description: string;
  }>;
}

export const INITIAL_SECURITY_STATE: SecurityState = {
  ipBindings: {},
  accountDevices: {},
  bannedIps: {},
  securityLogs: [],
};

/**
 * Normalizes any partial or legacy SecurityState object from localStorage
 */
export function normalizeSecurityState(state?: Partial<SecurityState> | null): SecurityState {
  if (!state) return { ...INITIAL_SECURITY_STATE };
  const ipBindings = state.ipBindings ? { ...state.ipBindings } : {};
  const accountDevices = state.accountDevices ? { ...state.accountDevices } : {};
  const bannedIps = state.bannedIps ? { ...state.bannedIps } : {};
  const securityLogs = Array.isArray(state.securityLogs) ? [...state.securityLogs] : [];

  // Reconcile any existing IP bindings into accountDevices if missing
  Object.entries(ipBindings).forEach(([ip, binding]) => {
    if (binding && binding.email) {
      const email = binding.email.toLowerCase();
      if (!accountDevices[email]) {
        accountDevices[email] = Array.isArray(binding.devices) && binding.devices.length > 0
          ? [...binding.devices]
          : [
              {
                deviceId: `dev-${Math.random().toString(36).substring(2, 9)}`,
                deviceName: detectDeviceName(),
                ip,
                lastActive: binding.boundAt || Date.now(),
                userAgent: '',
              },
            ];
      }
    }
  });

  return {
    ipBindings,
    accountDevices,
    bannedIps,
    securityLogs,
  };
}

export interface AuthAttemptResult {
  allowed: boolean;
  isBanned: boolean;
  violationTriggered: boolean;
  message: string;
  banRecord?: IpBanRecord;
  updatedState: SecurityState;
  deviceRecord?: DeviceRecord;
}

export function cleanIp(ip: string): string {
  if (!ip) return '127.0.0.1';
  return ip.replace(/^::ffff:/, '').trim();
}

/**
 * Detects device platform/name from user agent
 */
export function detectDeviceName(userAgent = ''): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone Mobile';
  if (ua.includes('ipad')) return 'iPad Tablet';
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Desktop';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('linux')) return 'Linux Workstation';
  return 'Web Browser Device';
}

/**
 * Validates login attempt under strict 1-Account per IP policy.
 * - Same Gmail account can sign in from multiple devices/IPs freely
 * - Attempting to login with a different account from the same IP results in a permanent ban
 */
export function evaluateLoginAttempt(
  rawIp: string,
  rawEmail: string,
  state: SecurityState,
  userAgent = '',
  deviceId = ''
): AuthAttemptResult {
  const safeState = normalizeSecurityState(state);
  const ip = cleanIp(rawIp);
  const email = (rawEmail || '').trim().toLowerCase();
  const timestamp = Date.now();
  const devId = deviceId || `dev-${Math.random().toString(36).substring(2, 9)}`;
  const deviceName = detectDeviceName(userAgent);

  const clonedState: SecurityState = {
    ipBindings: { ...safeState.ipBindings },
    accountDevices: { ...safeState.accountDevices },
    bannedIps: { ...safeState.bannedIps },
    securityLogs: [...safeState.securityLogs],
  };

  // 1. Check if IP is permanently banned
  if (clonedState.bannedIps[ip]) {
    const ban = clonedState.bannedIps[ip];
    clonedState.securityLogs.unshift({
      id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      ip,
      type: 'POLICY_VIOLATION',
      description: `Blocked access for ${email}. IP ${ip} is permanently banned.`,
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

  // 2. Check existing IP binding
  const existingBinding = clonedState.ipBindings[ip];

  if (existingBinding) {
    if (existingBinding.email.toLowerCase() === email) {
      // Legitimate user accessing with the same Gmail account!
      const currentDevices = clonedState.accountDevices[email] || [];
      const updatedDevices = [...currentDevices];
      const existingDevIndex = updatedDevices.findIndex((d) => d.ip === ip || d.deviceId === devId);

      const deviceRecord: DeviceRecord = {
        deviceId: devId,
        deviceName,
        ip,
        lastActive: timestamp,
        userAgent,
      };

      if (existingDevIndex >= 0) {
        updatedDevices[existingDevIndex] = deviceRecord;
      } else {
        updatedDevices.push(deviceRecord);
      }

      clonedState.accountDevices[email] = updatedDevices;
      existingBinding.devices = updatedDevices;

      clonedState.securityLogs.unshift({
        id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp,
        ip,
        type: 'LOGIN_SUCCESS',
        description: `Verified login for ${email} on ${deviceName} (${ip})`,
      });

      return {
        allowed: true,
        isBanned: false,
        violationTriggered: false,
        message: 'Authentication successful. Bound account verified.',
        deviceRecord,
        updatedState: clonedState,
      };
    } else {
      // VIOLATION: A 2nd different account tried to log in from the same IP!
      const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const banRecord: IpBanRecord = {
        ip,
        bannedAt: timestamp,
        reason: 'Violation of 1-IP 1-Account policy. Second account login attempted.',
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
        description: `PERMANENT BAN: IP ${ip} attempted second account login (${email}) while bound to ${existingBinding.email}.`,
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

  // 3. New IP binding for this account (Can be a 2nd device for the same Gmail account!)
  const deviceRecord: DeviceRecord = {
    deviceId: devId,
    deviceName,
    ip,
    lastActive: timestamp,
    userAgent,
  };

  const accountExistingDevices = clonedState.accountDevices[email] || [];
  accountExistingDevices.push(deviceRecord);
  clonedState.accountDevices[email] = accountExistingDevices;

  clonedState.ipBindings[ip] = {
    email,
    boundAt: timestamp,
    devices: accountExistingDevices,
  };

  clonedState.securityLogs.unshift({
    id: `log-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    ip,
    type: accountExistingDevices.length > 1 ? 'DEVICE_CONNECTED' : 'IP_BOUND',
    description: accountExistingDevices.length > 1
      ? `New authorized device (${deviceName} @ ${ip}) linked to account: ${email}`
      : `IP ${ip} bound to primary account: ${email}`,
  });

  return {
    allowed: true,
    isBanned: false,
    violationTriggered: false,
    message: 'Account verified and device registered.',
    deviceRecord,
    updatedState: clonedState,
  };
}

/**
 * Administrative unban function
 */
export function unbanIpAddress(ip: string, state: SecurityState): SecurityState {
  const safeState = normalizeSecurityState(state);
  const targetIp = cleanIp(ip);
  const updatedBans = { ...safeState.bannedIps };
  delete updatedBans[targetIp];

  return {
    ...safeState,
    bannedIps: updatedBans,
    securityLogs: [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        ip: targetIp,
        type: 'ADMIN_UNBAN',
        description: `IP ${targetIp} unbanned by administrator.`,
      },
      ...safeState.securityLogs,
    ],
  };
}

/**
 * Resets all security records
 */
export function resetSecurityRecords(): SecurityState {
  return {
    ipBindings: {},
    accountDevices: {},
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
