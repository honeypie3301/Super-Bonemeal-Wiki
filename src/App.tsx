import React, { useEffect, useState, useDeferredValue, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, Search, X, BookOpen, AlertCircle, HelpCircle, FileText, FileSearch } from 'lucide-react';
import { WikiArticle } from './types';
import { WIKI_ARTICLES, WIKI_SEARCH_DATABASE } from './data/wikiData';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';
import { detectClientEnvironment } from './utils/deviceInfo';
import { trackTelemetryClick, trackHoneyProbe } from './utils/telemetry';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import StarlightBackground from './components/special/StarlightBackground';
import {
  hasPersistedTelemetryUnlockHint,
  getPersistedAdminToken,
  validatePersistedAdminToken,
  isAuthorizedFirebaseUser,
  persistTelemetryHint,
  subscribeTelemetryTokenChanges,
  clearPersistedAdminToken,
} from './utils/telemetryAuth';

const LiveCursorsOverlay = React.lazy(() => import('./components/special/LiveCursorsOverlay'));
const StatsModal = React.lazy(() => import('./components/StatsModal'));

function WikiContainer() {
  const { theme } = useTheme();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [articles] = useState<WikiArticle[]>(WIKI_ARTICLES);
  const [articlesContent] = useState<Record<string, string>>(WIKI_SEARCH_DATABASE);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [isTerminalAuthorized, setIsTerminalAuthorized] = useState(false);
  const [isTelemetryUnlocked, setIsTelemetryUnlocked] = useState<boolean>(() =>
    hasPersistedTelemetryUnlockHint()
  );
  const [cursorsReady, setCursorsReady] = useState(false);
  const [pageOccupancy, setPageOccupancy] = useState<Record<string, number>>({});
  const isTerminalAuthorizedRef = React.useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setCursorsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isTelemetryUnlocked || !cursorsReady) {
      setPageOccupancy({});
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    import('./utils/cursorSync').then(({ subscribePageOccupancy }) => {
      if (cancelled) return;
      unsubscribe = subscribePageOccupancy((next) => {
        if (!cancelled) setPageOccupancy(next);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isTelemetryUnlocked, cursorsReady]);

  useEffect(() => {
    let cancelled = false;
    let firebaseReady = false;
    let firebaseAuthed = false;
    let tokenReady = false;
    let tokenAuthed = false;
    let unsubscribeFirebase: (() => void) | null = null;

    const recomputeUnlock = () => {
      if (cancelled) return;
      if (firebaseAuthed || tokenAuthed) {
        persistTelemetryHint(true);
        setIsTelemetryUnlocked(true);
      } else if (firebaseReady && tokenReady) {
        persistTelemetryHint(false);
        setIsTelemetryUnlocked(false);
      }
    };

    const runTokenCheck = async (tok: string | null) => {
      tokenReady = false;
      if (!tok) {
        tokenAuthed = false;
        tokenReady = true;
        recomputeUnlock();
        return;
      }
      const { valid, definitive } = await validatePersistedAdminToken(tok);
      if (cancelled) return;
      if (valid) {
        tokenAuthed = true;
      } else if (definitive) {
        clearPersistedAdminToken();
        tokenAuthed = false;
      } else {
        tokenAuthed = true;
      }
      tokenReady = true;
      recomputeUnlock();
    };

    void runTokenCheck(getPersistedAdminToken());
    const unsubToken = subscribeTelemetryTokenChanges((tok) => {
      void runTokenCheck(tok);
    });

    const runFirebaseAuthCheck = () => {
      void (async () => {
        try {
          const [{ onAuthStateChanged }, { auth }] = await Promise.all([
            import('firebase/auth'),
            import('./lib/firebaseAuth').then((m) => m.getFirebaseAuth()),
          ]);
          if (cancelled) return;
          unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
            firebaseReady = true;
            firebaseAuthed = isAuthorizedFirebaseUser(user);
            recomputeUnlock();
          });
        } catch {
          firebaseReady = true;
          firebaseAuthed = false;
          recomputeUnlock();
        }
      })();
    };

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(runFirebaseAuthCheck);
    } else {
      timeoutHandle = setTimeout(runFirebaseAuthCheck, 1200);
    }

    return () => {
      cancelled = true;
      unsubToken();
      if (idleHandle !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      unsubscribeFirebase?.();
    };
  }, []);

  useEffect(() => {
    isTerminalAuthorizedRef.current = statsOpen && isTerminalAuthorized;
  }, [statsOpen, isTerminalAuthorized]);

  const handleCloseSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const handleOpenStats = useCallback(() => setStatsOpen(true), []);
  const handleNavigateSlug = useCallback((targetSlug: string) => {
    navigate(`/wiki/${targetSlug}`);
  }, [navigate]);

  // Sync hash section parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      // Delay slightly to allow rendering
      const timer = setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [slug, searchParams]);

  // Determine active article
  const activeSlug = slug || 'home';
  const activeArticle = articles.find(a => a.slug === activeSlug);
  const activeContent = articlesContent[activeSlug] || '';

  // Track page visits
  useEffect(() => {
    const clientEnv = detectClientEnvironment();

    const recordLocalVisit = (slug: string, visitorId: string) => {
      const localStatsStr = localStorage.getItem('local_wiki_stats');
      let stats = {
        uniqueCount: 1,
        repeatCount: 0,
        totalCount: 1,
        pageViews: { [slug]: 1 } as Record<string, number>,
        logs: [
          {
            timestamp: new Date().toISOString(),
            type: 'unique' as 'unique' | 'repeat',
            slug: slug,
            visitorId: visitorId.substring(0, 12),
            os: clientEnv.os,
            browser: clientEnv.browser
          }
        ]
      };

      if (localStatsStr) {
        try {
          stats = JSON.parse(localStatsStr);
          // Check if this visitor ID has logged a unique connection before in logs
          const hasVisited = stats.logs?.some((l: any) => l.visitorId === visitorId.substring(0, 12));
          const isUnique = !hasVisited;

          stats.totalCount = (stats.totalCount || 0) + 1;
          if (isUnique) {
            stats.uniqueCount = (stats.uniqueCount || 0) + 1;
          } else {
            stats.repeatCount = (stats.repeatCount || 0) + 1;
          }
          
          if (!stats.pageViews) stats.pageViews = {};
          stats.pageViews[slug] = (stats.pageViews[slug] || 0) + 1;

          if (!stats.logs) stats.logs = [];
          stats.logs.unshift({
            timestamp: new Date().toISOString(),
            type: (isUnique ? 'unique' : 'repeat') as 'unique' | 'repeat',
            slug: slug,
            visitorId: visitorId.substring(0, 12),
            os: clientEnv.os,
            browser: clientEnv.browser
          });

          if (stats.logs.length > 50) {
            stats.logs = stats.logs.slice(0, 50);
          }
        } catch (e) {
          console.error("Failed to update local sandbox stats", e);
        }
      }

      localStorage.setItem('local_wiki_stats', JSON.stringify(stats));
    };

    const recordVisitFirebase = async (slug: string, visitorId: string): Promise<boolean> => {
      try {
        const [{ hasConfig }, { getFirebaseDb }] = await Promise.all([
          import('./lib/firebaseConfig'),
          import('./lib/firebaseDb'),
        ]);
        const firestoreDb = hasConfig ? await getFirebaseDb() : null;
        if (!hasConfig || !firestoreDb) {
          return false;
        }
        const { doc, getDoc, setDoc, addDoc, collection, increment, serverTimestamp } = await import('firebase/firestore');

        const visitorDocRef = doc(firestoreDb, 'visitors', visitorId);
        const isKnownLocally = localStorage.getItem('wiki_visitor_established') === 'true';
        let isUnique = false;

        if (!isKnownLocally) {
          const visitorSnapshot = await getDoc(visitorDocRef);
          isUnique = !visitorSnapshot.exists();
          localStorage.setItem('wiki_visitor_established', 'true');
        }

        const visitorWrite = isUnique
          ? setDoc(visitorDocRef, {
              firstVisit: serverTimestamp(),
              lastVisit: serverTimestamp(),
              os: clientEnv.os,
              browser: clientEnv.browser,
              deviceType: clientEnv.deviceType
            })
          : setDoc(visitorDocRef, {
              lastVisit: serverTimestamp(),
              os: clientEnv.os,
              browser: clientEnv.browser,
              deviceType: clientEnv.deviceType
            }, { merge: true });

        const statsDocRef = doc(firestoreDb, 'stats', 'global');
        const statsWrite = setDoc(statsDocRef, {
          totalCount: increment(1),
          uniqueCount: isUnique ? increment(1) : increment(0),
          repeatCount: !isUnique ? increment(1) : increment(0),
          [`pageViews.${slug}`]: increment(1)
        }, { merge: true });

        const logWrite = addDoc(collection(firestoreDb, 'telemetry_logs'), {
          timestamp: serverTimestamp(),
          type: isUnique ? 'unique' : 'repeat',
          slug,
          visitorId: visitorId.substring(0, 12),
          os: clientEnv.os,
          browser: clientEnv.browser
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase network timeout')), 3500)
        );

        await Promise.race([
          Promise.all([visitorWrite, statsWrite, logWrite]),
          timeoutPromise
        ]);
        return true;
      } catch (err) {
        return false;
      }
    };

    const recordVisit = async () => {
      try {
        // Check if current device is opted out / ignored from telemetry
        if (localStorage.getItem('wiki_telemetry_ignore_device') === 'true') {
          return;
        }

        let visitorId = localStorage.getItem('wiki_visitor_id');
        if (!visitorId) {
          visitorId = 'surv_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('wiki_visitor_id', visitorId);
        }

        // Try Firebase first for real-time global telemetry
        const firebaseSuccess = await recordVisitFirebase(activeSlug, visitorId);
        if (firebaseSuccess) {
          return;
        }

        // Fallback: update local sandbox so the UI still displays simulated data gracefully
        recordLocalVisit(activeSlug, visitorId);
      } catch (err) {
        console.error('Failed to record page visit:', err);
      }
    };

    if (!loading && !error) {
      recordVisit();
    }
  }, [activeSlug, loading, error]);

  // Universal Global Click Interaction Telemetry Tracker (zero page hardcoding needed)
  useEffect(() => {
    const buildSelectorSummary = (el: HTMLElement) => {
      const idPart = el.id ? `#${el.id}` : '';
      const clsPart = typeof el.className === 'string' && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
      return `${el.tagName.toLowerCase()}${idPart}${clsPart}`;
    };

    const radiansProbeRegex = /\b(radians?|live[-_ ]?radians?|02:\s*live\s*radians?|angular[-_ ]?speed|radial[-_ ]?speed)\b/i;
    const adminProbeRegex = /\b(admin(?:istrator|panel|override|bypass|console|controls?)?|sysadmin|superuser|root[-_ ]?panel|debug[-_ ]?panel|clearance[-_ ]?bypass|override[-_ ]?auth|telemetry[-_ ]?(?:admin|override|bypass))\b/i;
    const adminHrefRegex = /^#?\/?(?:admin|radians|telemetry|debug|sysadmin)(?:\/|$|\?)/i;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 0. Honeypot & unauthorized probe detection (runs even if telemetry opt-out is set)
      const honeyTarget = target.closest<HTMLElement>('[data-honey-probe]');
      if (honeyTarget) {
        const reason = honeyTarget.getAttribute('data-honey-probe') || 'hidden_radians_probe';
        const label = (
          honeyTarget.getAttribute('aria-label') ||
          honeyTarget.getAttribute('title') ||
          honeyTarget.textContent ||
          honeyTarget.id ||
          'honeypot'
        ).replace(/\s+/g, ' ').trim();
        trackHoneyProbe({
          page: activeSlug,
          reason,
          target: label,
          selector: buildSelectorSummary(honeyTarget)
        });
        return;
      }

      if (!isTerminalAuthorizedRef.current) {
        const probeEl = target.closest<HTMLElement>(
          'button, a, [role="button"], [role="tab"], input, select, summary, [data-tab], [data-admin], [data-admin-action], [data-radians], [data-radians-control]'
        ) || target;

        const hrefAttr = (probeEl.getAttribute('href') || target.closest('a[href]')?.getAttribute('href') || '').trim();
        const attrMeta = [
          probeEl.id,
          typeof probeEl.className === 'string' ? probeEl.className : '',
          probeEl.getAttribute('name') || '',
          probeEl.getAttribute('aria-label') || '',
          probeEl.getAttribute('title') || '',
          probeEl.getAttribute('data-tab') || '',
          probeEl.getAttribute('data-admin') || '',
          probeEl.getAttribute('data-admin-action') || '',
          probeEl.getAttribute('data-radians') || '',
          hrefAttr
        ].join(' ');
        const rawText = (probeEl.textContent || '').replace(/\s+/g, ' ').trim();
        const shortText = rawText.length <= 80 ? rawText : '';
        const combinedSignal = `${attrMeta} ${shortText}`;

        const isInteractiveNode = Boolean(
          target.closest('button, a, [role="button"], [role="tab"], input, select, summary, [data-tab], [data-admin], [data-admin-action], [data-radians], [data-radians-control]')
        );
        const isHiddenInteractive =
          isInteractiveNode &&
          (probeEl.hasAttribute('hidden') ||
            Boolean(probeEl.closest('[hidden]')) ||
            window.getComputedStyle(probeEl).display === 'none' ||
            window.getComputedStyle(probeEl).visibility === 'hidden');

        if (radiansProbeRegex.test(combinedSignal) || /^#?\/?radians\b/i.test(hrefAttr)) {
          trackHoneyProbe({
            page: activeSlug,
            reason: 'hidden_radians_probe',
            target: shortText || probeEl.id || attrMeta.trim() || 'radians_element',
            selector: buildSelectorSummary(probeEl),
            href: hrefAttr || undefined
          });
          return;
        }

        if (adminProbeRegex.test(combinedSignal) || adminHrefRegex.test(hrefAttr)) {
          trackHoneyProbe({
            page: activeSlug,
            reason: 'nonexistent_admin_probe',
            target: shortText || hrefAttr || probeEl.id || 'admin_element',
            selector: buildSelectorSummary(probeEl),
            href: hrefAttr || undefined
          });
          return;
        }

        if (isHiddenInteractive) {
          trackHoneyProbe({
            page: activeSlug,
            reason: 'nonexistent_admin_probe',
            target: shortText || probeEl.id || 'hidden_interactive_element',
            selector: buildSelectorSummary(probeEl),
            href: hrefAttr || undefined
          });
          return;
        }

        if (target.closest('#stats-modal-container')) {
          const modalInteractive = target.closest<HTMLElement>('button, a, [role="button"], [role="tab"], input');
          if (modalInteractive && !modalInteractive.closest('[data-lock-control="true"]')) {
            trackHoneyProbe({
              page: activeSlug,
              reason: 'unauthorized_terminal_tamper',
              target: (modalInteractive.textContent || modalInteractive.id || 'injected_terminal_control').replace(/\s+/g, ' ').trim(),
              selector: buildSelectorSummary(modalInteractive)
            });
            return;
          }
        }
      }

      if (typeof window !== 'undefined' && localStorage.getItem('wiki_telemetry_ignore_device') === 'true') {
        return;
      }

      // Do not log clicks inside the telemetry terminal window or its launcher
      if (
        target.closest('#stats-modal-container') || 
        target.closest('#stats-modal-backdrop') || 
        target.closest('#stats-button')
      ) {
        return;
      }

      // 1. Explicit telemetry metadata on cards or custom elements if present
      const explicitItem = target.closest<HTMLElement>('[data-telemetry-item], [data-telemetry-target], [data-telemetry]');
      if (explicitItem) {
        const itemVal = explicitItem.getAttribute('data-telemetry-item') || 
                        explicitItem.getAttribute('data-telemetry-target') || 
                        explicitItem.getAttribute('data-telemetry');
        if (itemVal && itemVal.trim()) {
          trackTelemetryClick({ page: activeSlug, target: itemVal.trim(), category: 'item' });
          return;
        }
      }

      // 2. Navigation links (anchor tags e.g. #/wiki/...)
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (link) {
        const href = link.getAttribute('href') || '';
        let targetName = link.textContent || link.getAttribute('aria-label') || link.getAttribute('title') || '';
        targetName = targetName.split('\n')[0].replace(/\s+/g, ' ').trim();

        if (href.startsWith('#/wiki/') || href.startsWith('/wiki/')) {
          const targetSlug = href.replace(/^#?\/?wiki\//, '').split('/')[0].split('?')[0];
          const matchedArticle = articles.find(a => a.slug === targetSlug);
          const cleanLabel = targetName || (matchedArticle ? matchedArticle.title : targetSlug);
          trackTelemetryClick({
            page: activeSlug,
            target: cleanLabel.slice(0, 40),
            category: 'navigation'
          });
          return;
        }

        if (targetName && targetName.length >= 2) {
          trackTelemetryClick({
            page: activeSlug,
            target: targetName.slice(0, 40),
            category: 'link'
          });
          return;
        }
      }

      // 3. Interactive buttons, tabs, accordions, details/summary, or elements with role="button"
      const button = target.closest<HTMLElement>('button, [role="button"], summary, [role="tab"], .cursor-pointer');
      if (button) {
        // Find best title candidate: headings inside button, strong tags, or primary line of text
        const headingEl = button.querySelector('h1, h2, h3, h4, h5, h6, strong, span.font-serif, span.font-semibold');
        const rawText = headingEl 
          ? (headingEl.textContent || '') 
          : (button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent || '');
        
        // Take the first non-empty meaningful line
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length >= 2);
        const cleanBtnText = lines[0] ? lines[0].replace(/\s+/g, ' ').trim() : '';

        // Ignore generic utility icons or excessively long paragraphs
        if (cleanBtnText.length >= 2 && cleanBtnText.length <= 48) {
          trackTelemetryClick({
            page: activeSlug,
            target: cleanBtnText,
            category: 'button'
          });
          return;
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [activeSlug, articles]);

  // 2. Perform deep-content relevance search
  const searchResults = React.useMemo(() => {
    if (!deferredSearchQuery.trim()) return [];

    const query = deferredSearchQuery.toLowerCase().trim();
    const results: Array<{
      article: WikiArticle;
      score: number;
      snippet: string;
    }> = [];

    articles.forEach(article => {
      const content = articlesContent[article.slug] || '';
      const lowerContent = content.toLowerCase();
      const lowerTitle = article.title.toLowerCase();

      let score = 0;
      let snippet = '';

      // Title exact or fuzzy match
      if (lowerTitle === query) {
        score += 500;
      } else if (lowerTitle.includes(query)) {
        score += 200;
      }

      // Slug exact match
      if (article.slug === query) {
        score += 300;
      }

      // Count occurrences in body content
      const words = lowerContent.split(query);
      const occurrences = words.length - 1;
      if (occurrences > 0) {
        score += occurrences * 15;

        // Extract a snippet containing the keyword
        const index = lowerContent.indexOf(query);
        const start = Math.max(0, index - 60);
        const end = Math.min(content.length, index + query.length + 80);
        
        let contextSnippet = content.substring(start, end).trim();
        if (start > 0) contextSnippet = '...' + contextSnippet;
        if (end < content.length) contextSnippet = contextSnippet + '...';

        // Strip HTML/wiki tags from snippet for clean preview
        snippet = contextSnippet
          .replace(/<[^>]*>/g, '')
          .replace(/\[\[([^|\]\n]+)\|([^\]\n]+)\]\]/g, '$2')
          .replace(/\[\[([^|\]\n]+)\]\]/g, '$1')
          .replace(/[''{}]/g, '');
      }

      if (score > 0) {
        results.push({
          article,
          score,
          snippet: snippet || (content.length > 120 ? content.substring(0, 120) + '...' : content)
        });
      }
    });

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score);
  }, [deferredSearchQuery, articles, articlesContent]);

  // Filter sidebar articles based on search query
  const filteredArticles = React.useMemo(() => {
    if (!deferredSearchQuery.trim()) return articles;
    return searchResults.map(r => r.article);
  }, [deferredSearchQuery, articles, searchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface border border-line flex items-center justify-center text-accent-text font-display font-bold text-2xl">
            S
          </div>
          <div className="text-xs font-mono text-ink-subtle uppercase tracking-[0.3em]">
            Accessing Mod Archive...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md p-6 bg-surface border border-line rounded-xl">
          <AlertCircle className="w-10 h-10 text-accent-text mx-auto mb-4" />
          <h2 className="font-display text-lg text-ink font-semibold mb-2">Failed to load Wiki</h2>
          <p className="text-xs text-ink-muted leading-relaxed mb-6 font-mono">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cta hover:bg-cta-hover text-cta-ink text-xs font-mono rounded-lg transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'starlight' ? 'bg-transparent' : 'bg-canvas'} text-ink font-sans flex relative transition-colors duration-200`}>
      {/* Sidebar - fully dynamic and searchable */}
      <Sidebar
        articles={filteredArticles}
        currentSlug={activeSlug}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={mobileSidebarOpen}
        onClose={handleCloseSidebar}
        onBIconClick={handleOpenStats}
        pageOccupancy={isTelemetryUnlocked ? pageOccupancy : undefined}
      />

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">

        {/* Mobile Header Navbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-surface/95 backdrop-blur border-b border-line">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-alt transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-xs sm:text-sm text-ink tracking-tight truncate mx-1.5">
            {activeArticle ? activeArticle.title : 'Super Bonemeal Wiki'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setStatsOpen(true)}
              className="w-8 h-8 rounded-lg bg-surface-alt border border-line flex items-center justify-center text-accent-text font-display font-bold text-sm hover:border-accent/60 hover:bg-accent-soft transition-colors cursor-pointer"
              title="View Terminal Stats"
              aria-label="View Terminal Stats"
              id="header-b-icon"
            >
              S
            </button>
          </div>
        </header>

        {/* Dynamic Article Page or Global Deep-Search Results View */}
        <main className="flex-1">
          {searchQuery.trim() ? (
            /* Show comprehensive search catalog results screen */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
              <div className="border-b border-line pb-6 mb-8 select-none">
                <div className="flex items-center gap-2 text-xs font-mono text-accent-text uppercase tracking-wider mb-2">
                  <FileSearch className="w-4 h-4" />
                  <span>Interactive Catalog Search</span>
                </div>
                <h1 className="font-display text-3xl font-bold text-ink">
                  Search results for &ldquo;{searchQuery}&rdquo;
                </h1>
                <p className="text-xs text-ink-muted mt-1">
                  Found {searchResults.length} relevant entries in deep page contents.
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map(({ article, snippet }) => (
                    <div
                      key={article.slug}
                      onClick={() => {
                        setSearchQuery('');
                        navigate(`/wiki/${article.slug}`);
                      }}
                      className="p-5 bg-surface hover:bg-surface-alt border border-line hover:border-accent/50 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="font-display text-lg text-ink group-hover:text-accent-text font-semibold transition-colors">
                          {article.title}
                        </h3>
                        <span className="text-xs font-mono text-ink-subtle shrink-0">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted font-mono leading-relaxed bg-surface-alt p-3 rounded-lg border border-line-soft select-none">
                        {snippet}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-surface border border-line rounded-xl select-none">
                  <HelpCircle className="w-12 h-12 text-ink-subtle mx-auto mb-4" />
                  <p className="text-sm font-display italic text-ink-muted">No documentation matches your query.</p>
                  <p className="text-xs text-ink-subtle mt-2 font-mono">Try searching for simple words like &ldquo;bonemeal&rdquo;, &ldquo;trades&rdquo;, or &ldquo;loot&rdquo;.</p>
                </div>
              )}
            </div>
          ) : activeArticle ? (
            /* Show normal Article view */
            <ArticleView
              article={activeArticle}
              rawContent={activeContent}
              articles={articles}
              searchQuery={searchQuery}
            />
          ) : (
            /* Fallback to index redirects */
            <div className="flex flex-col items-center justify-center h-[60vh] select-none">
              <AlertCircle className="w-8 h-8 text-ink-subtle mb-3" />
              <p className="text-sm font-display italic text-ink-muted">Article not found.</p>
              <a href="#/wiki/home" className="text-xs text-accent-text hover:underline underline-offset-4 mt-2 font-mono">Return Home</a>
            </div>
          )}
        </main>
      </div>

      {/* Live Multiplayer Desktop Cursors Overlay (visible on desktop & non-desktop) */}
      {cursorsReady && (
        <React.Suspense fallback={null}>
          <LiveCursorsOverlay
            activeSlug={activeSlug}
            isTelemetryUnlocked={isTelemetryUnlocked}
            onNavigateSlug={handleNavigateSlug}
          />
        </React.Suspense>
      )}

      {/* Stats overlay terminal */}
      {statsOpen && (
        <React.Suspense fallback={null}>
          <StatsModal 
            isOpen={statsOpen} 
            onClose={() => {
              setStatsOpen(false);
              setIsTerminalAuthorized(false);
            }} 
            articles={articles}
            activeSlug={activeSlug}
            onAuthStateSync={setIsTerminalAuthorized}
            onSessionUnlockedChange={setIsTelemetryUnlocked}
            onJumpToSlug={handleNavigateSlug}
          />
        </React.Suspense>
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const init = () => {
      import('./utils/radiansSync').then(({ initRadiansSync }) => {
        cleanup = initRadiansSync();
      });
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(init);
    } else {
      setTimeout(init, 1500);
    }
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <ThemeProvider>
      <StarlightBackground />
      <HashRouter>
        <Routes>
          <Route path="/wiki/:slug" element={<WikiContainer />} />
          <Route path="*" element={<Navigate to="/wiki/home" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
