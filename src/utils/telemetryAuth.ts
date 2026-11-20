import type { User } from 'firebase/auth';

export const ALLOWED_ADMIN_GITHUB_USERNAMES = [
  'honeypie3301',
  'cocoy',
];

export const ALLOWED_ADMIN_EMAILS = [
  '84184414+honeypie3301@users.noreply.github.com',
];

// Salted double-SHA-256 hashes for clearance verification (never plaintext or raw single-pass hashes)
export const VALID_KEY_HASHES = [
  'b26041b24d9653e1bb0cd9f67f4609861959aaa88690b22641807f06299e7679',
  '958e324d0375ff31bcd71aa6d4742d5e562684d91a12e5e3441c6efaeb4e9453',
];

const ADMIN_TOKEN_KEY = 'wiki_admin_token';
const AUTH_HINT_KEY = 'wiki_telemetry_unlocked_v1';
const WINDOW_NAME_TOKEN_FIELD = '__bwAdminToken';
const TELEMETRY_AUTH_EVENT = 'bw:telemetry-auth-changed';

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeClearanceHash(key: string): Promise<string> {
  const inner = await sha256(`${key}::bw_salt_3301`);
  return sha256(`bw_clearance_v2::${inner}`);
}

export async function computeStaticSessionProof(clearanceHash: string): Promise<string> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const digest = await sha256(`bw_session_v2::${clearanceHash}::${ua}`);
  return `static_v2.${digest}`;
}

function readWindowNameToken(): string | null {
  try {
    if (typeof window === 'undefined' || !window.name) return null;
    if (window.name.trim().startsWith('{')) {
      const parsed = JSON.parse(window.name);
      if (parsed && typeof parsed[WINDOW_NAME_TOKEN_FIELD] === 'string' && parsed[WINDOW_NAME_TOKEN_FIELD]) {
        return parsed[WINDOW_NAME_TOKEN_FIELD];
      }
    }
  } catch {}
  return null;
}

function writeWindowNameToken(token: string | null) {
  try {
    if (typeof window === 'undefined') return;
    const current = window.name || '';
    let obj: Record<string, unknown> = {};
    if (current.trim().startsWith('{')) {
      try {
        obj = JSON.parse(current) || {};
      } catch {
        obj = {};
      }
    }
    if (token) {
      obj[WINDOW_NAME_TOKEN_FIELD] = token;
    } else {
      delete obj[WINDOW_NAME_TOKEN_FIELD];
    }
    window.name = JSON.stringify(obj);
  } catch {}
}

function readCookieToken(): string | null {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_TOKEN_KEY}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function getPersistedAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (fromLocal) return fromLocal;
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (fromSession) return fromSession;
  } catch {}
  const fromWin = readWindowNameToken();
  if (fromWin) return fromWin;
  const fromCookie = readCookieToken();
  if (fromCookie) return fromCookie;
  return null;
}

export function hasPersistedTelemetryUnlockHint(): boolean {
  if (typeof window === 'undefined') return false;
  const tok = getPersistedAdminToken();
  if (tok && !tok.startsWith('static_authorized_')) return true;
  try {
    return localStorage.getItem(AUTH_HINT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistTelemetryHint(unlocked: boolean) {
  try {
    if (unlocked) {
      localStorage.setItem(AUTH_HINT_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_HINT_KEY);
    }
  } catch {}
}

export function persistAdminToken(token: string) {
  if (!token) return;
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
  try { sessionStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
  writeWindowNameToken(token);
  try {
    document.cookie = `${ADMIN_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=15552000; SameSite=Lax`;
  } catch {}
  persistTelemetryHint(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TELEMETRY_AUTH_EVENT, { detail: { token } }));
  }
}

export function clearPersistedAdminToken() {
  try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
  try { sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
  writeWindowNameToken(null);
  try {
    document.cookie = `${ADMIN_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
  persistTelemetryHint(false);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TELEMETRY_AUTH_EVENT, { detail: { token: null } }));
  }
}

export function subscribeTelemetryTokenChanges(cb: (token: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleCustom = (e: Event) => {
    const custom = e as CustomEvent<{ token?: string | null }>;
    cb(custom.detail?.token ?? getPersistedAdminToken());
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_TOKEN_KEY) {
      cb(e.newValue);
    }
  };
  window.addEventListener(TELEMETRY_AUTH_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(TELEMETRY_AUTH_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

export function isAuthorizedFirebaseUser(user: User | null): boolean {
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  const githubUsernames: string[] = [];
  user.providerData.forEach((profile) => {
    if (profile.providerId === 'github.com') {
      if (profile.displayName) githubUsernames.push(profile.displayName.toLowerCase());
      const rawAny = profile as unknown as { screenName?: string };
      if (rawAny.screenName) githubUsernames.push(String(rawAny.screenName).toLowerCase());
      if (profile.email) githubUsernames.push(profile.email.toLowerCase());
    }
  });

  const isAllowedEmail = ALLOWED_ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === email);
  const isAllowedUsername = ALLOWED_ADMIN_GITHUB_USERNAMES.some(
    (allowed) =>
      githubUsernames.includes(allowed.toLowerCase()) ||
      user.displayName?.toLowerCase() === allowed.toLowerCase()
  );

  return isAllowedEmail || isAllowedUsername;
}

export async function validatePersistedAdminToken(
  token: string | null
): Promise<{ valid: boolean; definitive: boolean }> {
  if (!token) return { valid: false, definitive: true };
  if (token.startsWith('static_authorized_')) {
    return { valid: false, definitive: true };
  }
  if (token.startsWith('static_v2.')) {
    try {
      const expectedProofs = await Promise.all(VALID_KEY_HASHES.map(computeStaticSessionProof));
      return { valid: expectedProofs.includes(token), definitive: true };
    } catch {
      return { valid: false, definitive: false };
    }
  }

  try {
    const res = await fetch('/api/telemetry/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 401) {
      return { valid: false, definitive: true };
    }
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return { valid: Boolean(data?.valid), definitive: true };
    }
    return { valid: false, definitive: false };
  } catch {
    return { valid: false, definitive: false };
  }
}
