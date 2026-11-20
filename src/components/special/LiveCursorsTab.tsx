import React, { useState, useEffect, useMemo } from 'react';
import {
  MousePointer2,
  Eye,
  EyeOff,
  Radio,
  Users,
  Sparkles,
  Scaling,
  Navigation,
  Shield,
  Palette,
  Check,
  Wand2,
  RotateCcw,
} from 'lucide-react';
import MacOsCursorSvg, {
  CURSOR_PACKS,
  getCursorDimensions,
  getCursorPackMeta,
  normalizeCursorStyle,
} from './MacOsCursorSvg';
import {
  useCursorsConfig,
  useLocalCursorHide,
  useLocalCursorStyle,
  useLocalTrailColor,
  useStealthInspection,
  useRemoteCursors,
  useAllRemotePeers,
  useFollowedSessionId,
  useCursorTransportStatus,
  broadcastCursorConfigUpdate,
  isDesktopPointerCapable,
  getVisitorColor,
} from '../../utils/cursorSync';
import { detectClientEnvironment } from '../../utils/deviceInfo';

interface LiveCursorsTabProps {
  visitorId: string;
  activeSlug: string;
  onJumpToPeer?: (slug: string) => void;
}

const SIZE_PRESETS = [
  { label: 'Micro', size: 6 },
  { label: 'Compact', size: 11 },
  { label: 'Default', size: 16.5 },
  { label: 'Large', size: 22 },
];

const TRAIL_COLOR_SWATCHES = [
  '#34d399',
  '#38bdf8',
  '#fbbf24',
  '#f472b6',
  '#a78bfa',
  '#fb7185',
  '#fb923c',
  '#e4e4e7',
];

export default function LiveCursorsTab({ visitorId, activeSlug, onJumpToPeer }: LiveCursorsTabProps) {
  const config = useCursorsConfig();
  const [localHide, setLocalHide] = useLocalCursorHide();
  const [localCursorStyle, setLocalCursorStyle] = useLocalCursorStyle();
  const [localTrailColor, setLocalTrailColor] = useLocalTrailColor();
  const [stealthMode, setStealthMode] = useStealthInspection();
  const remoteCursors = useRemoteCursors();
  const allPeers = useAllRemotePeers(true);
  const [followedId, setFollowedId] = useFollowedSessionId();
  const transport = useCursorTransportStatus();

  const sortedPeers = useMemo(() => {
    return [...allPeers].sort((a, b) => {
      const aHere = (a.slug || 'home') === activeSlug ? 1 : 0;
      const bHere = (b.slug || 'home') === activeSlug ? 1 : 0;
      if (aHere !== bHere) return bHere - aHere;
      return b.ts - a.ts;
    });
  }, [allPeers, activeSlug]);

  const [specimenHovered, setSpecimenHovered] = useState(false);
  const [specimenPinned, setSpecimenPinned] = useState(false);
  const [specimenClicks, setSpecimenClicks] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const isDesktop = isDesktopPointerCapable();
  const localEnv = detectClientEnvironment();
  const localColor = getVisitorColor(visitorId);
  const trailsGloballyEnabled = config.showTrails !== false;
  const cursorSize = typeof config.cursorSize === 'number' && Number.isFinite(config.cursorSize) ? config.cursorSize : 16.5;
  const [sizeInput, setSizeInput] = useState(() => String(cursorSize));
  const activePack = getCursorPackMeta(localCursorStyle);
  const { width: arrowW, height: arrowH } = getCursorDimensions(cursorSize, 'default', localCursorStyle);
  const sliderPct = Math.max(0, Math.min(100, ((cursorSize - 5) / (42 - 5)) * 100));

  useEffect(() => {
    setSizeInput(String(cursorSize));
  }, [cursorSize]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const transportLabel = transport.wsConnected && transport.firestoreConnected
    ? 'WS + Firestore'
    : transport.wsConnected
      ? 'WebSocket'
      : transport.firestoreConnected
        ? 'Firestore'
        : transport.broadcastConnected
          ? 'Local Tab'
          : 'Connecting';

  const handleToggleGlobal = () => {
    broadcastCursorConfigUpdate({ enabled: !config.enabled }, visitorId);
  };

  const handleToggleRipples = () => {
    broadcastCursorConfigUpdate({ showClickRipples: !config.showClickRipples }, visitorId);
  };

  const handleToggleTrails = () => {
    broadcastCursorConfigUpdate({ showTrails: !trailsGloballyEnabled }, visitorId);
  };

  const handleCursorSizeChange = (nextSize: number) => {
    if (!Number.isFinite(nextSize)) return;
    const clamped = Math.max(5, Math.min(42, Math.round(nextSize * 10) / 10));
    setSizeInput(String(clamped));
    broadcastCursorConfigUpdate({ cursorSize: clamped }, visitorId);
  };

  const updatedTimeLabel = config.updatedAt > 0
    ? new Date(config.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Default';

  const showSpecimenPopout = specimenHovered || specimenPinned;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2 text-[#cbd5e1] font-mono">
      {/* Slim Header & Global Quick Toggles */}
      <div className="shrink-0 px-2.5 py-1.5 bg-[#090f0c] border border-[#1b261e] rounded flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            {config.enabled && (transport.wsConnected || transport.firestoreConnected) && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                config.enabled ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>
          <span className="text-emerald-400 font-bold tracking-wide whitespace-nowrap">
            Live Cursors
          </span>
          <span className="text-[#354639]" aria-hidden="true">/</span>
          <span className="text-[#7c9480] truncate">{transportLabel}</span>
          <span className="text-[#354639] hidden md:inline" aria-hidden="true">·</span>
          <span className="text-[10px] text-[#5c7361] hidden md:inline whitespace-nowrap">
            Hold <strong className="text-[#a4c9ad]">Alt + Move</strong> for 8s trail
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] shrink-0">
          <button
            type="button"
            onClick={handleToggleGlobal}
            className={`px-2 py-0.5 rounded border font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
              config.enabled
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700/80 hover:bg-red-950/70 hover:text-red-200 hover:border-red-800/70'
                : 'bg-red-950/60 text-red-200 border-red-800/70 hover:bg-emerald-950/80 hover:text-emerald-200'
            }`}
            title={`Global cursors (${updatedTimeLabel} by ${config.updatedBy || 'SYSTEM'})`}
          >
            <Radio className="w-3 h-3" />
            <span>Global: {config.enabled ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleRipples}
            className={`px-2 py-0.5 rounded border font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
              config.showClickRipples
                ? 'bg-[#0e1510] text-emerald-300 border-emerald-800/70'
                : 'bg-[#070b08] text-[#7c9480] border-[#1c2820] hover:text-[#cbd5e1]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Ripples: {config.showClickRipples ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTrails}
            className={`px-2 py-0.5 rounded border font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
              trailsGloballyEnabled
                ? 'bg-[#0e1510] text-emerald-300 border-emerald-800/70'
                : 'bg-red-950/60 text-red-200 border-red-800/70'
            }`}
            title="Enable or disable Alt-key cursor motion trails globally for all visitors"
          >
            <Wand2 className="w-3 h-3" />
            <span>Trails: {trailsGloballyEnabled ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStealthMode(!stealthMode)}
            className={`px-2 py-0.5 rounded border font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
              stealthMode
                ? 'bg-amber-950/70 text-amber-200 border-amber-700/80'
                : 'bg-[#070b08] text-[#7c9480] border-[#1c2820] hover:text-[#cbd5e1]'
            }`}
            title="Hide your cursor footprint from peers while still observing live cursors"
          >
            <Shield className="w-3 h-3" />
            <span>Stealth: {stealthMode ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLocalHide(!localHide)}
            className={`px-2 py-0.5 rounded border font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
              localHide
                ? 'bg-amber-950/70 text-amber-200 border-amber-700/80'
                : 'bg-[#070b08] text-[#a4c9ad] border-[#1c2820] hover:border-[#2a3c2e]'
            }`}
            title="Pause/resume cursor overrides on this browser only"
          >
            {localHide ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>Local: {localHide ? 'Paused' : 'Active'}</span>
          </button>
        </div>
      </div>

      {/* True Vertical Split: Left 50% Compact Controls | Right 50% Full-Height Active Cursors Roster */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* LEFT HALF (50% Vertical): Compact Specimen, Size Slider, Cursor Design & Personal Trail Color */}
        <div className="min-h-0 overflow-y-auto flex flex-col gap-2 pr-0.5">
          {/* Specimen & Size Slider */}
          <div className="bg-[#0a0f0c] border border-[#18231a] rounded p-2.5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between text-[10.5px] text-[#7c9480]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#a4c9ad] min-w-0 truncate">
                <MousePointer2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{activePack.name}</span>
                <span className="text-[9.5px] text-[#5c7361] font-normal">({activePack.badge})</span>
              </span>
              <span className="text-[10px] text-[#5c7361] tabular-nums shrink-0">
                {arrowW}×{arrowH}px · {isDesktop ? 'Desktop' : 'Viewer'}
              </span>
            </div>

            <div
              className="relative h-14 rounded bg-[#060a08] border border-[#141e16] flex items-center justify-around px-3 select-none"
              style={{
                backgroundImage:
                  'radial-gradient(color-mix(in srgb, var(--ui-accent) 24%, transparent) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
              onClick={() => setSpecimenPinned(false)}
            >
              <div
                className="relative flex items-center gap-2 cursor-pointer"
                onMouseEnter={() => setSpecimenHovered(true)}
                onMouseLeave={() => setSpecimenHovered(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSpecimenClicks((c) => c + 1);
                  setSpecimenPinned((prev) => !prev);
                }}
                title="Hover or click to preview telemetry ID"
              >
                {config.showClickRipples && specimenClicks > 0 && (
                  <span
                    key={specimenClicks}
                    className="absolute -left-2 -top-2 w-5 h-5 rounded-full pointer-events-none animate-[ping_320ms_cubic-bezier(0,0,0.2,1)_1]"
                    style={{ border: `1.5px solid ${localColor}`, opacity: 0 }}
                  />
                )}
                <MacOsCursorSvg size={Math.min(cursorSize, 22)} variant="default" style={localCursorStyle} />
                <span className="text-[9.5px] text-[#6d8471]">Default</span>

                {showSpecimenPopout && (
                  <div
                    className="absolute left-4 top-2 z-20 min-w-[152px] px-2 py-1 rounded bg-[#0a0f0c]/95 border border-[#233527] shadow-lg text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#e0e7e0] tabular-nums">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: localColor }} />
                        {visitorId}
                      </span>
                      <span className="text-[8.5px] text-emerald-400">LIVE</span>
                    </div>
                    <div className="text-[9.5px] text-[#7c9480] truncate">
                      {localEnv.browser} · {localEnv.os}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <MacOsCursorSvg size={Math.min(cursorSize, 22)} variant="pointer" style={localCursorStyle} />
                <span className="text-[9.5px] text-[#6d8471]">Clicking</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MacOsCursorSvg size={Math.min(cursorSize, 22)} variant="text" style={localCursorStyle} />
                <span className="text-[9.5px] text-[#6d8471]">Typing</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#e0e7e0]">
                  <Scaling className="w-3 h-3 text-emerald-400" />
                  <span>Size</span>
                </span>
                <div className="flex items-center gap-1">
                  {SIZE_PRESETS.map((preset) => {
                    const isActive = cursorSize === preset.size;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleCursorSizeChange(preset.size)}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium border transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700/80'
                            : 'bg-[#070b08] text-[#7c9480] border-[#18231a] hover:text-[#e0e7e0]'
                        }`}
                      >
                        {preset.size}
                      </button>
                    );
                  })}
                  <input
                    type="number"
                    min={5}
                    max={42}
                    step={0.1}
                    value={sizeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSizeInput(val);
                      const parsed = parseFloat(val);
                      if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 42) {
                        broadcastCursorConfigUpdate({ cursorSize: Math.round(parsed * 10) / 10 }, visitorId);
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(sizeInput);
                      handleCursorSizeChange(Number.isFinite(parsed) ? parsed : 16.5);
                    }}
                    aria-label="Global cursor decimal size in pixels"
                    className="w-12 px-1 py-0.5 rounded bg-[#060a08] border border-[#1d2b20] text-[10.5px] font-bold text-emerald-300 text-right tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-[#7c9480]">px</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9.5px] text-[#6d8471] tabular-nums shrink-0">5</span>
                <input
                  type="range"
                  min={5}
                  max={42}
                  step={0.5}
                  value={cursorSize}
                  onChange={(e) => handleCursorSizeChange(parseFloat(e.target.value))}
                  aria-label="Global cursor size"
                  style={{ '--slider-pct': `${sliderPct}%` } as React.CSSProperties}
                  className="bw-themed-slider flex-1 cursor-pointer"
                />
                <span className="text-[9.5px] text-[#6d8471] tabular-nums shrink-0">42</span>
              </div>
            </div>
          </div>

          {/* Personal Cursor Design Switcher */}
          <div className="bg-[#0a0f0c] border border-[#18231a] rounded p-2.5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between gap-2 text-[10.5px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#e0e7e0]">
                <Palette className="w-3 h-3 text-emerald-400" />
                <span>Personal Cursor Design</span>
              </span>
              <span className="text-[9.5px] text-[#7c9480] whitespace-nowrap">
                Live sync · Persistent
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CURSOR_PACKS.map((pack) => {
                const isSelected = localCursorStyle === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setLocalCursorStyle(pack.id)}
                    title={pack.description}
                    className={`text-left rounded px-2 py-1.5 border transition-colors cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-700/80 ring-1 ring-emerald-500/40'
                        : 'bg-[#070b08] border-[#18231a] hover:border-[#2a3c2e] hover:bg-[#0e1510]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10.5px] font-bold text-[#e0e7e0] truncate">{pack.name}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-semibold border shrink-0 ${
                          isSelected
                            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700/80'
                            : 'bg-[#090d0b] text-[#7c9480] border-[#1c2820]'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                        {pack.badge}
                      </span>
                    </div>

                    <div className="h-6 rounded bg-[#060a08] border border-[#141e16] px-1.5 flex items-center justify-around">
                      <MacOsCursorSvg size={13.5} variant="default" style={pack.id} />
                      <MacOsCursorSvg size={13.5} variant="pointer" style={pack.id} />
                      <MacOsCursorSvg size={13.5} variant="text" style={pack.id} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-User Alt-Motion Trail Color (Personal Only, Persistent) */}
          <div className="bg-[#0a0f0c] border border-[#18231a] rounded p-2.5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between gap-2 text-[10.5px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#e0e7e0]">
                <Wand2 className="w-3 h-3 text-emerald-400" />
                <span>Your Trail Color (Personal)</span>
              </span>
              <span className="text-[9.5px] text-[#7c9480] tabular-nums">
                8s Fade · {trailsGloballyEnabled ? 'Active' : 'Disabled Globally'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {TRAIL_COLOR_SWATCHES.map((hex) => {
                  const selected = localTrailColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setLocalTrailColor(hex)}
                      aria-label={`Select trail color ${hex}`}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        selected ? 'scale-110 ring-2 ring-white/70 border-white' : 'border-[#253628] hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
                <label
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#070b08] border border-[#1c2820] text-[9.5px] text-[#a4c9ad] cursor-pointer hover:border-[#2a3c2e]"
                  title="Pick any custom hex color for your personal Alt-motion trail"
                >
                  <input
                    type="color"
                    value={localTrailColor}
                    onChange={(e) => setLocalTrailColor(e.target.value)}
                    aria-label="Custom personal trail color"
                    className="w-3.5 h-3.5 bg-transparent border-0 p-0 cursor-pointer"
                  />
                  <span className="tabular-nums uppercase">{localTrailColor}</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setLocalTrailColor(localColor)}
                className="px-2 py-0.5 rounded text-[9.5px] bg-[#070b08] border border-[#18231a] text-[#7c9480] hover:text-[#e0e7e0] inline-flex items-center gap-1 cursor-pointer shrink-0"
                title="Reset trail color to your visitor badge color"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT HALF (50% Vertical): Prioritized Full-Height Active Cursors Across Wiki */}
        <div className="min-h-[300px] lg:min-h-0 bg-[#0a0f0c] border border-[#18231a] rounded p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#18231a] pb-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e0e7e0]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Active Cursors Across Wiki
            </span>
            <span className="text-[11px] text-[#7c9480] tabular-nums">
              {allPeers.length} Active · {remoteCursors.length} on /{activeSlug}
            </span>
          </div>

          {sortedPeers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-xs text-[#6d8471]">
              <p>No remote desktop cursors detected across the wiki.</p>
              <p className="text-[11px] text-[#4f6454] mt-1 max-w-xs">
                Open any wiki page in another desktop window or device to observe live synced coordinates.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left border-collapse text-[11px] tabular-nums">
                <thead className="sticky top-0 bg-[#0a0f0c] z-10">
                  <tr className="border-b border-[#18231a] text-[9.5px] text-[#6d8471] uppercase">
                    <th className="py-1.5 pr-2.5 font-semibold">Visitor</th>
                    <th className="py-1.5 pr-2.5 font-semibold">Env</th>
                    <th className="py-1.5 pr-2.5 font-semibold">Highlight</th>
                    <th className="py-1.5 pr-2.5 font-semibold">Page</th>
                    <th className="py-1.5 pr-2.5 font-semibold text-right">Pos</th>
                    <th className="py-1.5 pr-2.5 font-semibold text-right">Ping</th>
                    <th className="py-1.5 font-semibold text-right">Lock</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPeers.map((c) => {
                    const ageSec = Math.max(0, Math.floor((nowMs - c.ts) / 1000));
                    const peerSlug = c.slug || 'home';
                    const isFollowing = followedId === c.sessionId;
                    return (
                      <tr
                        key={c.sessionId}
                        className="h-9 border-b border-[#131b15] last:border-b-0 hover:bg-[#0e1511] transition-colors"
                      >
                        <td className="py-1.5 pr-2.5 font-semibold text-[#e0e7e0] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            />
                            <MacOsCursorSvg
                              size={11.5}
                              variant="default"
                              style={normalizeCursorStyle(c.cursorStyle)}
                              className="shrink-0"
                            />
                            <span>{c.visitorId}</span>
                          </span>
                        </td>
                        <td className="py-1.5 pr-2.5 text-[#8ea592] whitespace-nowrap">
                          {c.browser} · {c.os}
                        </td>
                        <td className="py-1.5 pr-2.5 max-w-[135px] truncate text-[#cbd5e1]">
                          {c.selText ? (
                            <span className="italic text-[#d9eadc]">&ldquo;{c.selText}&rdquo;</span>
                          ) : (
                            <span className="text-[#4f6454]">—</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2.5 text-emerald-400/90 whitespace-nowrap">
                          /{peerSlug}
                        </td>
                        <td className="py-1.5 pr-2.5 text-right text-[#cbd5e1] whitespace-nowrap">
                          {Math.round(c.dx)},{Math.round(c.y)}
                        </td>
                        <td className="py-1.5 pr-2.5 text-right text-[#7c9480] whitespace-nowrap">
                          {ageSec}s
                        </td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (isFollowing) {
                                setFollowedId(null);
                              } else {
                                setFollowedId(c.sessionId);
                                onJumpToPeer?.(peerSlug);
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                              isFollowing
                                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80 hover:bg-red-950/70 hover:text-red-200 hover:border-red-700/80'
                                : 'bg-[#0e1611] hover:bg-[#16231a] text-[#a4c9ad] border-[#253628]'
                            }`}
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            {isFollowing ? 'Following' : peerSlug === activeSlug ? 'Follow' : 'Jump'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
