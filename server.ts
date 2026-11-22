import express from "express";
import compression from "compression";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { WebSocketServer, WebSocket } from "ws";

interface WsCursorState {
  sessionId: string;
  visitorId: string;
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
  cursorStyle?: string;
  drawingTrail?: boolean;
  trailColor?: string;
  selRects?: Array<{ dx: number; y: number; w: number; h: number }>;
  selText?: string;
  ap?: string;
  ax?: number;
  ay?: number;
  selAnchor?: { ap: string; so: number; eo: number; sp: string };
  ts: number;
  active: boolean;
}

interface WsCursorConfig {
  enabled: boolean;
  showClickRipples: boolean;
  showTrails: boolean;
  cursorSize: number;
  updatedBy: string;
  updatedAt: number;
}

interface WikiStats {
  uniqueCount: number;
  repeatCount: number;
  totalCount: number;
  visitorIds: string[];
  pageViews: Record<string, number>;
  logs: Array<{
    timestamp: string;
    type: 'unique' | 'repeat' | 'click' | string;
    slug: string;
    visitorId: string;
    os?: string;
    browser?: string;
    target?: string;
    page?: string;
    category?: string;
  }>;
}

const STATS_FILE = path.join(process.cwd(), 'data', 'stats.json');

// Server-side master passkey SHA-256 digests (NEVER stored in plaintext)
const ADMIN_PASSKEY_HASHES = [
  process.env.ADMIN_CLEARANCE_KEY
    ? crypto.createHash('sha256').update(process.env.ADMIN_CLEARANCE_KEY).digest('hex')
    : null,
  "89104ffe37ce5d7b4b9205d5f286d62c9d16f653e4c94281456089665720e5d2",
  "7769f36440a41335bc149092c7bef6cf8f868b4e821c5f25429c11e8d0581f19"
].filter(Boolean) as string[];

function verifyPasskeyTimingSafe(input: string): boolean {
  const inputHash = crypto.createHash('sha256').update(input).digest();
  return ADMIN_PASSKEY_HASHES.some((hex) => {
    const targetBuf = Buffer.from(hex, 'hex');
    return targetBuf.length === inputHash.length && crypto.timingSafeEqual(inputHash, targetBuf);
  });
}

const TELEMETRY_SECRET_FILE = path.join(process.cwd(), 'data', '.telemetry_secret');

function loadOrCreateTelemetrySecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  try {
    const dir = path.dirname(TELEMETRY_SECRET_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(TELEMETRY_SECRET_FILE)) {
      const existing = fs.readFileSync(TELEMETRY_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(TELEMETRY_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Persistent cryptographic session secret surviving server restarts
const JWT_SECRET = loadOrCreateTelemetrySecret();

// In-memory rate limiting against brute-force attacks
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

function isIpBanned(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() < record.lockUntil) return true;
  if (Date.now() >= record.lockUntil) {
    failedAttempts.delete(ip);
  }
  return false;
}

function registerFailedAttempt(ip: string) {
  const record = failedAttempts.get(ip) || { count: 0, lockUntil: 0 };
  record.count += 1;
  // If more than 5 failed attempts, ban the IP for 15 minutes
  if (record.count >= 5) {
    record.lockUntil = Date.now() + 15 * 60 * 1000;
  }
  failedAttempts.set(ip, record);
}

function resetFailedAttempt(ip: string) {
  failedAttempts.delete(ip);
}

// Generate HMAC signed authentication token
function generateAuthToken(): string {
  const payload = JSON.stringify({ role: 'telemetry_admin', ts: Date.now() });
  const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + hmac;
}

// Verify HMAC token
function verifyAuthToken(tokenStr: string | undefined): boolean {
  if (!tokenStr) return false;
  const parts = tokenStr.split('.');
  if (parts.length !== 2) return false;
  const [b64Payload, signature] = parts;
  try {
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    // Timing-safe comparison to prevent timing side-channel attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return false;
    }
    const data = JSON.parse(payload);
    // Token valid for 180 days
    if (Date.now() - data.ts > 180 * 24 * 60 * 60 * 1000) return false;
    return data.role === 'telemetry_admin';
  } catch {
    return false;
  }
}

function ensureStatsDir() {
  const dir = path.dirname(STATS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadStats(): WikiStats {
  ensureStatsDir();
  if (fs.existsSync(STATS_FILE)) {
    try {
      const data = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading stats file, resetting:", e);
    }
  }
  return {
    uniqueCount: 0,
    repeatCount: 0,
    totalCount: 0,
    visitorIds: [],
    pageViews: {},
    logs: []
  };
}

function saveStats(stats: WikiStats) {
  ensureStatsDir();
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to save stats file:", e);
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(compression());
  app.use(express.json());

  // Probe endpoint so static hosts (Vercel / Cloudflare Pages) never trigger WebSocket errors
  app.get(["/api/cursors/probe", "*/api/cursors/probe"], (_req, res) => {
    res.json({ ws: true, path: "/ws/cursors" });
  });

  // API: Admin Authentication Endpoint (Server-Side Verification)
  app.post(["/api/telemetry/auth", "*/api/telemetry/auth"], (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Check if IP is currently banned from brute force attempts
    if (isIpBanned(clientIp)) {
      return res.status(429).json({ 
        error: "Too many unauthorized attempts. Terminal locked for 15 minutes." 
      });
    }

    const { key } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: "Clearance key required." });
    }

    const matched = verifyPasskeyTimingSafe(key.trim());
    if (!matched) {
      registerFailedAttempt(clientIp);
      return res.status(401).json({ error: "UNAUTHORIZED ACCESS: Invalid Clearance Key." });
    }

    // Clearance validated: reset failure counts and emit signed crypto token
    resetFailedAttempt(clientIp);
    const token = generateAuthToken();
    return res.json({ success: true, token });
  });

  // API: Verify existing HMAC session token
  app.get(["/api/telemetry/verify", "*/api/telemetry/verify"], (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    if (!verifyAuthToken(token)) {
      return res.status(401).json({ valid: false });
    }
    return res.json({ valid: true });
  });

  // API Routes: Protected Telemetry Stats
  // Returns 401 UNAUTHORIZED and ZERO sensitive data if valid bearer token is missing
  app.get(["/api/stats", "*/api/stats"], (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    if (!verifyAuthToken(token)) {
      return res.status(401).json({ 
        error: "UNAUTHORIZED ACCESS: Valid security token required.",
        status: "LOCKED"
      });
    }

    const stats = loadStats();
    res.json({
      uniqueCount: stats.uniqueCount,
      repeatCount: stats.repeatCount,
      totalCount: stats.totalCount,
      pageViews: stats.pageViews,
      logs: stats.logs
    });
  });

  app.post(["/api/visit", "*/api/visit"], (req, res) => {
    const { visitorId, slug } = req.body;
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ error: 'visitorId is required' });
    }
    const s = slug || 'home';

    const stats = loadStats();
    const isUnique = !stats.visitorIds.includes(visitorId);

    if (isUnique) {
      stats.visitorIds.push(visitorId);
      stats.uniqueCount += 1;
    } else {
      stats.repeatCount += 1;
    }
    stats.totalCount += 1;
    stats.pageViews[s] = (stats.pageViews[s] || 0) + 1;

    // Add to logs (limit to 50)
    stats.logs.unshift({
      timestamp: new Date().toISOString(),
      type: isUnique ? 'unique' : 'repeat',
      slug: s,
      visitorId: visitorId.substring(0, 12)
    });
    if (stats.logs.length > 50) {
      stats.logs = stats.logs.slice(0, 50);
    }

    saveStats(stats);
    res.json({
      success: true,
      stats: {
        uniqueCount: stats.uniqueCount,
        repeatCount: stats.repeatCount,
        totalCount: stats.totalCount
      }
    });
  });

  // Serve static assets and/or Vite middleware
  const isProductionRun = process.env.NODE_ENV === "production" || Boolean(process.argv[1]?.endsWith(".cjs"));
  if (!isProductionRun) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html')) ? cwdDist : __dirname;
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Authoritative real-time WebSocket relay for live desktop cursors
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/cursors" });
  const wsSessions = new Map<WebSocket, { sessionId?: string; slug?: string; subscribeAll?: boolean; state?: WsCursorState }>();
  const activeCursors = new Map<string, WsCursorState>();
  let liveCursorConfig: WsCursorConfig = {
    enabled: true,
    showClickRipples: true,
    showTrails: true,
    cursorSize: 16.5,
    updatedBy: "SYSTEM",
    updatedAt: 0
  };

  const broadcastToSlug = (slug: string, payload: string, excludeWs?: WebSocket) => {
    for (const [clientWs, meta] of wsSessions.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN && meta.slug === slug) {
        clientWs.send(payload);
      }
    }
  };

  const broadcastToPresenceWatchers = (payload: string, excludeSlug?: string, excludeWs?: WebSocket) => {
    for (const [clientWs, meta] of wsSessions.entries()) {
      if (
        clientWs !== excludeWs &&
        clientWs.readyState === WebSocket.OPEN &&
        meta.subscribeAll &&
        (!excludeSlug || meta.slug !== excludeSlug)
      ) {
        clientWs.send(payload);
      }
    }
  };

  const broadcastAll = (payload: string, excludeWs?: WebSocket) => {
    for (const [clientWs] of wsSessions.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    }
  };

  wss.on("connection", (ws) => {
    wsSessions.set(ws, {});

    // Send initial config immediately on connect
    ws.send(JSON.stringify({ type: "cursors:config", config: liveCursorConfig }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== "object") return;
        const meta = wsSessions.get(ws);
        if (!meta) return;

        if (msg.type === "cursor:subscribe_all") {
          meta.subscribeAll = Boolean(msg.enabled);
          if (meta.subscribeAll) {
            const all = Array.from(activeCursors.values()).filter((c) => c.sessionId !== meta.sessionId);
            ws.send(JSON.stringify({ type: "cursor:presence_snapshot", cursors: all }));
          }
          return;
        }

        if (msg.type === "cursor:subscribe") {
          const nextSlug = typeof msg.slug === "string" && msg.slug ? msg.slug : "home";
          const prevSlug = meta.slug;
          if (prevSlug && prevSlug !== nextSlug && meta.sessionId) {
            activeCursors.delete(meta.sessionId);
            broadcastToSlug(prevSlug, JSON.stringify({ type: "cursor:leave", sessionId: meta.sessionId, slug: prevSlug }), ws);
            broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_leave", sessionId: meta.sessionId }), prevSlug, ws);
          }
          meta.slug = nextSlug;
          if (typeof msg.sessionId === "string" && msg.sessionId) {
            meta.sessionId = msg.sessionId;
          }
          const roomCursors = Array.from(activeCursors.values()).filter((c) => c.slug === nextSlug && c.sessionId !== meta.sessionId);
          ws.send(JSON.stringify({ type: "cursor:init", slug: nextSlug, cursors: roomCursors }));
          return;
        }

        if (msg.type === "cursor:update" && msg.cursor && typeof msg.cursor.sessionId === "string") {
          const rawRects = Array.isArray(msg.cursor.selRects) ? msg.cursor.selRects.slice(0, 24) : [];
          const selRects = rawRects
            .filter((r: unknown) => r && typeof r === 'object')
            .map((r: Record<string, unknown>) => ({
              dx: Math.round((Number(r.dx) || 0) * 10) / 10,
              y: Math.round((Number(r.y) || 0) * 10) / 10,
              w: Math.max(0, Math.round((Number(r.w) || 0) * 10) / 10),
              h: Math.max(0, Math.round((Number(r.h) || 0) * 10) / 10),
            }))
            .filter((r: { w: number; h: number }) => r.w >= 1 && r.h >= 1);
          const selText = typeof msg.cursor.selText === 'string'
            ? msg.cursor.selText.replace(/\s+/g, ' ').trim().slice(0, 120)
            : '';

          const allowedStyles = new Set(['macos', 'prismatic', 'chroma-cur', 'backwoods-shard', 'archival-nib', 'crisp-pixel']);
          const cursorStyle = typeof msg.cursor.cursorStyle === 'string' && allowedStyles.has(msg.cursor.cursorStyle)
            ? msg.cursor.cursorStyle
            : 'macos';

          const trailColor = typeof msg.cursor.trailColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.cursor.trailColor)
            ? msg.cursor.trailColor.toLowerCase()
            : undefined;

          const rawAp = typeof msg.cursor.ap === 'string' ? msg.cursor.ap.trim().slice(0, 160) : '';
          const rawAx = Number(msg.cursor.ax);
          const rawAy = Number(msg.cursor.ay);
          const hasValidBlockAnchor = rawAp.length > 0 && Number.isFinite(rawAx) && Number.isFinite(rawAy);

          let selAnchor: { ap: string; so: number; eo: number; sp: string } | undefined;
          if (msg.cursor.selAnchor && typeof msg.cursor.selAnchor === 'object') {
            const sa = msg.cursor.selAnchor as Record<string, unknown>;
            const sAp = typeof sa.ap === 'string' ? sa.ap.trim().slice(0, 160) : '';
            const sSo = Math.floor(Number(sa.so));
            const sEo = Math.floor(Number(sa.eo));
            const sSp = typeof sa.sp === 'string' ? sa.sp.replace(/\s+/g, ' ').trim().slice(0, 48) : '';
            if (sAp && Number.isFinite(sSo) && Number.isFinite(sEo) && sSo >= 0 && sEo > sSo) {
              selAnchor = { ap: sAp, so: sSo, eo: sEo, sp: sSp };
            }
          }

          const cursor: WsCursorState = {
            sessionId: String(msg.cursor.sessionId).slice(0, 40),
            visitorId: String(msg.cursor.visitorId || "surv_anon").slice(0, 24),
            os: String(msg.cursor.os || "Desktop").slice(0, 32),
            browser: String(msg.cursor.browser || "Browser").slice(0, 32),
            deviceType: String(msg.cursor.deviceType || "Desktop").slice(0, 16),
            slug: String(msg.cursor.slug || meta.slug || "home").slice(0, 64),
            dx: Number(msg.cursor.dx) || 0,
            y: Number(msg.cursor.y) || 0,
            mw: Number(msg.cursor.mw) || 1024,
            clicking: Boolean(msg.cursor.clicking),
            clickSeq: Number(msg.cursor.clickSeq) || 0,
            variant: msg.cursor.variant === 'pointer' || msg.cursor.variant === 'text' ? msg.cursor.variant : 'default',
            cursorStyle,
            drawingTrail: Boolean(msg.cursor.drawingTrail),
            ...(trailColor ? { trailColor } : {}),
            ...(hasValidBlockAnchor ? {
              ap: rawAp,
              ax: Math.max(-2, Math.min(3, Math.round(rawAx * 10000) / 10000)),
              ay: Math.max(-2, Math.min(3, Math.round(rawAy * 10000) / 10000)),
            } : {}),
            selRects,
            selText,
            ...(selAnchor ? { selAnchor } : {}),
            ts: Date.now(),
            active: msg.cursor.active !== false
          };

          if (meta.slug && meta.slug !== cursor.slug && meta.sessionId) {
            activeCursors.delete(meta.sessionId);
            broadcastToSlug(meta.slug, JSON.stringify({ type: "cursor:leave", sessionId: meta.sessionId, slug: meta.slug }), ws);
            broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_leave", sessionId: meta.sessionId }), meta.slug, ws);
          }

          meta.sessionId = cursor.sessionId;
          meta.slug = cursor.slug;

          if (!cursor.active) {
            activeCursors.delete(cursor.sessionId);
            broadcastToSlug(cursor.slug, JSON.stringify({ type: "cursor:leave", sessionId: cursor.sessionId, slug: cursor.slug }), ws);
            broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_leave", sessionId: cursor.sessionId }), cursor.slug, ws);
          } else {
            meta.state = cursor;
            activeCursors.set(cursor.sessionId, cursor);
            broadcastToSlug(cursor.slug, JSON.stringify({ type: "cursor:update", cursor }), ws);
            broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_update", cursor }), cursor.slug, ws);
          }
          return;
        }

        if (msg.type === "cursor:leave" && typeof msg.sessionId === "string") {
          const sid = String(msg.sessionId);
          const slug = typeof msg.slug === "string" ? msg.slug : meta.slug;
          activeCursors.delete(sid);
          if (slug) {
            broadcastToSlug(slug, JSON.stringify({ type: "cursor:leave", sessionId: sid, slug }), ws);
          }
          broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_leave", sessionId: sid }), slug, ws);
          return;
        }

        if (msg.type === "cursors:config" && msg.config && typeof msg.config === "object") {
          const parsedSize = typeof msg.config.cursorSize === "number" && Number.isFinite(msg.config.cursorSize)
            ? Math.max(5, Math.min(42, Math.round(msg.config.cursorSize * 10) / 10))
            : liveCursorConfig.cursorSize;
          liveCursorConfig = {
            enabled: typeof msg.config.enabled === "boolean" ? msg.config.enabled : liveCursorConfig.enabled,
            showClickRipples: typeof msg.config.showClickRipples === "boolean" ? msg.config.showClickRipples : liveCursorConfig.showClickRipples,
            showTrails: typeof msg.config.showTrails === "boolean" ? msg.config.showTrails : liveCursorConfig.showTrails,
            cursorSize: parsedSize,
            updatedBy: String(msg.config.updatedBy || "ADMIN").slice(0, 24),
            updatedAt: Date.now()
          };
          broadcastAll(JSON.stringify({ type: "cursors:config", config: liveCursorConfig }), ws);
        }
      } catch {
        // Ignore malformed payloads
      }
    });

    ws.on("close", () => {
      const meta = wsSessions.get(ws);
      wsSessions.delete(ws);
      if (meta?.sessionId) {
        activeCursors.delete(meta.sessionId);
        if (meta.slug) {
          broadcastToSlug(meta.slug, JSON.stringify({ type: "cursor:leave", sessionId: meta.sessionId, slug: meta.slug }));
        }
        broadcastToPresenceWatchers(JSON.stringify({ type: "cursor:presence_leave", sessionId: meta.sessionId }), meta.slug);
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
