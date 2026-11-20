import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation, Shield, X } from 'lucide-react';
import MacOsCursorSvg, {
  MacOsCursorVariant,
  buildMacOsCursorCssValue,
  getCursorDimensions,
  getCursorPackMeta,
  normalizeCursorStyle,
} from './MacOsCursorSvg';
import {
  initCursorSync,
  setActiveCursorSlug,
  useCursorsConfig,
  useLocalCursorHide,
  useLocalCursorStyle,
  useLocalTrailColor,
  useStealthInspection,
  useRemoteCursors,
  useAllRemotePeers,
  useFollowedSessionId,
  subscribeCursorFrames,
  getRemoteCursorsMap,
  broadcastLocalCursorMove,
  broadcastLocalCursorClick,
  broadcastLocalCursorLeave,
  broadcastLocalSelection,
  setLocalSelectionSnapshot,
  isDesktopPointerCapable,
  isValidHexColor,
  RemoteCursorData,
  SelectionRect,
  SelectionAnchor,
} from '../../utils/cursorSync';
import {
  PointerBlockAnchor,
  ResolvedHighlightRect,
  capturePointerAnchor,
  captureSelectionAnchor,
  getContentMetrics,
  getMainElement,
  resolveAnchorToScreen,
  resolveSelectionAnchorToRects,
} from '../../utils/domAnchor';

interface TrailPoint {
  dx: number;
  y: number;
  mw: number;
  ap?: string;
  ax?: number;
  ay?: number;
  t: number;
  breakBefore?: boolean;
}

interface RemoteTrailTrack {
  color: string;
  points: TrailPoint[];
  wasDrawing: boolean;
}

const TRAIL_TTL_MS = 8000;

interface LiveCursorsOverlayProps {
  activeSlug: string;
  isTelemetryUnlocked: boolean;
  onNavigateSlug?: (slug: string) => void;
}

interface SmoothRemotePos {
  x: number;
  y: number;
  tx: number;
  ty: number;
  visible: boolean;
  initialized: boolean;
}

function detectElementCursorVariant(target: HTMLElement | null): MacOsCursorVariant {
  if (!target) return 'default';
  if (
    target.closest(
      'a, button, [role="button"], [role="tab"], summary, select, input[type="range"], input[type="checkbox"], input[type="radio"], .cursor-pointer'
    )
  ) {
    return 'pointer';
  }
  if (
    target.closest(
      'input[type="text"], input[type="password"], input[type="search"], input[type="email"], input[type="url"], input:not([type]), textarea, [contenteditable="true"]'
    )
  ) {
    return 'text';
  }
  const selectableTextEl = target.closest('p, h1, h2, h3, h4, li, pre, code, blockquote, td, th');
  if (selectableTextEl && !selectableTextEl.closest('.select-none')) {
    return 'text';
  }
  return 'default';
}

function withHexAlpha(color: string, hexAlpha: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${hexAlpha}` : fallback;
}

function readActiveSelection(
  mainCenter: number,
  scrollY: number,
  mainEl: HTMLElement | null
): { rects: SelectionRect[]; text: string; selAnchor?: SelectionAnchor } {
  if (typeof window === 'undefined') return { rects: [], text: '' };
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    return { rects: [], text: '' };
  }

  const rawText = sel.toString().replace(/\s+/g, ' ').trim();
  if (!rawText) return { rects: [], text: '' };

  const anchorEl = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
  if (anchorEl?.closest('#stats-modal-container')) {
    return { rects: [], text: '' };
  }

  const range = sel.getRangeAt(0);
  const selAnchor = captureSelectionAnchor(range, rawText, mainEl);
  const rawRects = Array.from(range.getClientRects()).filter((r) => r.width >= 2 && r.height >= 2);
  if (rawRects.length === 0) return { rects: [], text: '' };

  const merged: Array<{ left: number; top: number; right: number; bottom: number }> = [];
  for (const r of rawRects) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Math.abs(prev.top - r.top) < 4 &&
      Math.abs(prev.bottom - r.bottom) < 6 &&
      r.left <= prev.right + 4 &&
      r.right >= prev.left - 4
    ) {
      prev.left = Math.min(prev.left, r.left);
      prev.top = Math.min(prev.top, r.top);
      prev.right = Math.max(prev.right, r.right);
      prev.bottom = Math.max(prev.bottom, r.bottom);
    } else {
      merged.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }

  const rects: SelectionRect[] = merged.slice(0, 24).map((m) => ({
    dx: Math.round((m.left - mainCenter) * 10) / 10,
    y: Math.round((m.top + scrollY) * 10) / 10,
    w: Math.round((m.right - m.left) * 10) / 10,
    h: Math.round((m.bottom - m.top) * 10) / 10,
  }));

  return { rects, text: rawText.slice(0, 120), selAnchor };
}

export default function LiveCursorsOverlay({
  activeSlug,
  isTelemetryUnlocked,
  onNavigateSlug,
}: LiveCursorsOverlayProps) {
  const config = useCursorsConfig();
  const [localHide] = useLocalCursorHide();
  const [localCursorStyle] = useLocalCursorStyle();
  const [localTrailColor] = useLocalTrailColor();
  const [stealthMode, setStealthMode] = useStealthInspection();
  const cursors = useRemoteCursors();
  const allPeers = useAllRemotePeers(isTelemetryUnlocked);
  const [followedId, setFollowedId] = useFollowedSessionId();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [pulseMap, setPulseMap] = useState<Record<string, number>>({});
  const [highlightLayoutTick, setHighlightLayoutTick] = useState(0);

  const followedPeer = isTelemetryUnlocked && followedId
    ? allPeers.find((p) => p.sessionId === followedId) || null
    : null;
  const followedTargetYRef = useRef<number | null>(null);
  const lastNavTargetRef = useRef<string>('');

  const cursorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const highlightLayerRef = useRef<HTMLDivElement | null>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const localTrailColorRef = useRef<string>(localTrailColor);
  localTrailColorRef.current = localTrailColor;
  const trailsEnabledRef = useRef<boolean>(true);
  trailsEnabledRef.current = config.enabled && config.showTrails !== false && !localHide;
  const remoteSmoothRef = useRef<Map<string, SmoothRemotePos>>(new Map());
  const localTrailRef = useRef<TrailPoint[]>([]);
  const remoteTrailsRef = useRef<Map<string, RemoteTrailTrack>>(new Map());
  const wasLocalAltRef = useRef<boolean>(false);
  const lastBroadcastedAltRef = useRef<boolean>(false);
  const lastLocalSampleRef = useRef<{
    dx: number;
    y: number;
    variant: MacOsCursorVariant;
    clicking: boolean;
    anchor?: PointerBlockAnchor;
  } | null>(null);
  const trailRafRef = useRef<number | null>(null);
  const prevClickSeqRef = useRef<Map<string, number>>(new Map());
  const remoteRafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number>(0);
  const isClickingRef = useRef(false);
  const lastSelectionSigRef = useRef<string>('');

  const layoutCacheRef = useRef({
    mainCenter: typeof window !== 'undefined' ? window.innerWidth / 2 : 512,
    mainWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    vw: typeof window !== 'undefined' ? window.innerWidth : 1024,
    vh: typeof window !== 'undefined' ? window.innerHeight : 768,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  });

  const cursorSize = typeof config.cursorSize === 'number' && Number.isFinite(config.cursorSize) ? config.cursorSize : 16.5;
  const shouldOverrideLocalCursor = config.enabled && !localHide && isDesktopPointerCapable();

  useEffect(() => {
    const cleanup = initCursorSync(activeSlug);
    return cleanup;
  }, []);

  useEffect(() => {
    setActiveCursorSlug(activeSlug);
    remoteSmoothRef.current.clear();
    remoteTrailsRef.current.clear();
    localTrailRef.current = [];
    wasLocalAltRef.current = false;
    lastSelectionSigRef.current = '';
    setHoveredId(null);
    setPinnedId(null);
  }, [activeSlug]);

  const wasTelemetryUnlockedRef = useRef(isTelemetryUnlocked);

  useEffect(() => {
    const wasUnlocked = wasTelemetryUnlockedRef.current;
    wasTelemetryUnlockedRef.current = isTelemetryUnlocked;
    if (!isTelemetryUnlocked) {
      setHoveredId(null);
      setPinnedId(null);
      if (followedId) setFollowedId(null);
      if (wasUnlocked && stealthMode) {
        setStealthMode(false);
      }
    }
  }, [isTelemetryUnlocked, followedId, setFollowedId, stealthMode, setStealthMode]);

  useEffect(() => {
    if (!isTelemetryUnlocked || !followedId || followedPeer) return;
    const timer = setTimeout(() => {
      setFollowedId(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isTelemetryUnlocked, followedId, followedPeer, setFollowedId]);

  useEffect(() => {
    if (!isTelemetryUnlocked || !followedPeer) {
      lastNavTargetRef.current = '';
      followedTargetYRef.current = null;
      return;
    }
    const targetSlug = followedPeer.slug || 'home';
    if (targetSlug !== activeSlug) {
      followedTargetYRef.current = null;
      if (lastNavTargetRef.current !== targetSlug) {
        lastNavTargetRef.current = targetSlug;
        onNavigateSlug?.(targetSlug);
      }
      return;
    }
    lastNavTargetRef.current = '';
    const resolved = resolveAnchorToScreen(followedPeer, getMainElement());
    followedTargetYRef.current = resolved ? resolved.y + window.scrollY : followedPeer.y;
  }, [isTelemetryUnlocked, followedPeer, activeSlug, onNavigateSlug]);

  useEffect(() => {
    if (!isTelemetryUnlocked || !followedId) return;

    const unlock = () => setFollowedId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === ' ') {
        unlock();
      } else if (e.key === 'Escape') {
        unlock();
      }
    };

    window.addEventListener('wheel', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    let rafId: number | null = null;
    let lastTs = 0;
    const stepScroll = (now: number) => {
      const targetCursorY = followedTargetYRef.current;
      if (targetCursorY !== null) {
        const dt = lastTs > 0 ? Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000)) : 1 / 60;
        lastTs = now;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const desiredScroll = Math.max(0, Math.min(maxScroll, targetCursorY - window.innerHeight * 0.4));
        const diff = desiredScroll - window.scrollY;
        if (Math.abs(diff) > 1.2) {
          const alpha = 1 - Math.exp(-14 * dt);
          const nextScroll = Math.abs(diff) > 1800 ? desiredScroll : window.scrollY + diff * alpha;
          window.scrollTo({ top: nextScroll, behavior: 'auto' });
        }
      } else {
        lastTs = now;
      }
      rafId = requestAnimationFrame(stepScroll);
    };
    rafId = requestAnimationFrame(stepScroll);

    return () => {
      window.removeEventListener('wheel', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isTelemetryUnlocked, followedId, setFollowedId]);

  // Override native OS cursor immediately with all 3 hardware-composited SVG cursor variants
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (shouldOverrideLocalCursor) {
      root.style.setProperty('--bw-cursor-default', buildMacOsCursorCssValue(cursorSize, 'default', localCursorStyle));
      root.style.setProperty('--bw-cursor-pointer', buildMacOsCursorCssValue(cursorSize, 'pointer', localCursorStyle));
      root.style.setProperty('--bw-cursor-text', buildMacOsCursorCssValue(cursorSize, 'text', localCursorStyle));
      root.classList.add('bw-custom-cursor-active');
    } else {
      root.classList.remove('bw-custom-cursor-active');
      root.style.removeProperty('--bw-cursor-default');
      root.style.removeProperty('--bw-cursor-pointer');
      root.style.removeProperty('--bw-cursor-text');
    }
    return () => {
      root.classList.remove('bw-custom-cursor-active');
      root.style.removeProperty('--bw-cursor-default');
      root.style.removeProperty('--bw-cursor-pointer');
      root.style.removeProperty('--bw-cursor-text');
    };
  }, [shouldOverrideLocalCursor, cursorSize, localCursorStyle]);

  const refreshLayoutMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    const mainEl = getMainElement();
    const { center, width } = getContentMetrics(mainEl);
    layoutCacheRef.current = {
      mainCenter: center,
      mainWidth: width,
      vw: window.innerWidth,
      vh: window.innerHeight,
      scrollY: window.scrollY,
    };
  }, []);

  const computeRemoteTarget = useCallback(
    (c: RemoteCursorData, mainEl: HTMLElement | null, rectCache?: Map<string, DOMRect | null>) => {
      const { mainCenter, mainWidth, vw, vh, scrollY } = layoutCacheRef.current;
      const resolved = resolveAnchorToScreen(c, mainEl, rectCache);

      let screenX: number;
      let screenY: number;
      if (resolved) {
        screenX = resolved.x;
        screenY = resolved.y;
      } else {
        const scale = c.mw > 0 ? Math.max(0.45, Math.min(1.4, mainWidth / c.mw)) : 1;
        screenX = Math.max(6, Math.min(vw - 18, mainCenter + c.dx * scale));
        screenY = c.y - scrollY;
      }

      const visible = screenX >= -48 && screenX <= vw + 48 && screenY >= -48 && screenY <= vh + 48;
      return { tx: screenX, ty: screenY, visible, resolvedRect: resolved?.rect || null };
    },
    []
  );

  const drawTrailTrack = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: TrailPoint[],
      color: string,
      now: number,
      mainEl: HTMLElement | null,
      mainCenter: number,
      mainWidth: number,
      scrollY: number,
      rectCache: Map<string, DOMRect | null>
    ) => {
      if (points.length < 2) return;

      const toScreen = (p: TrailPoint) => {
        const resolved = resolveAnchorToScreen(p, mainEl, rectCache);
        if (resolved) {
          return { x: resolved.x, y: resolved.y, t: p.t };
        }
        const scale = p.mw > 0 ? Math.max(0.45, Math.min(1.4, mainWidth / p.mw)) : 1;
        return {
          x: mainCenter + p.dx * scale,
          y: p.y - scrollY,
          t: p.t,
        };
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let segStart = 0;
      for (let i = 1; i <= points.length; i++) {
        const isEnd =
          i === points.length ||
          points[i].breakBefore ||
          points[i].t - points[i - 1].t > 160;

        if (!isEnd) continue;

        const segLen = i - segStart;
        if (segLen >= 2) {
          const pts = points.slice(segStart, i).map(toScreen);
          for (let j = 0; j < pts.length - 1; j++) {
            const p0 = j > 0 ? pts[j - 1] : pts[j];
            const p1 = pts[j];
            const p2 = pts[j + 1];

            const startX = j === 0 ? p1.x : (p0.x + p1.x) * 0.5;
            const startY = j === 0 ? p1.y : (p0.y + p1.y) * 0.5;
            const endX = j === pts.length - 2 ? p2.x : (p1.x + p2.x) * 0.5;
            const endY = j === pts.length - 2 ? p2.y : (p1.y + p2.y) * 0.5;

            const age = now - p2.t;
            const life = Math.max(0, Math.min(1, 1 - age / TRAIL_TTL_MS));
            if (life <= 0.005) continue;

            const coreWidth = 0.85 + Math.pow(life, 0.75) * 3.8;
            const coreAlpha = Math.pow(life, 1.45) * 0.88;

            // Soft outer glow pass
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(p1.x, p1.y, endX, endY);
            ctx.strokeStyle = color;
            ctx.globalAlpha = coreAlpha * 0.22;
            ctx.lineWidth = coreWidth * 2.2;
            ctx.stroke();

            // Crisp tapered inner ribbon pass
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(p1.x, p1.y, endX, endY);
            ctx.strokeStyle = color;
            ctx.globalAlpha = coreAlpha;
            ctx.lineWidth = coreWidth;
            ctx.stroke();
          }
        }
        segStart = i;
      }
      ctx.globalAlpha = 1;
    },
    []
  );

  const stepTrailFrame = useCallback(() => {
    trailRafRef.current = null;
    const canvas = trailCanvasRef.current;
    if (!canvas) return;

    if (!trailsEnabledRef.current) {
      localTrailRef.current = [];
      remoteTrailsRef.current.clear();
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const now = performance.now();
    const cutoff = now - TRAIL_TTL_MS;

    if (localTrailRef.current.length > 0) {
      localTrailRef.current = localTrailRef.current.filter((p) => p.t >= cutoff);
    }

    remoteTrailsRef.current.forEach((track, sid) => {
      track.points = track.points.filter((p) => p.t >= cutoff);
      if (track.points.length === 0 && !track.wasDrawing) {
        remoteTrailsRef.current.delete(sid);
      }
    });

    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || window.innerWidth;
    const cssH = rect.height || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(cssW * dpr));
    const targetH = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainEl = getMainElement();
    const { center: mainCenter, width: mainWidth } = getContentMetrics(mainEl);
    const scrollY = window.scrollY;
    const rectCache = new Map<string, DOMRect | null>();

    ctx.setTransform(dpr, 0, 0, dpr, -rect.left * dpr, -rect.top * dpr);
    ctx.clearRect(rect.left, rect.top, cssW, cssH);

    if (localTrailRef.current.length >= 2) {
      drawTrailTrack(ctx, localTrailRef.current, localTrailColorRef.current, now, mainEl, mainCenter, mainWidth, scrollY, rectCache);
    }

    remoteTrailsRef.current.forEach((track) => {
      if (track.points.length >= 2) {
        drawTrailTrack(ctx, track.points, track.color, now, mainEl, mainCenter, mainWidth, scrollY, rectCache);
      }
    });

    const hasRemaining =
      localTrailRef.current.length > 0 ||
      Array.from(remoteTrailsRef.current.values()).some((t: RemoteTrailTrack) => t.points.length > 0);

    if (hasRemaining) {
      trailRafRef.current = requestAnimationFrame(stepTrailFrame);
    }
  }, [drawTrailTrack]);

  const startTrailLoop = useCallback(() => {
    if (trailRafRef.current === null) {
      trailRafRef.current = requestAnimationFrame(stepTrailFrame);
    }
  }, [stepTrailFrame]);

  const stepRemoteInterpolation = useCallback((now: number) => {
    remoteRafRef.current = null;
    const dt = lastFrameTsRef.current > 0
      ? Math.min(0.05, Math.max(0.001, (now - lastFrameTsRef.current) / 1000))
      : 1 / 60;
    lastFrameTsRef.current = now;

    const alpha = 1 - Math.exp(-32 * dt);
    const map = getRemoteCursorsMap();
    const mainEl = getMainElement();
    const rectCache = new Map<string, DOMRect | null>();
    const { mainCenter, mainWidth } = layoutCacheRef.current;
    const liveScrollY = window.scrollY;
    const perfNow = performance.now();
    let needsAnotherFrame = false;

    map.forEach((c: RemoteCursorData, sid: string) => {
      const el = cursorRefs.current.get(sid);
      if (!el) return;

      const { tx, ty, visible, resolvedRect } = computeRemoteTarget(c, mainEl, rectCache);
      let state = remoteSmoothRef.current.get(sid);

      if (!state || !state.initialized) {
        state = { x: tx, y: ty, tx, ty, visible, initialized: true };
        remoteSmoothRef.current.set(sid, state);
      } else {
        state.tx = tx;
        state.ty = ty;
        state.visible = visible;
        const dx = state.tx - state.x;
        const dy = state.ty - state.y;
        if (Math.hypot(dx, dy) > 650 || (Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12)) {
          state.x = state.tx;
          state.y = state.ty;
        } else {
          state.x += dx * alpha;
          state.y += dy * alpha;
          needsAnotherFrame = true;
        }
      }

      if (trailsEnabledRef.current && c.drawingTrail && !c.leaving) {
        const scale = c.mw > 0 ? Math.max(0.45, Math.min(1.4, mainWidth / c.mw)) : 1;
        const docDx = (state.x - mainCenter) / scale;
        const docY = state.y + liveScrollY;
        const hasBlockAnchor = Boolean(c.ap && resolvedRect && resolvedRect.width > 0 && resolvedRect.height > 0);
        const ax = hasBlockAnchor && resolvedRect ? (state.x - resolvedRect.left) / resolvedRect.width : undefined;
        const ay = hasBlockAnchor && resolvedRect ? (state.y - resolvedRect.top) / resolvedRect.height : undefined;
        const peerTrailColor = isValidHexColor(c.trailColor) ? c.trailColor : c.color;
        let track = remoteTrailsRef.current.get(sid);
        if (!track) {
          track = { color: peerTrailColor, points: [], wasDrawing: false };
          remoteTrailsRef.current.set(sid, track);
        } else {
          track.color = peerTrailColor;
        }
        const prevPt = track.points[track.points.length - 1];
        const movedEnough =
          !track.wasDrawing ||
          !prevPt ||
          Math.hypot(docDx - prevPt.dx, docY - prevPt.y) >= 1.5;
        if (movedEnough) {
          track.points.push({
            dx: docDx,
            y: docY,
            mw: c.mw || mainWidth,
            ...(hasBlockAnchor ? { ap: c.ap, ax, ay } : {}),
            t: perfNow,
            breakBefore: !track.wasDrawing,
          });
          if (track.points.length > 900) {
            track.points.splice(0, track.points.length - 900);
          }
          startTrailLoop();
        }
        track.wasDrawing = true;
      } else {
        const track = remoteTrailsRef.current.get(sid);
        if (track) track.wasDrawing = false;
      }

      el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      el.style.opacity = state.visible ? '1' : '0';
    });

    if (needsAnotherFrame) {
      remoteRafRef.current = requestAnimationFrame(stepRemoteInterpolation);
    } else {
      lastFrameTsRef.current = 0;
    }
  }, [computeRemoteTarget, startTrailLoop]);

  const syncHighlightLayerTransform = useCallback(() => {
    if (highlightLayerRef.current) {
      const { scrollY } = layoutCacheRef.current;
      highlightLayerRef.current.style.transform = `translate3d(0, ${-scrollY}px, 0)`;
    }
  }, []);

  const scheduleRemoteSync = useCallback((snapScroll = false) => {
    if (snapScroll) {
      layoutCacheRef.current.scrollY = window.scrollY;
      syncHighlightLayerTransform();
      const mainEl = getMainElement();
      const rectCache = new Map<string, DOMRect | null>();
      const map = getRemoteCursorsMap();
      map.forEach((c, sid) => {
        const el = cursorRefs.current.get(sid);
        const state = remoteSmoothRef.current.get(sid);
        if (!el || !state) return;
        const { tx, ty, visible } = computeRemoteTarget(c, mainEl, rectCache);
        state.x = tx;
        state.y = ty;
        state.tx = tx;
        state.ty = ty;
        state.visible = visible;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        el.style.opacity = visible ? '1' : '0';
      });
      return;
    }

    syncHighlightLayerTransform();
    if (remoteRafRef.current === null) {
      remoteRafRef.current = requestAnimationFrame(stepRemoteInterpolation);
    }
  }, [computeRemoteTarget, stepRemoteInterpolation, syncHighlightLayerTransform]);

  useEffect(() => {
    refreshLayoutMetrics();
    const mainEl = getMainElement();
    let mutationRaf: number | null = null;
    const handleDomShift = () => {
      refreshLayoutMetrics();
      scheduleRemoteSync(true);
      setHighlightLayoutTick((v) => v + 1);
      if (localTrailRef.current.length > 0 || remoteTrailsRef.current.size > 0) {
        startTrailLoop();
      }
    };

    const ro = typeof ResizeObserver !== 'undefined' && mainEl
      ? new ResizeObserver(handleDomShift)
      : null;
    if (ro && mainEl) ro.observe(mainEl);

    const mo = typeof MutationObserver !== 'undefined' && mainEl
      ? new MutationObserver(() => {
          if (mutationRaf === null) {
            mutationRaf = requestAnimationFrame(() => {
              mutationRaf = null;
              handleDomShift();
            });
          }
        })
      : null;
    if (mo && mainEl) {
      mo.observe(mainEl, { childList: true, subtree: true, characterData: true });
    }

    const handleScroll = () => {
      scheduleRemoteSync(true);
      if (localTrailRef.current.length > 0 || remoteTrailsRef.current.size > 0) {
        startTrailLoop();
      }
    };
    const handleResize = handleDomShift;

    const unsub = subscribeCursorFrames(() => scheduleRemoteSync(false));
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    scheduleRemoteSync(false);

    return () => {
      unsub();
      ro?.disconnect();
      mo?.disconnect();
      if (mutationRaf !== null) cancelAnimationFrame(mutationRaf);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (remoteRafRef.current !== null) {
        cancelAnimationFrame(remoteRafRef.current);
        remoteRafRef.current = null;
      }
      if (trailRafRef.current !== null) {
        cancelAnimationFrame(trailRafRef.current);
        trailRafRef.current = null;
      }
    };
  }, [refreshLayoutMetrics, scheduleRemoteSync, startTrailLoop]);

  useEffect(() => {
    if (!config.showClickRipples) return;
    const updates: Record<string, number> = {};
    let hasUpdate = false;

    cursors.forEach((c) => {
      const prevSeq = prevClickSeqRef.current.get(c.sessionId) ?? c.clickSeq;
      if (c.clickSeq > prevSeq) {
        updates[c.sessionId] = c.clickSeq;
        hasUpdate = true;
      }
      prevClickSeqRef.current.set(c.sessionId, c.clickSeq);
    });

    if (hasUpdate) {
      setPulseMap((prev) => ({ ...prev, ...updates }));
    }
  }, [cursors, config.showClickRipples]);

  useEffect(() => {
    if (!shouldOverrideLocalCursor) {
      return;
    }

    refreshLayoutMetrics();
    let selDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const syncSelectionNow = (forceBroadcast: boolean) => {
      const mainEl = getMainElement();
      const { center: mainCenter, width: mainWidth } = getContentMetrics(mainEl);
      layoutCacheRef.current.mainCenter = mainCenter;
      layoutCacheRef.current.mainWidth = mainWidth;
      const scrollY = window.scrollY;
      const { rects, text, selAnchor } = readActiveSelection(mainCenter, scrollY, mainEl);
      const sig = `${text}|${selAnchor?.ap ?? ''}:${selAnchor?.so ?? ''}-${selAnchor?.eo ?? ''}|${rects.length}|${rects[0]?.dx ?? ''},${rects[0]?.y ?? ''},${rects[rects.length - 1]?.w ?? ''}`;
      if (sig === lastSelectionSigRef.current) return;
      lastSelectionSigRef.current = sig;
      if (forceBroadcast) {
        broadcastLocalSelection(rects, text, mainWidth, selAnchor);
      } else {
        setLocalSelectionSnapshot(rects, text, selAnchor);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('#stats-modal-container')) return;
      const mainEl = getMainElement();
      const { center: mainCenter, width: mainWidth } = getContentMetrics(mainEl);
      const scrollY = window.scrollY;
      layoutCacheRef.current.mainCenter = mainCenter;
      layoutCacheRef.current.mainWidth = mainWidth;
      layoutCacheRef.current.scrollY = scrollY;

      if (isClickingRef.current) {
        syncSelectionNow(false);
      }
      const variant = detectElementCursorVariant(target);
      const dx = e.clientX - mainCenter;
      const y = e.clientY + scrollY;
      const anchor = capturePointerAnchor(e.clientX, e.clientY, target, mainEl);
      const isAltHeld = trailsEnabledRef.current && Boolean(e.altKey);

      lastLocalSampleRef.current = { dx, y, variant, clicking: isClickingRef.current, anchor };

      if (isAltHeld) {
        const prev = localTrailRef.current[localTrailRef.current.length - 1];
        const breakBefore = !wasLocalAltRef.current;
        if (breakBefore || !prev || Math.hypot(dx - prev.dx, y - prev.y) >= 2) {
          localTrailRef.current.push({
            dx,
            y,
            mw: mainWidth,
            ...(anchor ? { ap: anchor.ap, ax: anchor.ax, ay: anchor.ay } : {}),
            t: performance.now(),
            breakBefore,
          });
          if (localTrailRef.current.length > 900) {
            localTrailRef.current.splice(0, localTrailRef.current.length - 900);
          }
          startTrailLoop();
        }
        wasLocalAltRef.current = true;
      } else {
        wasLocalAltRef.current = false;
      }

      lastBroadcastedAltRef.current = isAltHeld;
      broadcastLocalCursorMove(dx, y, mainWidth, isClickingRef.current, variant, isAltHeld, anchor);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      isClickingRef.current = true;
      const target = e.target as HTMLElement | null;
      if (target?.closest('#stats-modal-container')) return;
      const mainEl = getMainElement();
      const { center: mainCenter, width: mainWidth } = getContentMetrics(mainEl);
      const variant = detectElementCursorVariant(target);
      const anchor = capturePointerAnchor(e.clientX, e.clientY, target, mainEl);
      broadcastLocalCursorClick(
        e.clientX - mainCenter,
        e.clientY + window.scrollY,
        mainWidth,
        true,
        variant,
        trailsEnabledRef.current && Boolean(e.altKey),
        anchor
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      isClickingRef.current = false;
      syncSelectionNow(true);
      const target = e.target as HTMLElement | null;
      if (target?.closest('#stats-modal-container')) return;
      const mainEl = getMainElement();
      const { center: mainCenter, width: mainWidth } = getContentMetrics(mainEl);
      const variant = detectElementCursorVariant(target);
      const anchor = capturePointerAnchor(e.clientX, e.clientY, target, mainEl);
      broadcastLocalCursorClick(
        e.clientX - mainCenter,
        e.clientY + window.scrollY,
        mainWidth,
        false,
        variant,
        trailsEnabledRef.current && Boolean(e.altKey),
        anchor
      );
    };

    const endLocalAltTrail = () => {
      wasLocalAltRef.current = false;
      if (lastBroadcastedAltRef.current && lastLocalSampleRef.current) {
        lastBroadcastedAltRef.current = false;
        const { mainWidth } = layoutCacheRef.current;
        const sample = lastLocalSampleRef.current;
        broadcastLocalCursorMove(
          sample.dx,
          sample.y,
          mainWidth,
          sample.clicking,
          sample.variant,
          false,
          sample.anchor
        );
      }
    };

    const handleAltKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.altKey) {
        endLocalAltTrail();
      }
    };

    const handleSelectionChange = () => {
      if (selDebounceTimer) clearTimeout(selDebounceTimer);
      selDebounceTimer = setTimeout(() => {
        selDebounceTimer = null;
        syncSelectionNow(true);
      }, 45);
    };

    const handlePageHide = () => {
      endLocalAltTrail();
      broadcastLocalCursorLeave(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('keyup', handleAltKeyUp);
    window.addEventListener('blur', endLocalAltTrail);
    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('unload', handlePageHide);

    return () => {
      if (selDebounceTimer) clearTimeout(selDebounceTimer);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keyup', handleAltKeyUp);
      window.removeEventListener('blur', endLocalAltTrail);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('unload', handlePageHide);
    };
  }, [shouldOverrideLocalCursor, activeSlug, refreshLayoutMetrics, startTrailLoop]);

  useEffect(() => {
    if (!pinnedId) return;
    const handleOutside = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-remote-cursor-root="true"]')) {
        setPinnedId(null);
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [pinnedId]);

  const showCursors = config.enabled && !localHide && cursors.length > 0;
  const showTrailCanvas = config.enabled && config.showTrails !== false && !localHide;
  const showFollowHud = isTelemetryUnlocked && Boolean(followedId && followedPeer);
  const showStealthHud = isTelemetryUnlocked && stealthMode;

  useEffect(() => {
    if (!showTrailCanvas) {
      localTrailRef.current = [];
      remoteTrailsRef.current.clear();
      wasLocalAltRef.current = false;
    }
  }, [showTrailCanvas]);

  if (!showCursors && !showTrailCanvas && !showFollowHud && !showStealthHud) {
    return null;
  }

  const { mainCenter: initMainCenter, mainWidth: initMainWidth, scrollY: initScrollY } = layoutCacheRef.current;
  const mainElForHighlights = showCursors ? getMainElement() : null;
  const liveScrollForHighlights = typeof window !== 'undefined' ? window.scrollY : initScrollY;
  // Re-evaluate local DOM ranges on cursor updates, layout resizes, or slug switches
  void highlightLayoutTick;

  return (
    <>
      {/* Smooth 60fps Alt-Key Cursor Motion Trails (8s decay, 1:1 CSS sizing) */}
      {showTrailCanvas && (
        <canvas
          ref={trailCanvasRef}
          style={{ width: '100%', height: '100%' }}
          className="fixed inset-0 w-full h-full pointer-events-none z-[44] select-none"
          aria-hidden="true"
        />
      )}

      {/* Live remote visitor text highlight rectangles (DOM text-range anchored with content-width fallback) */}
      {showCursors && (
        <div
          className="fixed inset-0 pointer-events-none z-[44] overflow-hidden select-none"
          aria-hidden="true"
        >
          <div
            ref={highlightLayerRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              willChange: 'transform',
              transform: `translate3d(0, ${-liveScrollForHighlights}px, 0)`,
            }}
          >
            {cursors.map((c) => {
              const hasFallbackRects = Boolean(c.selRects && c.selRects.length > 0);
              if (!c.selAnchor && !hasFallbackRects) return null;

              const bgTint = withHexAlpha(c.color, '38', 'rgba(52, 211, 153, 0.22)');
              const lineTint = withHexAlpha(c.color, '99', 'rgba(52, 211, 153, 0.6)');

              const resolvedDomRects: ResolvedHighlightRect[] | null = c.selAnchor
                ? resolveSelectionAnchorToRects(c.selAnchor, c.selText, mainElForHighlights, liveScrollForHighlights)
                : null;

              if (resolvedDomRects && resolvedDomRects.length > 0) {
                return (
                  <div
                    key={`hl-${c.sessionId}`}
                    className={`transition-opacity duration-300 ease-out ${c.leaving ? 'opacity-0' : 'opacity-100'}`}
                  >
                    {resolvedDomRects.map((r, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: r.left,
                          top: r.docTop,
                          width: Math.max(2, r.w),
                          height: r.h,
                          backgroundColor: bgTint,
                          borderBottom: `1.5px solid ${lineTint}`,
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                );
              }

              if (!hasFallbackRects) return null;
              const scale = c.mw > 0 ? Math.max(0.45, Math.min(1.4, initMainWidth / c.mw)) : 1;
              return (
                <div
                  key={`hl-${c.sessionId}`}
                  className={`transition-opacity duration-300 ease-out ${c.leaving ? 'opacity-0' : 'opacity-100'}`}
                >
                  {c.selRects!.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: initMainCenter + r.dx * scale,
                        top: r.y,
                        width: Math.max(2, r.w * scale),
                        height: r.h,
                        backgroundColor: bgTint,
                        borderBottom: `1.5px solid ${lineTint}`,
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live remote visitor cursors */}
      {showCursors && (
        <div
          className="fixed inset-0 pointer-events-none z-[45] overflow-hidden select-none"
          aria-hidden="true"
        >
          {cursors.map((c) => {
            const showIdentifier = isTelemetryUnlocked && (hoveredId === c.sessionId || pinnedId === c.sessionId);
            const isFollowingThis = followedId === c.sessionId;
            const pulseSeq = pulseMap[c.sessionId];
            const variant: MacOsCursorVariant = c.variant || 'default';
            const peerStyle = normalizeCursorStyle(c.cursorStyle);
            const { tipOffsetX, tipOffsetY } = getCursorDimensions(cursorSize, variant, peerStyle);

            return (
              <div
                key={c.sessionId}
                data-remote-cursor-root="true"
                ref={(el) => {
                  if (el) {
                    cursorRefs.current.set(c.sessionId, el);
                    scheduleRemoteSync(false);
                  } else {
                    cursorRefs.current.delete(c.sessionId);
                    remoteSmoothRef.current.delete(c.sessionId);
                  }
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  opacity: 0,
                }}
                className="pointer-events-none"
              >
                {/* Click ripple centered at tip hotspot (0, 0) */}
                {config.showClickRipples && pulseSeq !== undefined && (
                  <span
                    key={`pulse-${pulseSeq}`}
                    className="absolute -left-3 -top-3 w-6 h-6 rounded-full pointer-events-none animate-[ping_320ms_cubic-bezier(0,0,0.2,1)_1]"
                    style={{
                      border: `1.5px solid ${c.color}`,
                      opacity: 0,
                    }}
                  />
                )}

                {/* macOS SVG Cursor anchored with active hotspot at (0, 0) */}
                <div
                  style={{ transform: `translate(${tipOffsetX}px, ${tipOffsetY}px)` }}
                  className={
                    isTelemetryUnlocked
                      ? 'pointer-events-auto relative inline-block'
                      : 'pointer-events-none relative inline-block'
                  }
                  onMouseEnter={isTelemetryUnlocked ? () => setHoveredId(c.sessionId) : undefined}
                  onMouseLeave={
                    isTelemetryUnlocked
                      ? () => setHoveredId((prev) => (prev === c.sessionId ? null : prev))
                      : undefined
                  }
                  onClick={
                    isTelemetryUnlocked
                      ? (e) => {
                          e.stopPropagation();
                          setPinnedId((prev) => (prev === c.sessionId ? null : c.sessionId));
                        }
                      : undefined
                  }
                >
                  <div
                    className={`transition-[opacity,transform] duration-300 ease-out ${
                      c.leaving
                        ? 'opacity-0 scale-75'
                        : c.clicking
                          ? 'opacity-100 scale-90'
                          : 'opacity-100 scale-100'
                    }`}
                  >
                    <MacOsCursorSvg size={cursorSize} variant={variant} style={peerStyle} />
                  </div>

                  {/* Telemetry-unlocked identifier popout */}
                  {showIdentifier && (
                    <div
                      className="absolute left-5 top-4 z-50 min-w-[172px] max-w-[260px] px-2.5 py-2 rounded-lg bg-surface/95 border border-line shadow-lg text-left pointer-events-auto backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-ink tabular-nums whitespace-nowrap">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.visitorId}
                        </span>
                        <span className="font-mono text-[9px] text-good-text uppercase whitespace-nowrap">
                          {pinnedId === c.sessionId ? 'PINNED' : 'LIVE'}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-ink-muted whitespace-nowrap">
                        {c.browser} · {c.os}
                      </div>
                      <div className="mt-0.5 font-mono text-[9.5px] text-ink-subtle tabular-nums whitespace-nowrap">
                        dx {Math.round(c.dx)}px · y {Math.round(c.y)}px · {getCursorPackMeta(peerStyle).name}
                      </div>
                      {c.selText && (
                        <div
                          className="mt-1 px-1.5 py-1 rounded text-[10px] font-mono text-ink line-clamp-2 break-words"
                          style={{
                            backgroundColor: withHexAlpha(c.color, '22', 'rgba(52, 211, 153, 0.14)'),
                            borderLeft: `2px solid ${c.color}`,
                          }}
                        >
                          &ldquo;{c.selText}&rdquo;
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFollowedId(isFollowingThis ? null : c.sessionId)}
                        className={`mt-1.5 w-full px-2 py-1 rounded text-[10px] font-mono font-semibold border transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                          isFollowingThis
                            ? 'bg-good-soft text-good-text border-good-border'
                            : 'bg-surface-alt hover:bg-accent-soft text-ink hover:text-accent-text border-line'
                        }`}
                      >
                        <Navigation className="w-3 h-3" />
                        {isFollowingThis ? 'Unlock Scroll' : 'Follow Scroll'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Telemetry-only Inspection HUDs */}
      {(showStealthHud || (showFollowHud && followedPeer)) && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[48] pointer-events-none flex flex-wrap items-center justify-center gap-2 max-w-[95vw]">
          {showStealthHud && (
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/95 border border-accent-border shadow-xl backdrop-blur-sm font-mono text-[11px] text-accent-text select-none">
              <Shield className="w-3.5 h-3.5 text-accent-text shrink-0" />
              <span className="font-semibold whitespace-nowrap">STEALTH INSPECTION</span>
              <span className="text-line hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-ink-muted hidden sm:inline whitespace-nowrap">Hidden from peers</span>
              <button
                type="button"
                onClick={() => setStealthMode(false)}
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft hover:bg-accent border border-accent-border text-[10px] text-accent-text hover:text-accent-ink transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                Exit
              </button>
            </div>
          )}

          {showFollowHud && followedPeer && (
            <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface/95 border border-good-border shadow-xl backdrop-blur-sm font-mono text-[11px] text-ink select-none">
              <span
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: followedPeer.color }}
              />
              <span className="font-semibold whitespace-nowrap">
                FOLLOWING {followedPeer.visitorId}
              </span>
              <span className="text-line" aria-hidden="true">·</span>
              <span className="text-good-text whitespace-nowrap">/{followedPeer.slug || 'home'}</span>
              <span className="text-line hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-ink-muted tabular-nums hidden sm:inline whitespace-nowrap">
                y:{Math.round(followedPeer.y)}px
              </span>
              <button
                type="button"
                onClick={() => setFollowedId(null)}
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn-soft hover:bg-warn-border border border-warn-border text-[10px] text-warn-text transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                Unlock
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
