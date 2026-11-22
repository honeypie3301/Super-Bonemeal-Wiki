import { useState, useEffect } from 'react';
import type { Firestore } from 'firebase/firestore';
import { hasConfig, firebaseConfigDetails } from '../lib/firebaseConfig';
import { detectClientEnvironment } from './deviceInfo';
import { CursorStyleId, normalizeCursorStyle } from '../components/special/MacOsCursorSvg';
import {
  PointerBlockAnchor,
  SelectionAnchor,
  sanitizePointerAnchor,
  sanitizeSelectionAnchor,
} from './domAnchor';

export type { PointerBlockAnchor, SelectionAnchor };

export interface CursorsGlobalConfig {
  enabled: boolean;
  showClickRipples: boolean;
  showTrails: boolean;
  cursorSize: number;
  updatedBy: string;
  updatedAt: number;
}

export interface SelectionRect {
  dx: number;
  y: number;
  w: number;
  h: number;
}

export interface RemoteCursorData {
  sessionId: string;
  visitorId: string;
  color: string;
  os: string;
  browser: string;
  deviceType: string;
  slug: string;
  dx: number;
  y: number;
  mw: number;
  clicking: boolean;
  clickSeq: number;
  variant?: 'default' | 'pointer' | 'text';
  cursorStyle?: CursorStyleId;
  drawingTrail?: boolean;
  trailColor?: string;
  ap?: string;
  ax?: number;
  ay?: number;
  selRects?: SelectionRect[];
  selText?: string;
  selAnchor?: SelectionAnchor;
  ts: number;
  active: boolean;
  leaving?: boolean;
}

export interface TransportStatus {
  wsConnected: boolean;
  firestoreConnected: boolean;
  broadcastConnected: boolean;
}

export const DEFAULT_CURSORS_CONFIG: CursorsGlobalConfig = {
  enabled: true,
  showClickRipples: true,
  showTrails: true,
  cursorSize: 16.5,
  updatedBy: 'SYSTEM',
  updatedAt: 0,
};

const CURSOR_PALETTE = [
  '#34d399', // emerald
  '#38bdf8', // sky
  '#fbbf24', // amber
  '#f472b6', // pink
  '#a78bfa', // violet
  '#fb7185', // rose
  '#2dd4bf', // teal
  '#fb923c', // orange
];

const LOCAL_HIDE_STORAGE_KEY = 'wiki_cursors_local_hide';
const LOCAL_STYLE_STORAGE_KEY = 'wiki_cursor_style_v1';
const LOCAL_TRAIL_COLOR_KEY = 'wiki_cursor_trail_color_v1';
const LOCAL_STEALTH_STORAGE_KEY = 'wiki_cursor_stealth_v1';
const CONFIG_CACHE_KEY = 'wiki_cursors_config_cache';
const HEARTBEAT_INTERVAL_MS = 7000;
const STALE_CURSOR_MS = 22000;
const LEAVE_FADEOUT_MS = 340;

export function isValidHexColor(val: unknown): val is string {
  return typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim());
}

export function getVisitorColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CURSOR_PALETTE[hash % CURSOR_PALETTE.length];
}

const cachedVisitorId: string = (() => {
  if (typeof window === 'undefined') return 'surv_server';
  let vid = localStorage.getItem('wiki_visitor_id');
  if (!vid) {
    vid = 'surv_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('wiki_visitor_id', vid);
  }
  return vid;
})();

const cachedShortVisitorId = cachedVisitorId.substring(0, 12);
const cachedColor = getVisitorColor(cachedShortVisitorId);
const cachedClientEnv = detectClientEnvironment();
const cachedIsDesktop = (() => {
  if (typeof window === 'undefined') return false;
  if (cachedClientEnv.deviceType !== 'Desktop') return false;
  if (typeof window.matchMedia === 'function') {
    return (
      window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(any-pointer: fine)').matches
    );
  }
  return true;
})();

export function getLocalVisitorId(): string {
  return cachedVisitorId;
}

export function getLocalVisitorColor(): string {
  return cachedColor;
}

function createSessionId(): string {
  return 'c_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).slice(-4);
}

export const LOCAL_SESSION_ID = createSessionId();

export function isDesktopPointerCapable(): boolean {
  return cachedIsDesktop;
}

const WIKI_ROOM_PREFIX = 'super_bonemeal';

function sanitizeSlug(slug: string): string {
  return (slug || 'home').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
}

function getRoomDocId(slug: string): string {
  return `cursors_room_${WIKI_ROOM_PREFIX}_${sanitizeSlug(slug)}`;
}

type FirestoreCursorModule = {
  db: Firestore;
  collection: typeof import('firebase/firestore').collection;
  doc: typeof import('firebase/firestore').doc;
  onSnapshot: typeof import('firebase/firestore').onSnapshot;
  setDoc: typeof import('firebase/firestore').setDoc;
  updateDoc: typeof import('firebase/firestore').updateDoc;
};

let firestoreCursorMod: FirestoreCursorModule | null = null;
let firestoreCursorPromise: Promise<FirestoreCursorModule | null> | null = null;

function ensureFirestoreCursorModule(): Promise<FirestoreCursorModule | null> {
  if (!hasConfig) return Promise.resolve(null);
  if (firestoreCursorMod) return Promise.resolve(firestoreCursorMod);
  if (!firestoreCursorPromise) {
    firestoreCursorPromise = Promise.all([
      import('../lib/firebaseDb').then((m) => m.getFirebaseDb()),
      import('firebase/firestore'),
    ])
      .then(([db, fs]) => {
        if (!db) return null;
        firestoreCursorMod = {
          db,
          collection: fs.collection,
          doc: fs.doc,
          onSnapshot: fs.onSnapshot,
          setDoc: fs.setDoc,
          updateDoc: fs.updateDoc,
        };
        return firestoreCursorMod;
      })
      .catch(() => null);
  }
  return firestoreCursorPromise;
}

// Singleton live state
let currentConfig: CursorsGlobalConfig = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed?.enabled === 'boolean') {
          const cachedSize = typeof parsed?.updatedAt === 'number' && parsed.updatedAt > 0 && typeof parsed?.cursorSize === 'number' && Number.isFinite(parsed.cursorSize)
            ? Math.max(5, Math.min(42, Math.round(parsed.cursorSize * 10) / 10))
            : DEFAULT_CURSORS_CONFIG.cursorSize;
          return { ...DEFAULT_CURSORS_CONFIG, ...parsed, cursorSize: cachedSize };
        }
      }
    } catch {}
  }
  return { ...DEFAULT_CURSORS_CONFIG };
})();

function readWindowNameCursorStyle(): string | null {
  try {
    if (typeof window === 'undefined' || !window.name) return null;
    if (window.name.trim().startsWith('{')) {
      const parsed = JSON.parse(window.name);
      if (parsed && typeof parsed.__bwCursorStyle === 'string') return parsed.__bwCursorStyle;
    }
    const match = window.name.match(/__bwCursorStyle=([a-z0-9-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function writeWindowNameCursorStyle(style: CursorStyleId) {
  try {
    if (typeof window === 'undefined') return;
    const current = window.name || '';
    if (!current || current.trim().startsWith('{')) {
      let obj: Record<string, unknown> = {};
      if (current.trim().startsWith('{')) {
        try { obj = JSON.parse(current) || {}; } catch { obj = {}; }
      }
      obj.__bwCursorStyle = style;
      window.name = JSON.stringify(obj);
      return;
    }
    const cleaned = current.replace(/\|?__bwCursorStyle=[a-z0-9-]+/g, '');
    window.name = cleaned ? `${cleaned}|__bwCursorStyle=${style}` : `__bwCursorStyle=${style}`;
  } catch {}
}

function readCookieCursorStyle(): string | null {
  try {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCAL_STYLE_STORAGE_KEY}=([a-z0-9-]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function readPersistedCursorStyle(): CursorStyleId {
  if (typeof window === 'undefined') return 'macos';
  try {
    const fromLocal = localStorage.getItem(LOCAL_STYLE_STORAGE_KEY);
    if (fromLocal) return normalizeCursorStyle(fromLocal);
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(LOCAL_STYLE_STORAGE_KEY);
    if (fromSession) return normalizeCursorStyle(fromSession);
  } catch {}
  const fromWin = readWindowNameCursorStyle();
  if (fromWin) return normalizeCursorStyle(fromWin);
  const fromCookie = readCookieCursorStyle();
  if (fromCookie) return normalizeCursorStyle(fromCookie);
  return 'macos';
}

function persistCursorStyle(style: CursorStyleId) {
  try { localStorage.setItem(LOCAL_STYLE_STORAGE_KEY, style); } catch {}
  try { sessionStorage.setItem(LOCAL_STYLE_STORAGE_KEY, style); } catch {}
  writeWindowNameCursorStyle(style);
  try {
    document.cookie = `${LOCAL_STYLE_STORAGE_KEY}=${style}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function readWindowNameField(field: '__bwCursorStyle' | '__bwTrailColor' | '__bwStealthMode'): string | null {
  try {
    if (typeof window === 'undefined' || !window.name) return null;
    if (window.name.trim().startsWith('{')) {
      const parsed = JSON.parse(window.name);
      if (parsed && typeof parsed[field] === 'string') return parsed[field];
    }
    const match = window.name.match(new RegExp(`${field}=([^|\\s]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function writeWindowNameField(field: '__bwCursorStyle' | '__bwTrailColor' | '__bwStealthMode', value: string) {
  try {
    if (typeof window === 'undefined') return;
    const current = window.name || '';
    if (!current || current.trim().startsWith('{')) {
      let obj: Record<string, unknown> = {};
      if (current.trim().startsWith('{')) {
        try { obj = JSON.parse(current) || {}; } catch { obj = {}; }
      }
      obj[field] = value;
      window.name = JSON.stringify(obj);
      return;
    }
    const cleaned = current.replace(new RegExp(`\\|?${field}=[^|]+`, 'g'), '');
    window.name = cleaned ? `${cleaned}|${field}=${value}` : `${field}=${value}`;
  } catch {}
}

function readPersistedStealth(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const fromLocal = localStorage.getItem(LOCAL_STEALTH_STORAGE_KEY);
    if (fromLocal === 'true') return true;
    if (fromLocal === 'false') return false;
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(LOCAL_STEALTH_STORAGE_KEY);
    if (fromSession === 'true') return true;
    if (fromSession === 'false') return false;
  } catch {}
  const fromWin = readWindowNameField('__bwStealthMode');
  if (fromWin === 'true') return true;
  if (fromWin === 'false') return false;
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCAL_STEALTH_STORAGE_KEY}=(true|false)`));
      if (m) return m[1] === 'true';
    }
  } catch {}
  return false;
}

function persistStealth(stealth: boolean) {
  const val = stealth ? 'true' : 'false';
  try { localStorage.setItem(LOCAL_STEALTH_STORAGE_KEY, val); } catch {}
  try { sessionStorage.setItem(LOCAL_STEALTH_STORAGE_KEY, val); } catch {}
  writeWindowNameField('__bwStealthMode', val);
  try {
    document.cookie = `${LOCAL_STEALTH_STORAGE_KEY}=${val}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function readPersistedTrailColor(): string {
  if (typeof window === 'undefined') return cachedColor;
  try {
    const fromLocal = localStorage.getItem(LOCAL_TRAIL_COLOR_KEY);
    if (isValidHexColor(fromLocal)) return fromLocal.toLowerCase();
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(LOCAL_TRAIL_COLOR_KEY);
    if (isValidHexColor(fromSession)) return fromSession.toLowerCase();
  } catch {}
  const fromWin = readWindowNameField('__bwTrailColor');
  if (isValidHexColor(fromWin)) return fromWin.toLowerCase();
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCAL_TRAIL_COLOR_KEY}=(#[0-9a-fA-F]{6})`));
      if (m && isValidHexColor(m[1])) return m[1].toLowerCase();
    }
  } catch {}
  return cachedColor;
}

function persistTrailColor(color: string) {
  const normalized = isValidHexColor(color) ? color.toLowerCase() : cachedColor;
  try { localStorage.setItem(LOCAL_TRAIL_COLOR_KEY, normalized); } catch {}
  try { sessionStorage.setItem(LOCAL_TRAIL_COLOR_KEY, normalized); } catch {}
  writeWindowNameField('__bwTrailColor', normalized);
  try {
    document.cookie = `${LOCAL_TRAIL_COLOR_KEY}=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

let localHide = (() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(LOCAL_HIDE_STORAGE_KEY) === 'true';
  }
  return false;
})();

let localCursorStyle: CursorStyleId = readPersistedCursorStyle();
let localTrailColor: string = readPersistedTrailColor();

let activeSlug = 'home';
const remoteCursors = new Map<string, RemoteCursorData>();
const globalPeers = new Map<string, RemoteCursorData>();
let telemetryWatcherCount = 0;
let unsubscribeGlobalRoomsSnap: (() => void) | null = null;
let followedSessionId: string | null = null;
let stealthInspection = readPersistedStealth();
let transportStatus: TransportStatus = {
  wsConnected: false,
  firestoreConnected: false,
  broadcastConnected: false,
};

let ws: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wsProbed: boolean | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let unsubscribeConfigSnap: (() => void) | null = null;
let unsubscribeRoomSnap: (() => void) | null = null;
let staleSweepTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isEngineStarted = false;

let lastLocalCursor: {
  dx: number;
  y: number;
  mw: number;
  clicking: boolean;
  clickSeq: number;
  variant: 'default' | 'pointer' | 'text';
  drawingTrail: boolean;
  ap?: string;
  ax?: number;
  ay?: number;
  selRects: SelectionRect[];
  selText: string;
  selAnchor?: SelectionAnchor;
  ts: number;
} | null = null;
let localSelectionRects: SelectionRect[] = [];
let localSelectionText = '';
let localSelectionAnchor: SelectionAnchor | undefined = undefined;
let lastWsSentAt = 0;
let wsThrottleTimer: ReturnType<typeof setTimeout> | null = null;
let lastFirestoreSentAt = 0;
let firestoreThrottleTimer: ReturnType<typeof setTimeout> | null = null;

// Listeners
const configListeners = new Set<(cfg: CursorsGlobalConfig) => void>();
const localHideListeners = new Set<(hidden: boolean) => void>();
const localStyleListeners = new Set<(style: CursorStyleId) => void>();
const localTrailColorListeners = new Set<(color: string) => void>();
const rosterListeners = new Set<(list: RemoteCursorData[]) => void>();
const frameListeners = new Set<() => void>();
const transportListeners = new Set<(status: TransportStatus) => void>();
const globalPresenceListeners = new Set<() => void>();
const followListeners = new Set<(sessionId: string | null) => void>();
const stealthListeners = new Set<(stealth: boolean) => void>();

function notifyConfigListeners() {
  configListeners.forEach((cb) => {
    try { cb(currentConfig); } catch {}
  });
}

function notifyLocalHideListeners() {
  localHideListeners.forEach((cb) => {
    try { cb(localHide); } catch {}
  });
}

function notifyLocalStyleListeners() {
  localStyleListeners.forEach((cb) => {
    try { cb(localCursorStyle); } catch {}
  });
}

function notifyLocalTrailColorListeners() {
  localTrailColorListeners.forEach((cb) => {
    try { cb(localTrailColor); } catch {}
  });
}

function notifyStealthListeners() {
  stealthListeners.forEach((cb) => {
    try { cb(stealthInspection); } catch {}
  });
}

function notifyTransportListeners() {
  const snapshot = { ...transportStatus };
  transportListeners.forEach((cb) => {
    try { cb(snapshot); } catch {}
  });
}

let rosterThrottleTimer: ReturnType<typeof setTimeout> | null = null;
function notifyRosterListeners(immediate = false) {
  const emit = () => {
    const list = Array.from(remoteCursors.values()).sort((a, b) => b.ts - a.ts);
    rosterListeners.forEach((cb) => {
      try { cb(list); } catch {}
    });
  };
  if (immediate) {
    if (rosterThrottleTimer) {
      clearTimeout(rosterThrottleTimer);
      rosterThrottleTimer = null;
    }
    emit();
    return;
  }
  if (!rosterThrottleTimer) {
    rosterThrottleTimer = setTimeout(() => {
      rosterThrottleTimer = null;
      emit();
    }, 250);
  }
}

let globalPresenceThrottleTimer: ReturnType<typeof setTimeout> | null = null;
function notifyGlobalPresenceListeners(immediate = false) {
  const emit = () => {
    globalPresenceListeners.forEach((cb) => {
      try { cb(); } catch {}
    });
  };
  if (immediate) {
    if (globalPresenceThrottleTimer) {
      clearTimeout(globalPresenceThrottleTimer);
      globalPresenceThrottleTimer = null;
    }
    emit();
    return;
  }
  if (!globalPresenceThrottleTimer) {
    globalPresenceThrottleTimer = setTimeout(() => {
      globalPresenceThrottleTimer = null;
      emit();
    }, 250);
  }
}

function upsertGlobalPeer(c: RemoteCursorData) {
  if (!telemetryWatcherCount || !c || c.sessionId === LOCAL_SESSION_ID) return;
  const now = Date.now();
  if (!c.active || now - c.ts > STALE_CURSOR_MS) {
    if (globalPeers.delete(c.sessionId)) {
      notifyGlobalPresenceListeners(true);
    }
    return;
  }
  const prev = globalPeers.get(c.sessionId);
  const resolvedStyle = normalizeCursorStyle(c.cursorStyle);
  const changed =
    !prev ||
    prev.slug !== c.slug ||
    prev.selText !== c.selText ||
    normalizeCursorStyle(prev.cursorStyle) !== resolvedStyle ||
    Math.abs(prev.y - c.y) > 4;
  globalPeers.set(c.sessionId, {
    ...c,
    cursorStyle: resolvedStyle,
    leaving: false,
    color: c.color || getVisitorColor(c.visitorId || c.sessionId),
  });
  notifyGlobalPresenceListeners(changed);
}

function removeGlobalPeer(sessionId: string) {
  if (!telemetryWatcherCount) return;
  if (globalPeers.delete(sessionId)) {
    notifyGlobalPresenceListeners(true);
  }
}

function notifyFrameListeners() {
  frameListeners.forEach((cb) => {
    try { cb(); } catch {}
  });
}

function applyConfigLocally(incoming: Partial<CursorsGlobalConfig>, relayToBroadcast = true) {
  if (
    typeof incoming.updatedAt === 'number' &&
    incoming.updatedAt > 0 &&
    currentConfig.updatedAt > 0 &&
    incoming.updatedAt < currentConfig.updatedAt
  ) {
    return;
  }

  const rawSize = incoming.cursorSize;
  const clampedSize = typeof rawSize === 'number' && Number.isFinite(rawSize)
    ? Math.max(5, Math.min(42, Math.round(rawSize * 10) / 10))
    : currentConfig.cursorSize;

  currentConfig = {
    ...currentConfig,
    ...incoming,
    cursorSize: clampedSize,
  };

  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(currentConfig));
  } catch {}

  if (!currentConfig.enabled) {
    remoteCursors.clear();
    notifyRosterListeners(true);
    notifyFrameListeners();
  }

  notifyConfigListeners();

  if (relayToBroadcast && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'cursors:config', config: currentConfig, origin: LOCAL_SESSION_ID });
    } catch {}
  }
}

const leaveCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearLeaveTimer(sessionId: string) {
  const t = leaveCleanupTimers.get(sessionId);
  if (t) {
    clearTimeout(t);
    leaveCleanupTimers.delete(sessionId);
  }
}

function scheduleCursorFadeOut(sessionId: string) {
  const existing = remoteCursors.get(sessionId);
  if (!existing) return;
  if (existing.leaving) return;
  remoteCursors.set(sessionId, { ...existing, active: false, leaving: true });
  notifyFrameListeners();
  notifyRosterListeners(true);
  clearLeaveTimer(sessionId);
  const timer = setTimeout(() => {
    leaveCleanupTimers.delete(sessionId);
    const cur = remoteCursors.get(sessionId);
    if (cur?.leaving) {
      remoteCursors.delete(sessionId);
      notifyFrameListeners();
      notifyRosterListeners(true);
    }
  }, LEAVE_FADEOUT_MS);
  leaveCleanupTimers.set(sessionId, timer);
}

function ingestRemoteCursor(incoming: RemoteCursorData, source: 'ws' | 'firestore' | 'bc') {
  if (!incoming || incoming.sessionId === LOCAL_SESSION_ID) return;
  if (telemetryWatcherCount) {
    upsertGlobalPeer(incoming);
  }
  if (incoming.slug !== activeSlug) return;

  if (!incoming.active || Date.now() - incoming.ts > STALE_CURSOR_MS) {
    scheduleCursorFadeOut(incoming.sessionId);
    return;
  }

  clearLeaveTimer(incoming.sessionId);

  const existing = remoteCursors.get(incoming.sessionId);
  // Prevent older Firestore snapshots from overwriting fresher WebSocket packets
  if (existing && source === 'firestore' && existing.ts > incoming.ts + 25) {
    return;
  }

  const incomingRects = Array.isArray(incoming.selRects) ? incoming.selRects : [];
  const incomingSelText = typeof incoming.selText === 'string' ? incoming.selText : '';
  const incomingSelAnchor = sanitizeSelectionAnchor(incoming.selAnchor);
  const incomingPointerAnchor = sanitizePointerAnchor({
    ap: incoming.ap,
    ax: incoming.ax,
    ay: incoming.ay,
  });
  const prevRects = existing?.selRects || [];
  const prevSelText = existing?.selText || '';
  const prevSelAnchor = existing?.selAnchor;
  const selChanged =
    prevSelText !== incomingSelText ||
    prevSelAnchor?.ap !== incomingSelAnchor?.ap ||
    prevSelAnchor?.so !== incomingSelAnchor?.so ||
    prevSelAnchor?.eo !== incomingSelAnchor?.eo ||
    prevRects.length !== incomingRects.length ||
    prevRects.some((r, idx) => {
      const n = incomingRects[idx];
      return !n || Math.abs(r.dx - n.dx) > 0.5 || Math.abs(r.y - n.y) > 0.5 || Math.abs(r.w - n.w) > 0.5 || Math.abs(r.h - n.h) > 0.5;
    });

  const resolvedStyle = normalizeCursorStyle(incoming.cursorStyle);
  const normalized: RemoteCursorData = {
    ...incoming,
    cursorStyle: resolvedStyle,
    ...(incomingPointerAnchor ? incomingPointerAnchor : { ap: undefined, ax: undefined, ay: undefined }),
    selRects: incomingRects,
    selText: incomingSelText,
    ...(incomingSelAnchor ? { selAnchor: incomingSelAnchor } : { selAnchor: undefined }),
    leaving: false,
    color: incoming.color || getVisitorColor(incoming.visitorId || incoming.sessionId),
  };

  const structuralChange =
    !existing ||
    existing.leaving ||
    existing.clicking !== normalized.clicking ||
    existing.clickSeq !== normalized.clickSeq ||
    normalizeCursorStyle(existing.cursorStyle) !== resolvedStyle ||
    selChanged;
  remoteCursors.set(incoming.sessionId, normalized);
  notifyFrameListeners();
  notifyRosterListeners(structuralChange);
}

function removeRemoteCursor(sessionId: string, slug?: string) {
  if (telemetryWatcherCount) {
    removeGlobalPeer(sessionId);
  }
  if (slug && slug !== activeSlug) return;
  scheduleCursorFadeOut(sessionId);
}

function setupBroadcastChannel() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window) || broadcastChannel) return;
  try {
    broadcastChannel = new BroadcastChannel('backwoods_live_cursors_bus');
    transportStatus.broadcastConnected = true;
    notifyTransportListeners();

    broadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object' || msg.origin === LOCAL_SESSION_ID) return;

      if (msg.type === 'cursors:config' && msg.config) {
        applyConfigLocally(msg.config, false);
      } else if (msg.type === 'cursor:update' && msg.cursor) {
        ingestRemoteCursor(msg.cursor as RemoteCursorData, 'bc');
      } else if (msg.type === 'cursor:leave' && msg.sessionId) {
        removeRemoteCursor(String(msg.sessionId), msg.slug);
      }
    };
  } catch {
    transportStatus.broadcastConnected = false;
  }
}

const CLOUDFLARE_WS_HOST = 'backwoods-wiki.minecraft-mod.workers.dev';

async function probeAndConnectWebSocket() {
  if (typeof window === 'undefined') return;
  if (wsProbed === false) return;

  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const targetHost = isLocalHost ? window.location.host : CLOUDFLARE_WS_HOST;
  const probeUrl = isLocalHost ? '/api/cursors/probe' : `https://${CLOUDFLARE_WS_HOST}/api/cursors/probe`;

  if (wsProbed === null) {
    try {
      const res = await fetch(probeUrl, { method: 'GET', cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('application/json')) {
        wsProbed = false;
        return;
      }
      const data = await res.json() as { ws?: boolean };
      if (!data?.ws) {
        wsProbed = false;
        return;
      }
      wsProbed = true;
    } catch {
      wsProbed = false;
      return;
    }
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const protocol = (window.location.protocol === 'https:' || !isLocalHost) ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${targetHost}/ws/cursors?wiki=super-bonemeal`);
    ws = socket;

    socket.onopen = () => {
      transportStatus.wsConnected = true;
      notifyTransportListeners();
      socket.send(
        JSON.stringify({
          type: 'cursor:subscribe',
          sessionId: LOCAL_SESSION_ID,
          slug: activeSlug,
        })
      );
      if (telemetryWatcherCount > 0) {
        socket.send(JSON.stringify({ type: 'cursor:subscribe_all', enabled: true }));
      }
      if (lastLocalCursor && currentConfig.enabled && !localHide && isDesktopPointerCapable()) {
        socket.send(
          JSON.stringify({
            type: 'cursor:update',
            cursor: buildLocalPayload(lastLocalCursor, true),
          })
        );
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'cursors:config' && msg.config) {
          applyConfigLocally(msg.config, true);
        } else if (msg.type === 'cursor:init' && Array.isArray(msg.cursors)) {
          if (msg.slug === activeSlug) {
            for (const c of msg.cursors) {
              ingestRemoteCursor(c as RemoteCursorData, 'ws');
            }
          }
        } else if (msg.type === 'cursor:update' && msg.cursor) {
          ingestRemoteCursor(msg.cursor as RemoteCursorData, 'ws');
        } else if (msg.type === 'cursor:leave' && msg.sessionId) {
          removeRemoteCursor(String(msg.sessionId), msg.slug);
        } else if (msg.type === 'cursor:presence_snapshot' && Array.isArray(msg.cursors)) {
          if (telemetryWatcherCount > 0) {
            globalPeers.clear();
            for (const c of msg.cursors) {
              upsertGlobalPeer(c as RemoteCursorData);
            }
            notifyGlobalPresenceListeners(true);
          }
        } else if (msg.type === 'cursor:presence_update' && msg.cursor) {
          upsertGlobalPeer(msg.cursor as RemoteCursorData);
        } else if (msg.type === 'cursor:presence_leave' && msg.sessionId) {
          removeGlobalPeer(String(msg.sessionId));
        }
      } catch {}
    };

    socket.onclose = () => {
      transportStatus.wsConnected = false;
      notifyTransportListeners();
      if (ws === socket) ws = null;
      if (isEngineStarted && !wsReconnectTimer) {
        wsReconnectTimer = setTimeout(() => {
          wsReconnectTimer = null;
          void probeAndConnectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = () => {
      // Handled via onclose
    };
  } catch {
    transportStatus.wsConnected = false;
  }
}

function subscribeFirestoreConfig() {
  if (!hasConfig || unsubscribeConfigSnap) return;
  void ensureFirestoreCursorModule().then((fsMod) => {
    if (!fsMod || !isEngineStarted || unsubscribeConfigSnap) return;
    try {
      const configRef = fsMod.doc(fsMod.db, 'stats', 'cursors_control');
      unsubscribeConfigSnap = fsMod.onSnapshot(
        configRef,
        (snap) => {
          transportStatus.firestoreConnected = true;
          notifyTransportListeners();
          if (snap.exists()) {
            const data = snap.data() as Partial<CursorsGlobalConfig>;
            if (typeof data.enabled === 'boolean') {
              applyConfigLocally(data, true);
            }
          }
        },
        () => {
          transportStatus.firestoreConnected = false;
          notifyTransportListeners();
        }
      );
    } catch {}
  });
}

function subscribeFirestoreRoom(slug: string) {
  if (unsubscribeRoomSnap) {
    unsubscribeRoomSnap();
    unsubscribeRoomSnap = null;
  }
  if (!hasConfig) return;

  void ensureFirestoreCursorModule().then((fsMod) => {
    if (!fsMod || !isEngineStarted || activeSlug !== slug) return;
    if (unsubscribeRoomSnap) {
      unsubscribeRoomSnap();
      unsubscribeRoomSnap = null;
    }
    try {
      const roomDocId = getRoomDocId(slug);
      const roomRef = fsMod.doc(fsMod.db, 'stats', roomDocId);
      unsubscribeRoomSnap = fsMod.onSnapshot(
        roomRef,
        (snap) => {
          transportStatus.firestoreConnected = true;
          notifyTransportListeners();
          if (!snap.exists()) return;
          const data = snap.data() as { cursors?: Record<string, RemoteCursorData> };
          const cursorsMap = data?.cursors;
          if (!cursorsMap || typeof cursorsMap !== 'object') return;

          const now = Date.now();
          const activeIdsInSnapshot = new Set<string>();

          for (const [sid, c] of Object.entries(cursorsMap)) {
            if (!c || typeof c !== 'object' || sid === LOCAL_SESSION_ID) continue;
            if (!c.active || now - Number(c.ts || 0) > STALE_CURSOR_MS) {
              removeRemoteCursor(sid, slug);
            } else {
              activeIdsInSnapshot.add(sid);
              ingestRemoteCursor({ ...c, sessionId: sid, slug }, 'firestore');
            }
          }

          // Fade out any cursor from Firestore source that vanished cleanly
          for (const [sid, existing] of remoteCursors.entries()) {
            if (existing.slug === slug && !existing.leaving && !activeIdsInSnapshot.has(sid) && now - existing.ts > 2000 && !transportStatus.wsConnected) {
              scheduleCursorFadeOut(sid);
            }
          }
          notifyFrameListeners();
          notifyRosterListeners();
        },
        () => {
          // Keep silent if offline
        }
      );
    } catch {}
  });
}

function buildLocalPayload(
  coords: {
    dx: number;
    y: number;
    mw: number;
    clicking: boolean;
    clickSeq: number;
    variant: 'default' | 'pointer' | 'text';
    drawingTrail?: boolean;
    ap?: string;
    ax?: number;
    ay?: number;
    selRects: SelectionRect[];
    selText: string;
    selAnchor?: SelectionAnchor;
    ts: number;
  },
  active: boolean
): RemoteCursorData {
  const validAnchor = sanitizePointerAnchor({ ap: coords.ap, ax: coords.ax, ay: coords.ay });
  const validSelAnchor = sanitizeSelectionAnchor(coords.selAnchor);
  return {
    sessionId: LOCAL_SESSION_ID,
    visitorId: cachedShortVisitorId,
    color: cachedColor,
    os: cachedClientEnv.os,
    browser: cachedClientEnv.browser,
    deviceType: cachedClientEnv.deviceType,
    slug: activeSlug,
    dx: Math.round(coords.dx * 10) / 10,
    y: Math.round(coords.y * 10) / 10,
    mw: Math.round(coords.mw),
    clicking: coords.clicking,
    clickSeq: coords.clickSeq,
    variant: coords.variant,
    cursorStyle: localCursorStyle,
    drawingTrail: Boolean(coords.drawingTrail),
    trailColor: localTrailColor,
    ...(validAnchor ? validAnchor : {}),
    selRects: coords.selRects,
    selText: coords.selText,
    ...(validSelAnchor ? { selAnchor: validSelAnchor } : {}),
    ts: coords.ts,
    active,
  };
}

function sendFirestoreCursorPayload(payload: RemoteCursorData, targetSlug = payload.slug) {
  if (!hasConfig || !firestoreCursorMod) return;
  try {
    const roomDocId = getRoomDocId(targetSlug);
    const roomRef = firestoreCursorMod.doc(firestoreCursorMod.db, 'stats', roomDocId);
    void firestoreCursorMod.setDoc(
      roomRef,
      {
        cursors: {
          [LOCAL_SESSION_ID]: payload,
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    ).catch(() => {});
  } catch {}
}

function flushLeaveBeacon(targetSlug: string) {
  if (!hasConfig || !targetSlug) return;
  try {
    const roomDocId = getRoomDocId(targetSlug);
    const projectId = firebaseConfigDetails.projectId || 'backwoods-wiki';
    const databaseId = firebaseConfigDetails.databaseId || '(default)';
    const keyParam = firebaseConfigDetails.apiKey ? `&key=${encodeURIComponent(firebaseConfigDetails.apiKey)}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/stats/${encodeURIComponent(roomDocId)}?updateMask.fieldPaths=cursors.${encodeURIComponent(LOCAL_SESSION_ID)}${keyParam}`;
    const body = JSON.stringify({
      fields: {
        cursors: {
          mapValue: {
            fields: {
              [LOCAL_SESSION_ID]: {
                mapValue: {
                  fields: {
                    active: { booleanValue: false },
                    ts: { integerValue: String(Date.now()) },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export function initCursorSync(initialSlug = 'home'): () => void {
  activeSlug = initialSlug || 'home';
  if (isEngineStarted) {
    setActiveCursorSlug(activeSlug);
    return () => {};
  }
  isEngineStarted = true;

  setupBroadcastChannel();
  subscribeFirestoreConfig();
  subscribeFirestoreRoom(activeSlug);
  void probeAndConnectWebSocket();

  staleSweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [sid, cursor] of remoteCursors.entries()) {
      if (!cursor.leaving && now - cursor.ts > STALE_CURSOR_MS) {
        scheduleCursorFadeOut(sid);
      }
    }
    if (telemetryWatcherCount > 0) {
      let gpChanged = false;
      for (const [sid, peer] of globalPeers.entries()) {
        if (now - peer.ts > STALE_CURSOR_MS) {
          globalPeers.delete(sid);
          gpChanged = true;
        }
      }
      if (gpChanged) notifyGlobalPresenceListeners(true);
    }
  }, 4000);

  const sendHeartbeat = () => {
    if (!lastLocalCursor || !currentConfig.enabled || localHide || stealthInspection || !isDesktopPointerCapable()) return;
    const now = Date.now();
    lastLocalCursor = { ...lastLocalCursor, ts: now };
    const payload = buildLocalPayload(lastLocalCursor, true);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
    }
    if (hasConfig && firestoreCursorMod) {
      const roomDocId = getRoomDocId(activeSlug);
      const roomRef = firestoreCursorMod.doc(firestoreCursorMod.db, 'stats', roomDocId);
      void firestoreCursorMod.updateDoc(roomRef, {
        [`cursors.${LOCAL_SESSION_ID}.ts`]: now,
        [`cursors.${LOCAL_SESSION_ID}.active`]: true,
      }).catch(() => {
        sendFirestoreCursorPayload(payload);
      });
    }
  };

  // Keepalive heartbeat keeps open wiki tabs active indefinitely while closed tabs fade out cleanly
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  const handleVisibilityReturn = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityReturn);
  }

  return () => {
    broadcastLocalCursorLeave(true);
    isEngineStarted = false;
    if (staleSweepTimer) {
      clearInterval(staleSweepTimer);
      staleSweepTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = null;
    }
    if (unsubscribeConfigSnap) {
      unsubscribeConfigSnap();
      unsubscribeConfigSnap = null;
    }
    if (unsubscribeRoomSnap) {
      unsubscribeRoomSnap();
      unsubscribeRoomSnap = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityReturn);
    }
    leaveCleanupTimers.forEach((t) => clearTimeout(t));
    leaveCleanupTimers.clear();
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}

export function setActiveCursorSlug(nextSlug: string) {
  const cleaned = nextSlug || 'home';
  if (cleaned === activeSlug) return;
  const prevSlug = activeSlug;

  // Leave previous room immediately
  localSelectionRects = [];
  localSelectionText = '';
  localSelectionAnchor = undefined;
  if (!stealthInspection) {
    broadcastLocalCursorLeave(false, prevSlug);
  }

  activeSlug = cleaned;
  remoteCursors.clear();
  notifyFrameListeners();
  notifyRosterListeners(true);

  subscribeFirestoreRoom(activeSlug);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'cursor:subscribe',
        sessionId: LOCAL_SESSION_ID,
        slug: activeSlug,
      })
    );
  }
}

export function setLocalSelectionSnapshot(
  selRects: SelectionRect[],
  selText: string,
  selAnchor?: SelectionAnchor
) {
  localSelectionRects = selRects;
  localSelectionText = selText;
  localSelectionAnchor = selAnchor;
}

export function broadcastLocalSelection(
  selRects: SelectionRect[],
  selText: string,
  mw = 1024,
  selAnchor?: SelectionAnchor
) {
  localSelectionRects = selRects;
  localSelectionText = selText;
  localSelectionAnchor = selAnchor;
  if (!currentConfig.enabled || localHide || stealthInspection || !isDesktopPointerCapable()) return;

  const now = Date.now();
  const base = lastLocalCursor || {
    dx: 0,
    y: 200,
    mw,
    clicking: false,
    clickSeq: 0,
    variant: 'text' as const,
    drawingTrail: false,
    selRects,
    selText,
    selAnchor,
    ts: now,
  };
  lastLocalCursor = { ...base, mw: mw || base.mw, selRects, selText, selAnchor, ts: now };
  const payload = buildLocalPayload(lastLocalCursor, true);

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
    } catch {}
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    lastWsSentAt = now;
    ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
  }

  const fsInterval = transportStatus.wsConnected ? 120 : 110;
  const fsElapsed = now - lastFirestoreSentAt;
  if (fsElapsed >= fsInterval) {
    lastFirestoreSentAt = now;
    sendFirestoreCursorPayload(payload);
  } else if (!firestoreThrottleTimer) {
    firestoreThrottleTimer = setTimeout(() => {
      firestoreThrottleTimer = null;
      if (lastLocalCursor && currentConfig.enabled && !localHide && !stealthInspection) {
        lastFirestoreSentAt = Date.now();
        sendFirestoreCursorPayload(buildLocalPayload({ ...lastLocalCursor, ts: lastFirestoreSentAt }, true));
      }
    }, fsInterval - fsElapsed);
  }
}

export function broadcastLocalCursorMove(
  dx: number,
  y: number,
  mw: number,
  clicking = false,
  variant: 'default' | 'pointer' | 'text' = 'default',
  drawingTrail = false,
  anchor?: PointerBlockAnchor
) {
  if (!currentConfig.enabled || localHide || stealthInspection || !isDesktopPointerCapable()) return;

  const now = Date.now();
  const prevSeq = lastLocalCursor?.clickSeq || 0;
  lastLocalCursor = {
    dx,
    y,
    mw,
    clicking,
    clickSeq: prevSeq,
    variant,
    drawingTrail,
    ap: anchor?.ap,
    ax: anchor?.ax,
    ay: anchor?.ay,
    selRects: localSelectionRects,
    selText: localSelectionText,
    selAnchor: localSelectionAnchor,
    ts: now,
  };
  const payload = buildLocalPayload(lastLocalCursor, true);

  // 1. 0ms cross-tab broadcast
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
    } catch {}
  }

  // 2. Real-time ~60fps WebSocket dispatch (16ms gate)
  if (ws && ws.readyState === WebSocket.OPEN) {
    const elapsed = now - lastWsSentAt;
    if (elapsed >= 16) {
      lastWsSentAt = now;
      ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
    } else if (!wsThrottleTimer) {
      wsThrottleTimer = setTimeout(() => {
        wsThrottleTimer = null;
        if (lastLocalCursor && ws && ws.readyState === WebSocket.OPEN && currentConfig.enabled && !localHide && !stealthInspection) {
          lastWsSentAt = Date.now();
          ws.send(JSON.stringify({ type: 'cursor:update', cursor: buildLocalPayload({ ...lastLocalCursor, ts: lastWsSentAt }, true) }));
        }
      }, 16 - elapsed);
    }
  }

  // 3. Low-latency Firestore stream dispatch (~33ms static, ~75ms when WS also active)
  const fsInterval = transportStatus.wsConnected ? 120 : 110;
  const fsElapsed = now - lastFirestoreSentAt;
  if (fsElapsed >= fsInterval) {
    lastFirestoreSentAt = now;
    sendFirestoreCursorPayload(payload);
  } else if (!firestoreThrottleTimer) {
    firestoreThrottleTimer = setTimeout(() => {
      firestoreThrottleTimer = null;
      if (lastLocalCursor && currentConfig.enabled && !localHide && !stealthInspection) {
        lastFirestoreSentAt = Date.now();
        sendFirestoreCursorPayload(buildLocalPayload({ ...lastLocalCursor, ts: lastFirestoreSentAt }, true));
      }
    }, fsInterval - fsElapsed);
  }
}

export function broadcastLocalCursorClick(
  dx: number,
  y: number,
  mw: number,
  clicking: boolean,
  variant: 'default' | 'pointer' | 'text' = 'default',
  drawingTrail = false,
  anchor?: PointerBlockAnchor
) {
  if (!currentConfig.enabled || localHide || stealthInspection || !isDesktopPointerCapable()) return;

  const now = Date.now();
  const prevSeq = lastLocalCursor?.clickSeq || 0;
  const clickSeq = clicking ? prevSeq + 1 : prevSeq;
  lastLocalCursor = {
    dx,
    y,
    mw,
    clicking,
    clickSeq,
    variant,
    drawingTrail,
    ap: anchor?.ap,
    ax: anchor?.ax,
    ay: anchor?.ay,
    selRects: localSelectionRects,
    selText: localSelectionText,
    selAnchor: localSelectionAnchor,
    ts: now,
  };
  const payload = buildLocalPayload(lastLocalCursor, true);

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
    } catch {}
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    lastWsSentAt = now;
    ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
  }

  lastFirestoreSentAt = now;
  sendFirestoreCursorPayload(payload);
}

export function broadcastLocalCursorLeave(useKeepalive = false, targetSlug = activeSlug) {
  if (wsThrottleTimer) {
    clearTimeout(wsThrottleTimer);
    wsThrottleTimer = null;
  }
  if (firestoreThrottleTimer) {
    clearTimeout(firestoreThrottleTimer);
    firestoreThrottleTimer = null;
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'cursor:leave',
        sessionId: LOCAL_SESSION_ID,
        slug: targetSlug,
        origin: LOCAL_SESSION_ID,
      });
    } catch {}
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'cursor:leave',
        sessionId: LOCAL_SESSION_ID,
        slug: targetSlug,
      })
    );
  }

  const offlinePayload = buildLocalPayload(
    lastLocalCursor || { dx: 0, y: 0, mw: 1024, clicking: false, clickSeq: 0, variant: 'default', selRects: [], selText: '', ts: Date.now() },
    false
  );
  offlinePayload.slug = targetSlug;

  if (useKeepalive) {
    flushLeaveBeacon(targetSlug);
  } else {
    sendFirestoreCursorPayload(offlinePayload, targetSlug);
  }
}

export function broadcastCursorConfigUpdate(
  partial: Partial<Pick<CursorsGlobalConfig, 'enabled' | 'showClickRipples' | 'showTrails' | 'cursorSize'>>,
  visitorId = 'ADMIN'
) {
  const nextSize = typeof partial.cursorSize === 'number' && Number.isFinite(partial.cursorSize)
    ? Math.max(5, Math.min(42, Math.round(partial.cursorSize * 10) / 10))
    : currentConfig.cursorSize;

  const updated: CursorsGlobalConfig = {
    ...currentConfig,
    ...partial,
    cursorSize: nextSize,
    updatedBy: visitorId.substring(0, 12),
    updatedAt: Date.now(),
  };

  applyConfigLocally(updated, true);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'cursors:config', config: updated }));
  }

  if (hasConfig) {
    void ensureFirestoreCursorModule().then((fsMod) => {
      if (!fsMod) return;
      try {
        const configRef = fsMod.doc(fsMod.db, 'stats', 'cursors_control');
        void fsMod.setDoc(configRef, updated, { merge: true }).catch(() => {});
      } catch {}
    });
  }
}

export function setLocalCursorHide(hidden: boolean) {
  localHide = hidden;
  try {
    if (hidden) {
      localStorage.setItem(LOCAL_HIDE_STORAGE_KEY, 'true');
      broadcastLocalCursorLeave(false);
    } else {
      localStorage.removeItem(LOCAL_HIDE_STORAGE_KEY);
    }
  } catch {}
  notifyLocalHideListeners();
}

export function getLocalCursorStyle(): CursorStyleId {
  return localCursorStyle;
}

export function setLocalCursorStyle(style: CursorStyleId) {
  const nextStyle = normalizeCursorStyle(style);
  if (localCursorStyle === nextStyle) {
    persistCursorStyle(nextStyle);
    return;
  }
  localCursorStyle = nextStyle;
  persistCursorStyle(nextStyle);
  notifyLocalStyleListeners();

  if (currentConfig.enabled && !localHide && !stealthInspection && isDesktopPointerCapable()) {
    const now = Date.now();
    const base = lastLocalCursor || {
      dx: 0,
      y: 200,
      mw: 1024,
      clicking: false,
      clickSeq: 0,
      variant: 'default' as const,
      drawingTrail: false,
      selRects: localSelectionRects,
      selText: localSelectionText,
      ts: now,
    };
    lastLocalCursor = { ...base, ts: now };
    const payload = buildLocalPayload(lastLocalCursor, true);
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
      } catch {}
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      lastWsSentAt = now;
      ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
    }
    lastFirestoreSentAt = now;
    sendFirestoreCursorPayload(payload);
  }
}

export function getLocalTrailColor(): string {
  return localTrailColor;
}

export function setLocalTrailColor(color: string) {
  const next = isValidHexColor(color) ? color.toLowerCase() : cachedColor;
  if (localTrailColor === next) {
    persistTrailColor(next);
    return;
  }
  localTrailColor = next;
  persistTrailColor(next);
  notifyLocalTrailColorListeners();

  if (currentConfig.enabled && !localHide && !stealthInspection && isDesktopPointerCapable()) {
    const now = Date.now();
    const base = lastLocalCursor || {
      dx: 0,
      y: 200,
      mw: 1024,
      clicking: false,
      clickSeq: 0,
      variant: 'default' as const,
      drawingTrail: false,
      selRects: localSelectionRects,
      selText: localSelectionText,
      ts: now,
    };
    lastLocalCursor = { ...base, ts: now };
    const payload = buildLocalPayload(lastLocalCursor, true);
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
      } catch {}
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      lastWsSentAt = now;
      ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
    }
    lastFirestoreSentAt = now;
    sendFirestoreCursorPayload(payload);
  }
}

export function useLocalTrailColor(): [string, (color: string) => void] {
  const [color, setColorState] = useState<string>(getLocalTrailColor);
  useEffect(() => {
    localTrailColorListeners.add(setColorState);
    setColorState(getLocalTrailColor());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_TRAIL_COLOR_KEY && isValidHexColor(e.newValue)) {
        const synced = e.newValue.toLowerCase();
        localTrailColor = synced;
        setColorState(synced);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      localTrailColorListeners.delete(setColorState);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  return [color, setLocalTrailColor];
}

export function setStealthInspection(stealth: boolean) {
  persistStealth(stealth);
  if (stealthInspection === stealth) return;
  stealthInspection = stealth;
  if (stealth) {
    broadcastLocalCursorLeave(false);
  } else if (lastLocalCursor && currentConfig.enabled && !localHide && isDesktopPointerCapable()) {
    const now = Date.now();
    lastLocalCursor = { ...lastLocalCursor, ts: now };
    const payload = buildLocalPayload(lastLocalCursor, true);
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'cursor:update', cursor: payload, origin: LOCAL_SESSION_ID });
      } catch {}
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      lastWsSentAt = now;
      ws.send(JSON.stringify({ type: 'cursor:update', cursor: payload }));
    }
    lastFirestoreSentAt = now;
    sendFirestoreCursorPayload(payload);
  }
  notifyStealthListeners();
}

export function getStealthInspection(): boolean {
  return stealthInspection;
}

export function useStealthInspection(): [boolean, (stealth: boolean) => void] {
  const [stealth, setStealth] = useState<boolean>(getStealthInspection);
  useEffect(() => {
    stealthListeners.add(setStealth);
    setStealth(getStealthInspection());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STEALTH_STORAGE_KEY && (e.newValue === 'true' || e.newValue === 'false')) {
        const synced = e.newValue === 'true';
        if (stealthInspection !== synced) {
          stealthInspection = synced;
          if (synced) broadcastLocalCursorLeave(false);
          notifyStealthListeners();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      stealthListeners.delete(setStealth);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  return [stealth, setStealthInspection];
}

export function getCursorsConfig(): CursorsGlobalConfig {
  return currentConfig;
}

export function getLocalCursorHide(): boolean {
  return localHide;
}

export function getRemoteCursorsMap(): Map<string, RemoteCursorData> {
  return remoteCursors;
}

export function getTransportStatus(): TransportStatus {
  return { ...transportStatus };
}

export function subscribeCursorFrames(cb: () => void): () => void {
  frameListeners.add(cb);
  return () => {
    frameListeners.delete(cb);
  };
}

export function useCursorsConfig(): CursorsGlobalConfig {
  const [cfg, setCfg] = useState<CursorsGlobalConfig>(getCursorsConfig);
  useEffect(() => {
    configListeners.add(setCfg);
    setCfg(getCursorsConfig());
    return () => {
      configListeners.delete(setCfg);
    };
  }, []);
  return cfg;
}

export function useLocalCursorHide(): [boolean, (hidden: boolean) => void] {
  const [hidden, setHidden] = useState<boolean>(getLocalCursorHide);
  useEffect(() => {
    localHideListeners.add(setHidden);
    setHidden(getLocalCursorHide());
    return () => {
      localHideListeners.delete(setHidden);
    };
  }, []);
  return [hidden, setLocalCursorHide];
}

export function useLocalCursorStyle(): [CursorStyleId, (style: CursorStyleId) => void] {
  const [style, setStyleState] = useState<CursorStyleId>(getLocalCursorStyle);
  useEffect(() => {
    localStyleListeners.add(setStyleState);
    setStyleState(getLocalCursorStyle());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STYLE_STORAGE_KEY && e.newValue) {
        const synced = normalizeCursorStyle(e.newValue);
        localCursorStyle = synced;
        setStyleState(synced);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      localStyleListeners.delete(setStyleState);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  return [style, setLocalCursorStyle];
}

export function useRemoteCursors(): RemoteCursorData[] {
  const [list, setList] = useState<RemoteCursorData[]>(() =>
    Array.from(remoteCursors.values()).sort((a, b) => b.ts - a.ts)
  );
  useEffect(() => {
    rosterListeners.add(setList);
    setList(Array.from(remoteCursors.values()).sort((a, b) => b.ts - a.ts));
    return () => {
      rosterListeners.delete(setList);
    };
  }, []);
  return list;
}

export function useCursorTransportStatus(): TransportStatus {
  const [status, setStatus] = useState<TransportStatus>(getTransportStatus);
  useEffect(() => {
    transportListeners.add(setStatus);
    setStatus(getTransportStatus());
    return () => {
      transportListeners.delete(setStatus);
    };
  }, []);
  return status;
}

function startTelemetryPresenceStream() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'cursor:subscribe_all', enabled: true }));
  }
  if (hasConfig && !unsubscribeGlobalRoomsSnap) {
    void ensureFirestoreCursorModule().then((fsMod) => {
      if (!fsMod || telemetryWatcherCount <= 0 || unsubscribeGlobalRoomsSnap) return;
      try {
        unsubscribeGlobalRoomsSnap = fsMod.onSnapshot(
          fsMod.collection(fsMod.db, 'stats'),
          (querySnap) => {
            if (telemetryWatcherCount <= 0) return;
            const now = Date.now();
            const nextMap = new Map<string, RemoteCursorData>();
            querySnap.forEach((docSnap) => {
              const prefix = `cursors_room_${WIKI_ROOM_PREFIX}_`;
              if (!docSnap.id.startsWith(prefix)) return;
              const slug = docSnap.id.slice(prefix.length) || 'home';
              const data = docSnap.data() as { cursors?: Record<string, RemoteCursorData> };
              const cursorsMap = data?.cursors;
              if (!cursorsMap || typeof cursorsMap !== 'object') return;
              for (const [sid, c] of Object.entries(cursorsMap)) {
                if (!c || typeof c !== 'object' || sid === LOCAL_SESSION_ID) continue;
                if (c.active && now - Number(c.ts || 0) <= STALE_CURSOR_MS) {
                  nextMap.set(sid, {
                    ...c,
                    sessionId: sid,
                    slug: c.slug || slug,
                    leaving: false,
                    color: c.color || getVisitorColor(c.visitorId || sid),
                  });
                }
              }
            });
            // Preserve any fresher live WS peer timestamps
            for (const [sid, existing] of globalPeers.entries()) {
              const snapPeer = nextMap.get(sid);
              if (snapPeer && existing.ts > snapPeer.ts + 25) {
                nextMap.set(sid, existing);
              } else if (!snapPeer && transportStatus.wsConnected && now - existing.ts <= STALE_CURSOR_MS) {
                nextMap.set(sid, existing);
              }
            }
            globalPeers.clear();
            nextMap.forEach((v, k) => globalPeers.set(k, v));
            notifyGlobalPresenceListeners(true);
          },
          () => {}
        );
      } catch {}
    });
  }
}

function stopTelemetryPresenceStream() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'cursor:subscribe_all', enabled: false }));
  }
  if (unsubscribeGlobalRoomsSnap) {
    unsubscribeGlobalRoomsSnap();
    unsubscribeGlobalRoomsSnap = null;
  }
  globalPeers.clear();
}

function retainTelemetryPresence(): () => void {
  telemetryWatcherCount += 1;
  if (telemetryWatcherCount === 1) {
    startTelemetryPresenceStream();
  }
  return () => {
    telemetryWatcherCount = Math.max(0, telemetryWatcherCount - 1);
    if (telemetryWatcherCount === 0) {
      stopTelemetryPresenceStream();
    }
  };
}

export function setFollowedSessionId(sessionId: string | null) {
  if (followedSessionId === sessionId) return;
  followedSessionId = sessionId;
  followListeners.forEach((cb) => {
    try { cb(followedSessionId); } catch {}
  });
}

export function getFollowedSessionId(): string | null {
  return followedSessionId;
}

export function useFollowedSessionId(): [string | null, (sessionId: string | null) => void] {
  const [sid, setSid] = useState<string | null>(getFollowedSessionId);
  useEffect(() => {
    followListeners.add(setSid);
    setSid(getFollowedSessionId());
    return () => {
      followListeners.delete(setSid);
    };
  }, []);
  return [sid, setFollowedSessionId];
}

function snapshotAllRemotePeers(): RemoteCursorData[] {
  const merged = new Map<string, RemoteCursorData>();
  globalPeers.forEach((c, sid) => {
    if (c.active && !c.leaving) merged.set(sid, c);
  });
  remoteCursors.forEach((c, sid) => {
    if (c.active && !c.leaving) merged.set(sid, c);
  });
  return Array.from(merged.values()).sort((a, b) => b.ts - a.ts);
}

export function useAllRemotePeers(enabled: boolean): RemoteCursorData[] {
  const [peers, setPeers] = useState<RemoteCursorData[]>(() =>
    enabled ? snapshotAllRemotePeers() : []
  );

  useEffect(() => {
    if (!enabled) {
      setPeers([]);
      return;
    }
    const release = retainTelemetryPresence();
    const sync = () => setPeers(snapshotAllRemotePeers());
    globalPresenceListeners.add(sync);
    rosterListeners.add(sync);
    sync();
    return () => {
      globalPresenceListeners.delete(sync);
      rosterListeners.delete(sync);
      release();
    };
  }, [enabled]);

  return peers;
}

export function subscribePageOccupancy(
  cb: (occupancy: Record<string, number>) => void
): () => void {
  const release = retainTelemetryPresence();
  const compute = () => {
    const next: Record<string, number> = {};
    for (const p of snapshotAllRemotePeers()) {
      const slug = p.slug || 'home';
      next[slug] = (next[slug] || 0) + 1;
    }
    cb(next);
  };
  globalPresenceListeners.add(compute);
  rosterListeners.add(compute);
  compute();
  return () => {
    globalPresenceListeners.delete(compute);
    rosterListeners.delete(compute);
    release();
  };
}

export function usePageOccupancy(enabled: boolean): Record<string, number> {
  const peers = useAllRemotePeers(enabled);
  const [occupancy, setOccupancy] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      setOccupancy({});
      return;
    }
    const next: Record<string, number> = {};
    for (const p of peers) {
      const slug = p.slug || 'home';
      next[slug] = (next[slug] || 0) + 1;
    }
    setOccupancy(next);
  }, [enabled, peers]);

  return occupancy;
}
