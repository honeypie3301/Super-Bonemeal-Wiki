import React, { useEffect, useRef } from 'react';
import { Sparkles, Moon, Sun, Sunset } from 'lucide-react';
import { useTheme, WIKI_THEMES, WikiTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

function ThemeIcon({ theme }: { theme: WikiTheme }) {
  switch (theme) {
    case 'starlight':
      return <Sparkles className="w-3.5 h-3.5 text-zinc-100 group-hover:scale-110 transition-transform duration-200" />;
    case 'archival-dusk':
      return <Sunset className="w-3.5 h-3.5 text-accent-text group-hover:scale-110 transition-transform duration-200" />;
    case 'warm-archival':
      return <Sun className="w-3.5 h-3.5 text-accent-text group-hover:scale-110 transition-transform duration-200" />;
    case 'emerald':
    default:
      return <Moon className="w-3.5 h-3.5 text-accent-text group-hover:scale-110 transition-transform duration-200" />;
  }
}

function ThemeToggle({
  className = '',
  size = 'md',
}: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastWheelAtRef = useRef(0);

  const currentIdx = Math.max(
    0,
    WIKI_THEMES.findIndex((t) => t.id === theme)
  );
  const activeMeta = WIKI_THEMES[currentIdx];
  const nextMeta = WIKI_THEMES[(currentIdx + 1) % WIKI_THEMES.length];
  const isStarlight = theme === 'starlight';

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4 && Math.abs(e.deltaX) < 4) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheelAtRef.current < 140) return;
      lastWheelAtRef.current = now;
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      cycleTheme(delta > 0 ? 1 : -1);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [cycleTheme]);

  const btnHeight = size === 'sm' ? 'h-8' : 'h-8';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => cycleTheme(1)}
      id="theme-toggle-button"
      className={`relative ${btnHeight} px-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 cursor-pointer group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isStarlight
          ? 'bg-neutral-900 border-zinc-600 text-zinc-100 hover:bg-neutral-800 shadow-[0_0_10px_rgba(255,255,255,0.14)]'
          : 'border-line bg-surface-alt text-accent-text hover:bg-surface hover:border-accent/60'
      } ${className}`}
      title={`Theme: ${activeMeta.label} — Click or scroll to cycle (${nextMeta.label} next)`}
      aria-label={`Active theme ${activeMeta.label}. Click or scroll to cycle themes.`}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-3.5 w-3.5 shrink-0 rounded-xs border border-line overflow-hidden"
      >
        <span className="w-1/2 h-full" style={{ backgroundColor: activeMeta.swatchBg }} />
        <span className="w-1/2 h-full" style={{ backgroundColor: activeMeta.swatchAccent }} />
      </span>
      <ThemeIcon theme={theme} />
      <span className="sr-only">
        Active theme: {activeMeta.label}. Click or scroll to switch themes.
      </span>
    </button>
  );
}

export default React.memo(ThemeToggle);
