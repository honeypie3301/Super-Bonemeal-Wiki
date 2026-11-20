import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface WikiOption {
  id: string;
  title: string;
  url?: string;
  fallbackUrls?: string[];
}

export const WIKI_OPTIONS: WikiOption[] = [
  {
    id: 'super_bonemeal',
    title: 'SUPER BONEMEAL',
    url: '#/wiki/home'
  },
  {
    id: 'backwoods',
    title: 'BACKWOODS',
    url: 'https://honeypie3301.github.io/Backwoods-Wiki/#/wiki/home',
    fallbackUrls: ['https://backwoods-wiki.vercel.app/']
  },
  {
    id: 'darwinism',
    title: 'DARWINISM',
    url: 'https://honeypie3301.github.io/Darwinism-Wiki/#/wiki/home',
    fallbackUrls: []
  }
];

const PROBE_TIMEOUT_MS = 2500;

async function isUrlReachable(candidateUrl: string): Promise<boolean> {
  const probeUrl = candidateUrl.split('#')[0];
  let hostname = '';
  try {
    hostname = new URL(probeUrl).hostname.toLowerCase();
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(probeUrl, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return false;
    }
    if (hostname.endsWith('.github.io')) {
      return false;
    }
    const fallbackController = new AbortController();
    const fallbackTimeout = setTimeout(() => fallbackController.abort(), PROBE_TIMEOUT_MS);
    try {
      await fetch(probeUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: fallbackController.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(fallbackTimeout);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveWikiDestination(option: WikiOption): Promise<string | undefined> {
  const candidates = [
    ...(option.url ? [option.url] : []),
    ...(option.fallbackUrls ?? []),
  ];
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  for (const candidate of candidates) {
    if (await isUrlReachable(candidate)) {
      return candidate;
    }
  }

  return option.fallbackUrls?.[0] ?? option.url;
}

export default function TitleDialPicker() {
  const [position, setPosition] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartPos = useRef<number>(0);
  const animFrameId = useRef<number | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettling = useRef<boolean>(false);
  const isAutoResetting = useRef<boolean>(false);
  const navRequestIdRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      setContainerWidth(el.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateWidth();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const isCompact = containerWidth > 0 && containerWidth < 340;
  const itemHeight = isCompact ? 64 : 52;
  const viewportHeight = isCompact ? 70 : 56;

  const titleTypographyStyle: React.CSSProperties | undefined = (() => {
    if (containerWidth <= 0) return undefined;

    if (isCompact) {
      const compactSize = Math.max(18, Math.min(26, containerWidth * 0.082));
      return {
        fontSize: `${compactSize}px`,
        letterSpacing: '0.06em',
        lineHeight: 1.08,
      };
    }

    const ratio = Math.max(0, Math.min(1, (containerWidth - 340) / 440));
    const trackingEm = 0.04 + ratio * 0.14;
    const divisor = 12.6 + trackingEm * 10;
    const computedFontSize = Math.max(20, Math.min(48, (containerWidth - 16) / divisor));

    return {
      fontSize: `${computedFontSize}px`,
      letterSpacing: `${trackingEm.toFixed(3)}em`,
      lineHeight: 1.1,
    };
  })();

  // Reset to Super Bonemeal (0) on mount, focus, pageshow, popstate, or visibilitychange
  useEffect(() => {
    const handleReset = () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      isSettling.current = false;
      isAutoResetting.current = false;
      navRequestIdRef.current += 1;
      setIsDragging(false);
      setPosition(0);
      setSelectedIndex(0);
    };

    handleReset();

    const handleVisibility = () => {
      if (!document.hidden) {
        handleReset();
      }
    };

    window.addEventListener('pageshow', handleReset);
    window.addEventListener('focus', handleReset);
    window.addEventListener('popstate', handleReset);
    window.addEventListener('hashchange', handleReset);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pageshow', handleReset);
      window.removeEventListener('focus', handleReset);
      window.removeEventListener('popstate', handleReset);
      window.removeEventListener('hashchange', handleReset);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const animateToTarget = useCallback((targetIndex: number, shouldTriggerSettle: boolean = true) => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }

    isSettling.current = true;

    const step = () => {
      setPosition(prev => {
        const diff = targetIndex - prev;
        if (Math.abs(diff) < 0.005) {
          isSettling.current = false;
          setSelectedIndex(targetIndex);
          if (shouldTriggerSettle) {
            handleSettleOption(targetIndex);
          }
          return targetIndex;
        }
        return prev + diff * 0.22;
      });

      if (isSettling.current) {
        animFrameId.current = requestAnimationFrame(step);
      }
    };

    animFrameId.current = requestAnimationFrame(step);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettleOption = useCallback((index: number) => {
    if (isAutoResetting.current) {
      isAutoResetting.current = false;
      return;
    }

    const targetOption = WIKI_OPTIONS[index];
    if (!targetOption) return;

    if (index !== 0) {
      const requestId = ++navRequestIdRef.current;

      void (async () => {
        const destination = await resolveWikiDestination(targetOption);
        if (destination && requestId === navRequestIdRef.current) {
          window.location.href = destination;
        }
      })();

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        isAutoResetting.current = true;
        animateToTarget(0, false);
      }, 350);
    } else {
      navRequestIdRef.current += 1;
      if (window.location.hash !== '#/wiki/home' && window.location.hash !== '') {
        window.location.hash = '#/wiki/home';
      }
    }
  }, [animateToTarget]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    setPosition(currentPos => {
      const targetIndex = Math.max(0, Math.min(WIKI_OPTIONS.length - 1, Math.round(currentPos)));
      animateToTarget(targetIndex, true);
      return currentPos;
    });
  }, [isDragging, animateToTarget]);

  const handlePointerDown = (clientY: number) => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    isAutoResetting.current = false;
    navRequestIdRef.current += 1;

    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartPos.current = position;
  };

  const handlePointerMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - dragStartY.current;
    const posDelta = -deltaY / itemHeight;
    const rawPos = dragStartPos.current + posDelta;

    let boundedPos = rawPos;
    if (rawPos < 0) {
      boundedPos = rawPos * 0.3;
    } else if (rawPos > WIKI_OPTIONS.length - 1) {
      boundedPos = (WIKI_OPTIONS.length - 1) + (rawPos - (WIKI_OPTIONS.length - 1)) * 0.3;
    }

    setPosition(boundedPos);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handlePointerMove(e.clientY);
    };

    const onGlobalMouseUp = () => {
      if (isDragging) handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onGlobalMouseMove);
      window.addEventListener('mouseup', onGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [isDragging, handleDragEnd]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isDragging) return;

    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    isAutoResetting.current = false;

    const delta = e.deltaY > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(WIKI_OPTIONS.length - 1, selectedIndex + delta));
    if (nextIndex !== selectedIndex) {
      animateToTarget(nextIndex, true);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={handleWheel}
      style={{ height: `${viewportHeight}px` }}
      className="@container relative overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none flex items-center justify-center w-full"
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '400px', transformStyle: 'preserve-3d' }}
      >
        {WIKI_OPTIONS.map((opt, idx) => {
          const offset = idx - position;
          const absOffset = Math.abs(offset);

          if (absOffset > 2.0) return null;

          const translateY = offset * itemHeight;
          const rotateX = -offset * 35;
          const scale = Math.max(0.7, 1 - absOffset * 0.15);
          const opacity = Math.max(0, 1 - absOffset * 0.85);
          const isCenter = absOffset < 0.35;

          return (
            <h1
              key={opt.id}
              onClick={() => {
                if (!isDragging && idx !== selectedIndex) {
                  animateToTarget(idx, true);
                }
              }}
              style={{
                height: `${itemHeight}px`,
                transform: `translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
                opacity: opacity,
                zIndex: Math.round(10 - absOffset * 2),
                ...titleTypographyStyle,
              }}
              className={`
                absolute left-0 right-0 flex items-center justify-center px-1 text-center
                font-display text-[clamp(1.25rem,6cqi,3rem)] font-bold tracking-[clamp(0.04em,0.8cqi,0.18em)] uppercase transition-all duration-75 select-none
                ${isCompact ? 'whitespace-normal text-balance' : 'whitespace-nowrap'}
                ${isCenter ? 'text-ink' : 'text-accent-text'}
              `}
            >
              {opt.title}
            </h1>
          );
        })}
      </div>
    </div>
  );
}
