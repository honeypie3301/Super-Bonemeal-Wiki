/**
 * ========================================================================================
 * AI ASSISTANT MAINTENANCE NOTICE & CONTROL PROTOCOL:
 * ========================================================================================
 * REMINDER FOR AI ASSISTANTS:
 * The Telemetry system (StatsModal & LiveRadiansTab) is the secret control panel of the wiki.
 * It provides live multi-client synchronization, celestial rotation telemetry, real-time audit
 * log analysis, and secret admin override capabilities for the Backwoods Survival Index.
 * ========================================================================================
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  Activity, 
  Users, 
  Terminal, 
  Eye, 
  Database,
  BarChart3,
  Radio,
  Layers,
  Clock,
  Search,
  Monitor,
  Maximize2,
  Minimize2,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  Github,
  Lock,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
const LiveRadiansTab = React.lazy(() => import('./special/LiveRadiansTab'));
const LiveCursorsTab = React.lazy(() => import('./special/LiveCursorsTab'));
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  getDocs,
  collection, 
  increment, 
  serverTimestamp, 
  query, 
  orderBy, 
  where,
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, githubProvider, hasConfig } from '../lib/firebase';
import { detectClientEnvironment } from '../utils/deviceInfo';
import {
  ArchiveSyncStatus,
  ensureArchiveHydrated,
  getArchiveSnapshot,
  mergeLiveLogsIntoArchive,
  subscribeTelemetryArchive,
  syncFullTelemetryArchive
} from '../utils/telemetryArchive';

import {
  VALID_KEY_HASHES,
  computeClearanceHash,
  computeStaticSessionProof,
  getPersistedAdminToken,
  persistAdminToken,
  clearPersistedAdminToken,
  validatePersistedAdminToken,
  isAuthorizedFirebaseUser,
  persistTelemetryHint,
} from '../utils/telemetryAuth';

interface TelemetryLog {
  id?: string;
  timestamp: string;
  type: 'unique' | 'repeat' | 'click' | string;
  slug: string;
  visitorId: string;
  os?: string;
  browser?: string;
  target?: string;
  page?: string;
  category?: string;
}

interface SearchSummary {
  totalLogs: number;
  uniqueCount: number;
  repeatCount: number;
  clickCount: number;
  matchedNodes: string[];
  newestDate?: string;
  oldestDate?: string;
  topTarget?: { title: string; count: number };
  device?: string;
}

interface StatsData {
  uniqueCount: number;
  repeatCount: number;
  totalCount: number;
  pageViews: Record<string, number>;
  logs: TelemetryLog[];
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Array<{ slug: string; title: string }>;
  activeSlug?: string;
  onAuthStateSync?: (authorized: boolean) => void;
  onSessionUnlockedChange?: (unlocked: boolean) => void;
  onJumpToSlug?: (slug: string) => void;
}

const MAIN_TABS = ['telemetry', 'radians', 'cursors'] as const;
type MainTab = (typeof MAIN_TABS)[number];

export default function StatsModal({
  isOpen,
  onClose,
  articles,
  activeSlug = 'home',
  onAuthStateSync,
  onSessionUnlockedChange,
  onJumpToSlug,
}: StatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  const [logFilter, setLogFilter] = useState<'all' | 'unique' | 'repeat' | 'click'>('all');
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'stream'>('overview');
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('telemetry');

  const handlePrevMainTab = () => {
    setActiveMainTab(prev => {
      const idx = MAIN_TABS.indexOf(prev);
      return MAIN_TABS[(idx - 1 + MAIN_TABS.length) % MAIN_TABS.length];
    });
  };

  const handleNextMainTab = () => {
    setActiveMainTab(prev => {
      const idx = MAIN_TABS.indexOf(prev);
      return MAIN_TABS[(idx + 1) % MAIN_TABS.length];
    });
  };
  const [isDeviceIgnored, setIsDeviceIgnored] = useState<boolean>(() => {
    return localStorage.getItem('wiki_telemetry_ignore_device') === 'true';
  });
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    const saved = localStorage.getItem('wiki_telemetry_fullscreen');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
      localStorage.setItem('wiki_telemetry_fullscreen', String(next));
      return next;
    });
  };

  // User ID database search engine state
  const [searchUserId, setSearchUserId] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TelemetryLog[] | null>(null);
  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(null);
  const searchCacheRef = useRef<Map<string, { logs: TelemetryLog[]; cachedAt: number }>>(new Map());
  const targetedResultsRef = useRef<Map<string, TelemetryLog[]>>(new Map());
  const latestLogsRef = useRef<TelemetryLog[]>([]);
  const latestPageViewKeysRef = useRef<string[]>([]);
  const [archiveStatus, setArchiveStatus] = useState<ArchiveSyncStatus>(() => getArchiveSnapshot().status);
  const [archiveTick, setArchiveTick] = useState(0);
  const [displayLimit, setDisplayLimit] = useState(200);

  const currentVisitorId = useMemo(() => {
    return localStorage.getItem('wiki_visitor_id') || 'unassigned';
  }, [isOpen]);

  const currentVisitorIdShort = currentVisitorId.substring(0, 12);
  const clientEnv = useMemo(() => detectClientEnvironment(), []);

  const handleStopTracking = () => {
    localStorage.setItem('wiki_telemetry_ignore_device', 'true');
    setIsDeviceIgnored(true);
    setStatusNotice('DEVICE TELEMETRY HALTED');
    setTimeout(() => setStatusNotice(null), 2800);
  };

  const handleResumeTracking = () => {
    localStorage.removeItem('wiki_telemetry_ignore_device');
    setIsDeviceIgnored(false);
    setStatusNotice('DEVICE TELEMETRY ACTIVE');
    setTimeout(() => setStatusNotice(null), 2800);
  };

  // Auth & Admin verification state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskeyField, setShowPasskeyField] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => getPersistedAdminToken());

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Cryptographically validate persisted token without wiping it on transient offline/network errors
  useEffect(() => {
    let cancelled = false;

    const validateStoredToken = async () => {
      if (!adminToken) {
        setTokenVerified(false);
        return;
      }

      const { valid, definitive } = await validatePersistedAdminToken(adminToken);
      if (cancelled) return;

      if (valid) {
        persistAdminToken(adminToken);
        setTokenVerified(true);
      } else if (definitive) {
        clearPersistedAdminToken();
        setAdminToken(null);
        setTokenVerified(false);
      }
    };

    void validateStoredToken();
    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  // Determine if currently authenticated user is an authorized admin
  const isAuthorized = useMemo(() => {
    if (tokenVerified) return true;
    return isAuthorizedFirebaseUser(currentUser);
  }, [currentUser, tokenVerified]);

  useEffect(() => {
    onAuthStateSync?.(isAuthorized);
    if (isAuthorized) {
      persistTelemetryHint(true);
      onSessionUnlockedChange?.(true);
    }
    return () => {
      onAuthStateSync?.(false);
    };
  }, [isAuthorized, onAuthStateSync, onSessionUnlockedChange]);

  const handleVerifyPasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedKey = passkeyInput.trim();
    if (!trimmedKey) return;

    // Client-side brute-force lockout guard (also enforced server-side)
    try {
      const lockRaw = sessionStorage.getItem('wiki_auth_lock');
      if (lockRaw) {
        const lockData = JSON.parse(lockRaw);
        if (lockData.lockUntil && Date.now() < lockData.lockUntil) {
          setAuthError('Too many unauthorized attempts. Terminal locked for 15 minutes.');
          return;
        }
      }
    } catch {}

    setIsSigningIn(true);
    setAuthError(null);

    const recordClientFailure = () => {
      try {
        const raw = sessionStorage.getItem('wiki_auth_lock');
        const state = raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
        state.count = (state.count || 0) + 1;
        if (state.count >= 5) {
          state.lockUntil = Date.now() + 15 * 60 * 1000;
        }
        sessionStorage.setItem('wiki_auth_lock', JSON.stringify(state));
      } catch {}
    };

    try {
      // 1. Submit clearance key to server-side authentication API
      const res = await fetch('/api/telemetry/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmedKey })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        throw new Error('Static deployment mode (no JSON API)');
      }

      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.removeItem('wiki_auth_lock');
        persistAdminToken(data.token);
        setAdminToken(data.token);
        setTokenVerified(true);
        setPasskeyInput('');
        setAuthError(null);
      } else {
        setAuthError(data.error || 'UNAUTHORIZED ACCESS: Invalid Clearance Key.');
      }
    } catch {
      // Fallback for static deployments (Cloudflare Pages / Vercel / GitHub Pages)
      try {
        const hash = await computeClearanceHash(trimmedKey);
        if (VALID_KEY_HASHES.includes(hash)) {
          const proof = await computeStaticSessionProof(hash);
          sessionStorage.removeItem('wiki_auth_lock');
          persistAdminToken(proof);
          setAdminToken(proof);
          setTokenVerified(true);
          setPasskeyInput('');
          setAuthError(null);
        } else {
          recordClientFailure();
          setAuthError('UNAUTHORIZED ACCESS: Invalid Clearance Key.');
        }
      } catch {
        setAuthError('ERROR VERIFYING KEY');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err: any) {
      console.error("Sign-in failure", err);
      setAuthError(err?.message || "Failed to authenticate with GitHub");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    clearPersistedAdminToken();
    setAdminToken(null);
    setTokenVerified(false);
    onSessionUnlockedChange?.(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  // Log terminal open event to telemetry trace stream
  const hasLoggedOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasLoggedOpenRef.current = false;
      return;
    }

    if (hasLoggedOpenRef.current) return;
    hasLoggedOpenRef.current = true;

    const recordTerminalAccess = async () => {
      try {
        // Abort if device tracking is disabled
        if (localStorage.getItem('wiki_telemetry_ignore_device') === 'true') {
          return;
        }

        let visitorId = localStorage.getItem('wiki_visitor_id');
        if (!visitorId) {
          visitorId = 'surv_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('wiki_visitor_id', visitorId);
        }

        const shortVisitorId = visitorId.substring(0, 12);

        const recordLocalTerminal = (isUnique: boolean) => {
          try {
            const raw = localStorage.getItem('local_wiki_stats');
            let localData: StatsData | null = null;
            if (raw) {
              localData = JSON.parse(raw);
            }
            if (!localData) {
              localData = {
                uniqueCount: 1,
                repeatCount: 0,
                totalCount: 1,
                pageViews: {},
                logs: []
              };
            }

            localData.totalCount = (localData.totalCount || 0) + 1;
            if (isUnique) {
              localData.uniqueCount = (localData.uniqueCount || 0) + 1;
            } else {
              localData.repeatCount = (localData.repeatCount || 0) + 1;
            }

            if (!localData.pageViews) localData.pageViews = {};
            localData.pageViews['telemetry-terminal'] = (localData.pageViews['telemetry-terminal'] || 0) + 1;

            if (!localData.logs) localData.logs = [];
            localData.logs.unshift({
              timestamp: new Date().toISOString(),
              type: isUnique ? 'unique' : 'repeat',
              slug: 'telemetry-terminal',
              visitorId: shortVisitorId,
              os: clientEnv.os,
              browser: clientEnv.browser
            });

            if (localData.logs.length > 50) {
              localData.logs = localData.logs.slice(0, 50);
            }

            localStorage.setItem('local_wiki_stats', JSON.stringify(localData));
            setStats(localData);
          } catch (e) {
            console.error('Failed to log terminal open event to local sandbox', e);
          }
        };

        // Optimistic UI emission: append event to local trace immediately so terminal shows 0ms latency
        const optimisticType = localStorage.getItem('wiki_visitor_established') === 'true' ? 'repeat' : 'unique';
        const optimisticEntry: TelemetryLog = {
          timestamp: new Date().toISOString(),
          type: optimisticType,
          slug: 'telemetry-terminal',
          visitorId: shortVisitorId,
          os: clientEnv.os,
          browser: clientEnv.browser
        };
        setStats(prev => {
          if (!prev) return prev;
          const currentLogs = prev.logs || [];
          return {
            ...prev,
            totalCount: (prev.totalCount || 0) + 1,
            pageViews: {
              ...prev.pageViews,
              'telemetry-terminal': (prev.pageViews?.['telemetry-terminal'] || 0) + 1
            },
            logs: [optimisticEntry, ...currentLogs].slice(0, 50)
          };
        });

        if (hasConfig) {
          // Asynchronously dispatch writes in parallel without blocking the UI thread
          (async () => {
            try {
              const visitorDocRef = doc(db, 'visitors', visitorId);
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

              const statsDocRef = doc(db, 'stats', 'global');
              const statsWrite = setDoc(statsDocRef, {
                totalCount: increment(1),
                uniqueCount: isUnique ? increment(1) : increment(0),
                repeatCount: !isUnique ? increment(1) : increment(0),
                ['pageViews.telemetry-terminal']: increment(1)
              }, { merge: true });

              const logWrite = addDoc(collection(db, 'telemetry_logs'), {
                timestamp: serverTimestamp(),
                type: isUnique ? 'unique' : 'repeat',
                slug: 'telemetry-terminal',
                visitorId: shortVisitorId,
                os: clientEnv.os,
                browser: clientEnv.browser
              });

              // Execute all three writes concurrently over a single batched window
              await Promise.all([visitorWrite, statsWrite, logWrite]);
            } catch (err) {
              console.warn('Firebase terminal logging failed, using local sandbox fallback', err);
              recordLocalTerminal(false);
            }
          })();
        } else {
          // Firebase not configured — skip local recording
          console.warn('Firebase not configured; skipping terminal open telemetry.');
        }
      } catch (err) {
        console.error('Error logging terminal telemetry event:', err);
      }
    };

    recordTerminalAccess();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isAuthorized) {
      setStats(null);
      return;
    }

    // Clear any stale sandbox mock data from localStorage
    localStorage.removeItem('local_wiki_stats');

    // Zero-delay rehydration: instantly render from local cache if available
    const cachedStats = localStorage.getItem('cached_telemetry_stats');
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
        setLoading(false);
      } catch {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    setError(null);

    let statsUnsubscribe: () => void = () => {};
    let logsUnsubscribe: () => void = () => {};

    if (!hasConfig) {
      setError('Firebase is not configured. Cannot connect to live database.');
      setLoading(false);
      return;
    }

    const formatFirestoreError = (err: unknown, fallback: string) => {
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : String(err || '');
      if (code === 'resource-exhausted' || /quota/i.test(msg)) {
        return 'Firestore daily free-tier read quota exceeded. Quota resets tomorrow; check the Firebase Console Firestore usage tab.';
      }
      if (code === 'permission-denied') {
        return 'Firestore permission denied. Check firestore.rules deployment.';
      }
      return msg ? `${fallback} (${code ? `${code}: ` : ''}${msg})` : fallback;
    };

    try {
      // 1. Listen to global stats doc
      statsUnsubscribe = onSnapshot(doc(db, 'stats', 'global'), (statsDoc) => {
        if (statsDoc.exists()) {
          const data = statsDoc.data();
          const pageViews: Record<string, number> = {};
          
          if (data.pageViews && typeof data.pageViews === 'object') {
            Object.assign(pageViews, data.pageViews);
          }
          
          Object.keys(data).forEach(key => {
            if (key.startsWith('pageViews.')) {
              const slug = key.replace('pageViews.', '');
              pageViews[slug] = (pageViews[slug] || 0) + Number(data[key] || 0);
            }
          });

          setStats(prev => {
            const nextStats = {
              uniqueCount: data.uniqueCount || 0,
              repeatCount: data.repeatCount || 0,
              totalCount: data.totalCount || 0,
              pageViews,
              logs: prev?.logs || []
            };
            try {
              localStorage.setItem('cached_telemetry_stats', JSON.stringify(nextStats));
            } catch {}
            return nextStats;
          });
        } else {          // Document does not exist yet (first time initialization)
          setStats(prev => ({
            uniqueCount: 0,
            repeatCount: 0,
            totalCount: 0,
            pageViews: {},
            logs: prev?.logs || []
          }));
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore global stats error:", err);
        setError(formatFirestoreError(err, 'Live database connection failed.'));
        setLoading(false);
      });

      // 2. Listen to logs query
      const logsQuery = query(
        collection(db, 'telemetry_logs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logs: TelemetryLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let tsStr = new Date().toISOString();
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              tsStr = data.timestamp.toDate().toISOString();
            } else if (data.timestamp.seconds) {
              tsStr = new Date(data.timestamp.seconds * 1000).toISOString();
            } else {
              tsStr = new Date(data.timestamp).toISOString();
            }
          }
          logs.push({
            id: doc.id,
            timestamp: tsStr,
            type: data.type || 'repeat',
            slug: data.slug || 'home',
            visitorId: data.visitorId || 'unknown',
            os: data.os,
            browser: data.browser,
            target: data.target,
            page: data.page,
            category: data.category
          });
        });
        mergeLiveLogsIntoArchive(logs);
        setStats(prev => {
          const nextStats = !prev ? {
            uniqueCount: 0,
            repeatCount: 0,
            totalCount: 0,
            pageViews: {},
            logs
          } : {
            ...prev,
            logs
          };
          try {
            localStorage.setItem('cached_telemetry_stats', JSON.stringify(nextStats));
          } catch {}
          return nextStats;
        });
      }, (err) => {
        console.error("Firestore logs error:", err);
        setError(formatFirestoreError(err, 'Live telemetry stream connection failed.'));
        setLoading(false);
      });

    } catch (err) {
      console.error("Firebase execution error:", err);
      setError(formatFirestoreError(err, 'Failed to connect to live database.'));
      setLoading(false);
    }

    return () => {
      statsUnsubscribe();
      logsUnsubscribe();
    };
  }, [isOpen, isAuthorized, retryCount]);

  const handleManualRefresh = () => {
    searchCacheRef.current.clear();
    targetedResultsRef.current.clear();
    if (hasConfig) {
      void syncFullTelemetryArchive(db, { forceDelta: true });
    }
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getArticleTitle = (slug: string, target?: string) => {
    if (target) return target;
    if (slug === 'telemetry-terminal' || slug === 'terminal') {
      return 'Telemetry Terminal';
    }
    if (slug.includes(':')) {
      const parts = slug.split(':');
      const pageSlug = parts[0];
      const itemKey = parts.slice(1).join(':');
      const pageArticle = articles.find(a => a.slug === pageSlug);
      const pageTitle = pageArticle ? pageArticle.title : (pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1));
      const formattedItem = itemKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${formattedItem} (${pageTitle})`;
    }
    const article = articles.find(a => a.slug === slug);
    if (article) return article.title;
    // Format fallback neatly
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  };

  const formatLogDisplay = (log: TelemetryLog) => {
    if (log.slug === 'telemetry-terminal' || log.slug === 'terminal') {
      return { main: 'Telemetry Terminal', sub: null };
    }
    if (log.type === 'click' && log.target) {
      let main = log.target;
      // Strip legacy redundant "(page: ...)"
      main = main.replace(/\s*\(page:\s*[^)]+\)/gi, '').trim();
      const pageTitle = log.page ? getArticleTitle(log.page) : null;
      const sub = pageTitle && !main.toLowerCase().includes(pageTitle.toLowerCase()) ? pageTitle : null;
      return { main, sub };
    }
    const title = getArticleTitle(log.slug);
    return { main: title, sub: null };
  };

  // Compute top visited pages breakdown with search filter
  const { topPages, totalTargetsCount } = useMemo(() => {
    if (!stats) return { topPages: [], totalTargetsCount: 0 };
    
    // Check if stats.pageViews has keys
    const viewsMap: Record<string, number> = { ...(stats.pageViews || {}) };

    // If pageViews is empty but we have logs, calculate distribution from logs
    if (Object.keys(viewsMap).length === 0 && stats.logs.length > 0) {
      stats.logs.forEach(log => {
        viewsMap[log.slug] = (viewsMap[log.slug] || 0) + 1;
      });
    }

    let sorted = Object.entries(viewsMap)
      .map(([slug, count]) => ({
        slug,
        title: getArticleTitle(slug),
        count
      }))
      .sort((a, b) => b.count - a.count);

    const q = pageSearchQuery.trim().toLowerCase();
    if (q) {
      sorted = sorted.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.slug.toLowerCase().includes(q)
      );
    }

    const maxCount = sorted.length > 0 ? Math.max(...sorted.map(p => p.count), 1) : 1;

    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentage: Math.round((item.count / maxCount) * 100)
    }));

    return {
      topPages: (showAllTargets || q) ? ranked : ranked.slice(0, 6),
      totalTargetsCount: ranked.length
    };
  }, [stats, articles, showAllTargets, pageSearchQuery]);

  const computeSearchSummary = (results: TelemetryLog[]) => {
    if (results.length === 0) {
      setSearchSummary({
        totalLogs: 0,
        uniqueCount: 0,
        repeatCount: 0,
        clickCount: 0,
        matchedNodes: []
      });
      return;
    }
    const nodes = Array.from(new Set(results.map(r => r.visitorId)));
    const targetCounts: Record<string, number> = {};
    let uniqueCount = 0;
    let repeatCount = 0;
    let clickCount = 0;

    results.forEach(r => {
      targetCounts[r.slug] = (targetCounts[r.slug] || 0) + 1;
      if (r.type === 'click') clickCount++;
      else if (r.type === 'unique') uniqueCount++;
      else repeatCount++;
    });

    let topSlug = '';
    let maxCount = 0;
    Object.entries(targetCounts).forEach(([slug, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSlug = slug;
      }
    });

    const latestWithDevice = results.find(r => r.browser || r.os);
    const detectedDevice = latestWithDevice 
      ? `${latestWithDevice.browser || 'Browser'}${latestWithDevice.os ? ` on ${latestWithDevice.os}` : ''}`
      : (nodes.some(n => n.toLowerCase().includes(currentVisitorIdShort.toLowerCase())) ? `${clientEnv.browser} on ${clientEnv.os}` : undefined);

    setSearchSummary({
      totalLogs: results.length,
      uniqueCount,
      repeatCount,
      clickCount,
      matchedNodes: nodes,
      newestDate: results[0]?.timestamp,
      oldestDate: results[results.length - 1]?.timestamp,
      topTarget: topSlug ? { title: getArticleTitle(topSlug), count: maxCount } : undefined,
      device: detectedDevice
    });
  };

  useEffect(() => {
    latestLogsRef.current = stats?.logs || [];
    latestPageViewKeysRef.current = Object.keys(stats?.pageViews || {});
  }, [stats]);

  // Hydrate and subscribe to the persistent full-history telemetry archive while modal is open
  useEffect(() => {
    if (!isOpen || !isAuthorized) return;
    const unsubscribe = subscribeTelemetryArchive((_, status) => {
      setArchiveStatus(status);
      setArchiveTick(prev => prev + 1);
    });
    void ensureArchiveHydrated();
    return () => unsubscribe();
  }, [isOpen, isAuthorized]);

  // Reset rendered list window when search query or type filter changes
  useEffect(() => {
    setDisplayLimit(200);
  }, [searchUserId, logFilter]);

  const buildSearchableText = (l: {
    visitorId?: string;
    os?: string;
    browser?: string;
    slug?: string;
    target?: string;
    page?: string;
    category?: string;
    type?: string;
  }) => {
    const slug = l.slug || 'home';
    const displayTitle = getArticleTitle(slug, l.target);
    const pageTitle = l.page ? getArticleTitle(l.page) : '';
    return `${l.visitorId || ''} ${l.os || ''} ${l.browser || ''} ${slug} ${l.target || ''} ${l.page || ''} ${l.category || ''} ${l.type || ''} ${displayTitle} ${pageTitle}`.toLowerCase();
  };

  const getLogDedupeKey = (l: TelemetryLog) =>
    l.id || `${l.timestamp}::${l.visitorId}::${l.slug}::${l.type}::${l.target || ''}`;

  const mergeAndSortLogs = (primary: TelemetryLog[], secondary: TelemetryLog[]) => {
    const merged = new Map<string, TelemetryLog>();
    for (const item of primary) {
      merged.set(getLogDedupeKey(item), item);
    }
    for (const item of secondary) {
      const key = getLogDedupeKey(item);
      if (!merged.has(key)) {
        merged.set(key, item);
      }
    }
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // Instant search across ALL indexed archive logs + live stream + targeted results (recomputes live as batches stream in)
  useEffect(() => {
    const rawTrimmed = searchUserId.trim();
    const trimmed = rawTrimmed.toLowerCase();
    if (!trimmed) {
      setSearchResults(null);
      setSearchSummary(null);
      setIsSearching(false);
      return;
    }

    const tokens = trimmed.split(/[\s·on\-_/]+/).filter(t => t.length > 0);
    const matchesTokens = (text: string) =>
      tokens.length === 0 ? text.includes(trimmed) : tokens.every(token => text.includes(token));

    const archiveLogs = Array.from(getArchiveSnapshot().logs.values());
    const liveLogs = latestLogsRef.current;
    const targetedLogs = targetedResultsRef.current.get(trimmed) || [];

    const combinedPool = mergeAndSortLogs(
      mergeAndSortLogs(archiveLogs, targetedLogs),
      liveLogs
    );

    const matched = combinedPool.filter(l => matchesTokens(buildSearchableText(l)));
    setSearchResults(matched);
    computeSearchSummary(matched);
  }, [searchUserId, archiveTick, articles]);

  // Trigger full-database cursor-paginated archive sync + instant targeted query on search input
  useEffect(() => {
    const rawTrimmed = searchUserId.trim();
    const trimmed = rawTrimmed.toLowerCase();
    if (!trimmed) {
      setIsSearching(false);
      return;
    }

    if (!hasConfig) {
      setIsSearching(false);
      return;
    }

    // Start or continue background full-database backfill + delta sync
    void syncFullTelemetryArchive(db);

    if (trimmed.length < 2 || getArchiveSnapshot().status.isComplete) {
      setIsSearching(false);
      return;
    }

    const tokens = trimmed.split(/[\s·on\-_/]+/).filter(t => t.length > 0);
    const matchesTokens = (text: string) =>
      tokens.length === 0 ? text.includes(trimmed) : tokens.every(token => text.includes(token));

    let isCancelled = false;
    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const logsMap = new Map<string, TelemetryLog>();

        const addDocToMap = (id: string, data: any) => {
          let tsStr = new Date().toISOString();
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              tsStr = data.timestamp.toDate().toISOString();
            } else if (data.timestamp.seconds) {
              tsStr = new Date(data.timestamp.seconds * 1000).toISOString();
            } else {
              tsStr = new Date(data.timestamp).toISOString();
            }
          }
          logsMap.set(id, {
            id,
            timestamp: tsStr,
            type: data.type || 'repeat',
            slug: data.slug || 'home',
            visitorId: data.visitorId || 'unknown',
            os: data.os,
            browser: data.browser,
            target: data.target,
            page: data.page,
            category: data.category
          });
        };

        const knownSlugs = new Set<string>([
          ...articles.map(a => a.slug),
          ...latestPageViewKeysRef.current,
          'telemetry-terminal',
          'terminal',
          'rot-lab'
        ]);
        const matchedSlugs = Array.from(knownSlugs)
          .filter(slug => {
            const title = getArticleTitle(slug).toLowerCase();
            const slugLower = slug.toLowerCase();
            return matchesTokens(`${slugLower} ${title}`);
          })
          .slice(0, 15);

        const queries = [];
        if (matchedSlugs.length > 0) {
          queries.push(
            getDocs(query(collection(db, 'telemetry_logs'), where('slug', 'in', matchedSlugs), limit(500)))
          );
          queries.push(
            getDocs(query(collection(db, 'telemetry_logs'), where('page', 'in', matchedSlugs), limit(500)))
          );
        }

        if (!trimmed.includes(' ') && trimmed.length >= 4) {
          queries.push(
            getDocs(
              query(
                collection(db, 'telemetry_logs'),
                where('visitorId', '>=', rawTrimmed),
                where('visitorId', '<=', rawTrimmed + '\uf8ff'),
                limit(500)
              )
            )
          );
        }

        if (queries.length > 0) {
          const settled = await Promise.allSettled(queries);
          settled.forEach(outcome => {
            if (outcome.status === 'fulfilled') {
              outcome.value.forEach(docSnap => {
                const data = docSnap.data();
                if (matchesTokens(buildSearchableText(data))) {
                  addDocToMap(docSnap.id, data);
                }
              });
            }
          });
        }

        if (isCancelled) return;
        const targeted = Array.from(logsMap.values());
        targetedResultsRef.current.set(trimmed, targeted);
        mergeLiveLogsIntoArchive(targeted);
        setArchiveTick(prev => prev + 1);
      } catch (err) {
        if (!isCancelled) {
          console.error('Error querying targeted Firestore history:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [searchUserId, hasConfig, articles]);

  // Active pool of logs: database search results or live stream
  const activeLogsPool = searchResults !== null ? searchResults : (stats?.logs || []);

  // Filter logs by type
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return activeLogsPool;
    return activeLogsPool.filter(l => l.type === logFilter);
  }, [activeLogsPool, logFilter]);

  const logCounts = useMemo(() => {
    let unique = 0;
    let repeat = 0;
    let click = 0;
    for (let i = 0; i < activeLogsPool.length; i++) {
      const t = activeLogsPool[i].type;
      if (t === 'unique') unique++;
      else if (t === 'repeat') repeat++;
      else if (t === 'click') click++;
    }
    return { unique, repeat, click };
  }, [activeLogsPool]);

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return 'recent';
    }
  };

  if (!isOpen) return null;

  const retentionRate = stats && stats.totalCount > 0 
    ? Math.round((stats.repeatCount / stats.totalCount) * 100) 
    : 0;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'p-1 sm:p-2' : 'p-2 sm:p-5'
      }`}>
        {/* Clean, high-performance backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 cursor-pointer"
          id="stats-modal-backdrop"
        />

        {/* Modal Window: Sleek Minimalist Dark HUD with Crisp Borders */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className={`relative w-full bg-[#080c09] border border-[#1b261e] rounded-lg shadow-2xl overflow-hidden flex flex-col font-mono z-50 text-[#c8d4ca] will-change-transform ${
            isFullscreen 
              ? 'w-[98.5vw] h-[97vh] max-w-[98.5vw] max-h-[97vh]' 
              : 'w-full max-w-6xl h-[92vh] sm:h-[88vh] max-h-[92vh] sm:max-h-[88vh]'
          }`}
          id="stats-modal-container"
        >
          {/* Header - Minimalist Tactical HUD Bar */}
          <div 
            className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0b100d] border-b border-[#1b261e] select-none gap-2 cursor-default"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {isAuthorized ? (
                <>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleStopTracking}
                      title="Stop tracking (ignore this device)"
                      className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                        isDeviceIgnored 
                          ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' 
                          : 'bg-red-500/35 hover:bg-red-500/75'
                      }`}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-amber-500/40" 
                      title="Terminal indicator" 
                    />
                    <button
                      type="button"
                      onClick={handleResumeTracking}
                      title="Resume tracking"
                      className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                        !isDeviceIgnored 
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
                          : 'bg-emerald-500/35 hover:bg-emerald-500/75'
                      }`}
                    />
                  </div>
                  <div className="h-4 w-[1px] bg-[#1e2a22] shrink-0" />
                </>
              ) : null}

              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#a4c9ad] uppercase truncate">
                  <span className="hidden sm:inline">BACKWOODS TELEMETRY TERMINAL</span>
                  <span className="sm:hidden">TELEMETRY</span>
                </span>

                {isAuthorized && (
                  <>
                    {/* Tab switch arrows: < > */}
                    <div className="inline-flex items-center gap-0.5 bg-surface-alt border border-line rounded px-1 py-0.5 text-xs font-mono shrink-0 select-none ml-1">
                      <button
                        type="button"
                        onClick={handlePrevMainTab}
                        className="p-0.5 text-ink-subtle hover:text-accent-text hover:bg-surface rounded transition-colors cursor-pointer"
                        title="Previous Tab (<)"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-semibold text-accent-text px-1 border-x border-line whitespace-nowrap">
                        {activeMainTab === 'telemetry'
                          ? '01: TELEMETRY'
                          : activeMainTab === 'radians'
                            ? '02: LIVE RADIANS'
                            : '03: LIVE CURSORS'}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMainTab}
                        className="p-0.5 text-ink-subtle hover:text-accent-text hover:bg-surface rounded transition-colors cursor-pointer"
                        title="Next Tab (>)"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {statusNotice && (
                      <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider shrink-0 font-bold ${
                        isDeviceIgnored
                          ? 'text-red-300 bg-red-950/80 border border-red-800'
                          : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800'
                      }`}>
                        <span className="hidden sm:inline">{statusNotice}</span>
                        <span className="sm:hidden">{isDeviceIgnored ? 'HALTED' : 'ACTIVE'}</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {isAuthorized ? (
                <>
                  {/* Mode indicator pill — always live */}
                  <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 text-[10px] tracking-wider uppercase font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE DB
                  </div>

                  {/* Sign out button */}
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/50 rounded transition-colors font-mono cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>EXIT</span>
                  </button>
                </>
              ) : null}

              <div className="flex items-center gap-1 sm:gap-1.5 border-l border-[#1b261e] pl-2 sm:pl-3">
                <button 
                  onClick={toggleFullscreen}
                  data-lock-control="true"
                  className="p-1 sm:p-1.5 text-[#5e7564] hover:text-emerald-400 hover:bg-[#121914] rounded transition-colors cursor-pointer"
                  title={isFullscreen ? "Restore compact size" : "Maximize / Fullscreen"}
                  id="stats-fullscreen-btn"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                {isAuthorized && (
                  <button 
                    onClick={handleManualRefresh}
                    disabled={loading || isRefreshing}
                    className="p-1 sm:p-1.5 text-[#5e7564] hover:text-emerald-400 hover:bg-[#121914] rounded transition-colors cursor-pointer disabled:opacity-40"
                    title="Synchronize telemetry logs"
                    id="stats-refresh-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  data-lock-control="true"
                  className="p-1 sm:p-1.5 text-[#5e7564] hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                  title="Close terminal (Esc)"
                  id="stats-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-2.5 sm:p-3.5 flex flex-col min-h-0 gap-2 sm:gap-2.5 overflow-hidden">
            {authChecking ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div className="text-[10px] text-[#5e7564] uppercase tracking-widest animate-pulse font-mono">
                  VERIFYING SYSTEM PROTOCOL...
                </div>
              </div>
            ) : !isAuthorized ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="max-w-md w-full flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full border border-red-900/60 bg-red-950/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <ShieldAlert className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-red-400 font-mono uppercase">
                      UNAUTHORIZED ACCESS
                    </h2>
                    <p className="text-[11px] text-[#5e7564] font-mono tracking-wider">
                      Security clearance required to view telemetry node.
                    </p>
                  </div>

                  {currentUser ? (
                    <div className="w-full mt-2 p-3 rounded border border-red-900/50 bg-red-950/30 text-xs text-red-400/90 font-mono text-center flex flex-col items-center gap-2">
                      <span>Connected as: <strong className="text-red-300">{currentUser.displayName || currentUser.email}</strong></span>
                      <span className="text-[10px] text-red-400/70">Account is not on the admin whitelist.</span>
                      <button
                        onClick={handleSignOut}
                        data-lock-control="true"
                        className="mt-1 px-3 py-1 bg-red-900/40 hover:bg-red-900/70 border border-red-700 text-[10px] uppercase tracking-wider rounded transition-colors text-red-200 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col items-center gap-3 w-full max-w-xs">
                      {/* Master Passkey Entry: Works everywhere, mobile and desktop, zero OAuth headaches */}
                      <form onSubmit={handleVerifyPasskey} className="w-full flex flex-col gap-2">
                        <div className="relative">
                          <input 
                            type="password"
                            value={passkeyInput}
                            onChange={(e) => setPasskeyInput(e.target.value)}
                            data-lock-control="true"
                            placeholder="Enter clearance key..."
                            className="w-full px-3 py-2 bg-[#090f0b] border border-[#233527] focus:border-emerald-500 rounded text-xs font-mono text-[#c8d4ca] placeholder-[#4f6454] outline-none text-center tracking-widest transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          data-lock-control="true"
                          className="w-full py-2 bg-[#122317] hover:bg-[#1a3321] border border-[#2e5236] hover:border-emerald-500 rounded text-xs font-mono tracking-wider uppercase text-emerald-400 font-semibold transition-all cursor-pointer shadow-md"
                        >
                          Unlock Terminal
                        </button>
                      </form>
                      
                      {authError && (
                        <div className="text-[10px] text-red-400 font-mono text-center mt-1">
                          {authError}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="hidden" aria-hidden="true">
                    <button
                      type="button"
                      id="radians-tab-trigger"
                      data-honey-probe="hidden_radians_probe"
                      data-tab="radians"
                      tabIndex={-1}
                      onClick={(e) => e.preventDefault()}
                    >
                      02: LIVE RADIANS
                    </button>
                    <button
                      type="button"
                      id="admin-override-btn"
                      data-honey-probe="nonexistent_admin_probe"
                      data-admin-action="override"
                      tabIndex={-1}
                      onClick={(e) => e.preventDefault()}
                    >
                      ADMIN OVERRIDE
                    </button>
                  </div>
                </div>
              </div>
            ) : activeMainTab === 'radians' ? (
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <div className="text-[10px] text-[#5e7564] uppercase tracking-widest animate-pulse font-mono">
                    LOADING RADIANS MODULE...
                  </div>
                </div>
              }>
                <LiveRadiansTab visitorId={currentVisitorIdShort} />
              </React.Suspense>
            ) : activeMainTab === 'cursors' ? (
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <div className="text-[10px] text-[#5e7564] uppercase tracking-widest animate-pulse font-mono">
                    LOADING CURSORS MODULE...
                  </div>
                </div>
              }>
                <LiveCursorsTab
                  visitorId={currentVisitorIdShort}
                  activeSlug={activeSlug}
                  onJumpToPeer={(targetSlug) => {
                    onJumpToSlug?.(targetSlug);
                    onClose();
                  }}
                />
              </React.Suspense>
            ) : loading && !stats ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
                <div className="text-[10px] text-[#5e7564] uppercase tracking-widest animate-pulse font-mono">
                  INITIALIZING TELEMETRY UPLINK...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-red-400 border border-red-900/40 bg-red-950/15 rounded p-5">
                <Database className="w-6 h-6 mb-2 text-red-500 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1 text-red-300">Access Protocol Fault</h4>
                <p className="text-[11px] text-red-400/80 max-w-md leading-relaxed">{error}</p>
                <button 
                  onClick={() => { setError(null); setRetryCount(prev => prev + 1); }}
                  className="mt-3 px-3 py-1 bg-red-950/40 hover:bg-red-950/70 border border-red-800 text-[10px] uppercase tracking-wider rounded transition-colors text-red-300 font-semibold"
                >
                  Retry Connection
                </button>
              </div>
            ) : stats ? (
              <>
                {/* Mobile HUD Tab Selector (< lg) */}
                <div className="flex lg:hidden items-center bg-[#0d130f] p-1 rounded border border-[#1b261e] shrink-0 gap-1 select-none">
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('overview')}
                    className={`flex-1 py-1.5 px-2 rounded text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeMobileTab === 'overview'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
                        : 'text-[#647c6a] hover:text-[#a4c9ad] border border-transparent'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Overview</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#080d0a] text-emerald-400 font-mono">
                      {stats.totalCount.toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('stream')}
                    className={`flex-1 py-1.5 px-2 rounded text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeMobileTab === 'stream'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
                        : 'text-[#647c6a] hover:text-[#a4c9ad] border border-transparent'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Trace Stream</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#080d0a] text-emerald-400 font-mono">
                      {filteredLogs.length}
                    </span>
                  </button>
                </div>

                {/* Unified Master 2-Column Command Cockpit (Side-by-Side on Desktop, Tabbed on Mobile) */}
                <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2.5 sm:gap-3 overflow-hidden">
                  {/* Left Analytical Sidebar: 3 Metric Cards + Telemetry Targets */}
                  <div className={`${activeMobileTab === 'overview' ? 'flex' : 'hidden'} lg:flex lg:col-span-4 flex-col gap-2 sm:gap-2.5 h-full min-h-0 overflow-hidden`}>
                    {/* 3 Compressed Metric Cards Stack */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 sm:gap-2 shrink-0">
                      {/* Total Hits */}
                      <div className="px-2.5 py-1.5 sm:py-2 bg-[#0d120f] border border-[#1b261e] rounded hover:border-[#27382c] transition-colors relative overflow-hidden">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-[#738f7a] uppercase tracking-wider flex items-center gap-1.5 truncate">
                            <Eye className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                            <span className="hidden sm:inline">Total Hits</span>
                            <span className="sm:hidden">Hits</span>
                          </span>
                          <span className="text-[8.5px] sm:text-[9px] text-[#5e7564] px-1.5 py-0.2 rounded border border-[#1b261e] bg-[#090d0a] font-mono shrink-0">
                            ALL
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-1">
                          <div className="text-lg sm:text-2xl font-bold text-[#e1eae2] font-sans tracking-tight">
                            {stats.totalCount.toLocaleString()}
                          </div>
                          <div className="text-[8.5px] sm:text-[9.5px] text-[#5e7564] uppercase font-mono truncate hidden sm:block">
                            Global records
                          </div>
                        </div>
                      </div>

                      {/* Unique Survivors */}
                      <div className="px-2.5 py-1.5 sm:py-2 bg-[#0d120f] border border-[#1b261e] rounded hover:border-[#27382c] transition-colors relative overflow-hidden">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="hidden sm:inline">Survivors</span>
                            <span className="sm:hidden">Unique</span>
                          </span>
                          <span className="text-[8.5px] sm:text-[9px] text-emerald-400/90 px-1.5 py-0.2 rounded border border-emerald-900/40 bg-emerald-950/30 font-mono shrink-0">
                            DISTINCT
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-1">
                          <div className="text-lg sm:text-2xl font-bold text-emerald-400 font-sans tracking-tight">
                            {stats.uniqueCount.toLocaleString()}
                          </div>
                          <div className="text-[8.5px] sm:text-[9.5px] text-emerald-500/70 uppercase font-mono truncate hidden sm:block">
                            Hardware nodes
                          </div>
                        </div>
                      </div>

                      {/* Returning Operatives */}
                      <div className="px-2.5 py-1.5 sm:py-2 bg-[#0d120f] border border-[#1b261e] rounded hover:border-[#27382c] transition-colors relative overflow-hidden">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5 truncate">
                            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="hidden sm:inline">Returning</span>
                            <span className="sm:hidden">Return</span>
                          </span>
                          <span className="text-[8.5px] sm:text-[9px] text-amber-400/90 px-1.5 py-0.2 rounded border border-amber-900/40 bg-amber-950/30 font-mono shrink-0">
                            {retentionRate}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-1">
                          <div className="text-lg sm:text-2xl font-bold text-amber-400 font-sans tracking-tight">
                            {stats.repeatCount.toLocaleString()}
                          </div>
                          <div className="text-[8.5px] sm:text-[9.5px] text-amber-500/70 uppercase font-mono truncate hidden sm:block">
                            Re-entries
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry Targets: Responsive Height */}
                    <div className="bg-[#0c110e] border border-[#1b261e] rounded p-2.5 sm:p-3 flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex items-center justify-between pb-2 border-b border-[#1b261e] mb-2 select-none shrink-0 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-[#a4c9ad] uppercase tracking-wider">
                            Telemetry Targets
                          </span>
                          {totalTargetsCount > 0 && (
                            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-[#111713] border border-[#1e2a20] text-emerald-400 font-mono">
                              {totalTargetsCount}
                            </span>
                          )}
                        </div>
                        {totalTargetsCount > 6 ? (
                          <button
                            type="button"
                            onClick={() => setShowAllTargets(prev => !prev)}
                            className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border border-[#213025] hover:border-emerald-600/60 bg-[#101712] hover:bg-[#152018] text-[#86a58e] hover:text-emerald-300 transition-colors uppercase tracking-wider cursor-pointer shrink-0"
                          >
                            {showAllTargets ? 'Top 6' : `All (${totalTargetsCount})`}
                          </button>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-[#4f6454] uppercase tracking-wider shrink-0">
                            Ranked
                          </span>
                        )}
                      </div>

                      {/* Fast Page Search & Filter Input */}
                      <div className="relative mb-2 shrink-0">
                        <Search className="w-3.5 h-3.5 text-[#5e7564] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={pageSearchQuery}
                          onChange={(e) => setPageSearchQuery(e.target.value)}
                          placeholder="Filter targets (e.g. Dimensions, Home)..."
                          className="w-full bg-[#080d0a] border border-[#1b261e] focus:border-emerald-600/70 focus:outline-none text-[10px] sm:text-[11px] font-mono text-[#d6ded7] placeholder-[#4f6454] pl-7 pr-7 py-1 rounded transition-all"
                        />
                        {pageSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPageSearchQuery('')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5e7564] hover:text-[#d6ded7] transition-colors p-0.5 cursor-pointer"
                            title="Clear filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {topPages.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#4f6454] italic">
                          {pageSearchQuery ? `No telemetry target matching "${pageSearchQuery}"` : 'No page view distribution recorded.'}
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 scrollbar-thin">
                          {topPages.map((page) => (
                            <div key={page.slug} className="group">
                              <div 
                                onClick={() => {
                                  // Click page target to instantly filter the entire history trace stream for this page
                                  setSearchUserId(page.slug);
                                }}
                                className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1 cursor-pointer select-none"
                                title={`Click to filter all historical trace logs for "${page.title}"`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <span className={`text-[8.5px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                                    page.rank === 1 
                                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                                      : 'bg-[#111713] border-[#1f2c22] text-[#5e7564]'
                                  }`}>
                                    #{String(page.rank).padStart(2, '0')}
                                  </span>
                                  <span className="truncate text-xs sm:text-[13px] text-[#cad6cc] group-hover:text-emerald-300 transition-colors" title={page.title}>
                                    {page.title}
                                  </span>
                                </div>
                                <span className="text-[10px] sm:text-[11px] text-emerald-400 font-mono font-bold shrink-0">
                                  {page.count.toLocaleString()} <span className="text-[8px] sm:text-[8.5px] font-normal text-[#4f6454]">HITS</span>
                                </span>
                              </div>
                              {/* Sleek Minimalist Progress Bar */}
                              <div className="w-full h-1.5 bg-[#121914] rounded-full overflow-hidden border border-[#1a251d]/50">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    page.rank === 1 ? 'bg-emerald-400' : 'bg-emerald-600/70'
                                  }`}
                                  style={{ width: `${page.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Realtime Telemetry Stream with Integrated User ID Search Engine */}
                  <div className={`${activeMobileTab === 'stream' ? 'flex' : 'hidden'} lg:flex lg:col-span-8 bg-[#0c110e] border border-[#1b261e] rounded p-2.5 sm:p-3 flex-col h-full min-h-0 overflow-hidden`}>
                    {/* Stream Header & Filters */}
                    <div className="flex flex-wrap sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-[#1b261e] mb-2 select-none gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${searchResults !== null ? 'bg-cyan-400' : 'bg-emerald-400'} opacity-60`}></span>
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${searchResults !== null ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#a4c9ad] uppercase tracking-wider truncate">
                          {searchResults !== null ? (
                            <>
                              <span className="hidden sm:inline">Database History Audit</span>
                              <span className="sm:hidden">History Audit</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Telemetry Trace Stream</span>
                              <span className="sm:hidden">Trace Stream</span>
                            </>
                          )}
                        </span>
                        {searchResults !== null && (
                          <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-mono uppercase font-bold shrink-0">
                            HISTORICAL
                          </span>
                        )}
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1 bg-[#090d0a] p-0.5 rounded border border-[#1b261e] shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setLogFilter('all')}
                          className={`px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'all'
                              ? 'bg-[#1b261e] text-[#d6ded7] border border-[#2b3c30]'
                              : 'text-[#4f6454] hover:text-[#a4c9ad]'
                          }`}
                        >
                          All ({activeLogsPool.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('unique')}
                          className={`px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'unique'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : 'text-[#4f6454] hover:text-emerald-400'
                          }`}
                        >
                          Unique ({logCounts.unique})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('repeat')}
                          className={`px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'repeat'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                              : 'text-[#4f6454] hover:text-amber-400'
                          }`}
                        >
                          Return ({logCounts.repeat})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('click')}
                          className={`px-2 py-0.5 text-[9px] sm:text-[10px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'click'
                              ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                              : 'text-[#4f6454] hover:text-purple-400'
                          }`}
                        >
                          Clicks ({logCounts.click})
                        </button>
                      </div>
                    </div>

                    {/* Optimized User ID Search Engine */}
                    <div className="relative mb-2 shrink-0">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-[#5e7564] absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={searchUserId}
                          onChange={(e) => setSearchUserId(e.target.value)}
                          placeholder="Search User ID, device/OS (e.g. Linux, Windows), or node..."
                          className="w-full bg-[#080d0a] border border-[#1b261e] focus:border-emerald-600/70 focus:outline-none text-[11px] sm:text-xs font-mono text-[#d6ded7] placeholder-[#4f6454] pl-8.5 pr-20 py-1.5 rounded transition-all"
                        />
                        {searchUserId ? (
                          <div className="absolute right-2 flex items-center gap-1.5">
                            {isSearching && (
                              <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchUserId('');
                                setSearchResults(null);
                                setSearchSummary(null);
                              }}
                              className="text-[#5e7564] hover:text-[#d6ded7] transition-colors p-0.5 cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSearchUserId(currentVisitorIdShort)}
                            className="absolute right-1.5 text-[8.5px] sm:text-[9.5px] text-[#5e7564] hover:text-emerald-400 transition-colors uppercase font-mono px-2 py-0.5 bg-[#0e1611] rounded border border-[#1c271f] cursor-pointer"
                            title="Audit history for your current browser node"
                          >
                            My Node
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Result Intelligence Card */}
                    {searchUserId.trim() && (
                      <div className="mb-2 bg-[#080d0a] border border-[#1b261e] rounded p-2 text-[9.5px] sm:text-[10px] font-mono select-none shrink-0">
                        {(isSearching || archiveStatus.isSyncing) && (!searchResults || searchResults.length === 0) ? (
                          <div className="flex items-center justify-between gap-2 text-emerald-400 py-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
                              <span>
                                Scanning full database for "{searchUserId}" ({archiveStatus.totalIndexed.toLocaleString()} indexed)...
                              </span>
                            </div>
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141d16] pb-1">
                              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                                <span className={`w-1.5 h-1.5 rounded-full ${archiveStatus.isSyncing ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                                <span>AUDIT: {searchResults.length.toLocaleString()} RECORDS FOUND</span>
                                {archiveStatus.isSyncing && (
                                  <span className="text-[8px] text-cyan-300 font-normal">
                                    (INDEXING {archiveStatus.totalIndexed.toLocaleString()}...)
                                  </span>
                                )}
                              </div>
                              <div className="text-[8px] sm:text-[8.5px] text-[#55695a] flex items-center gap-2">
                                <span>{searchSummary?.matchedNodes.length} NODE(S) MATCHED</span>
                                <span className={archiveStatus.isComplete ? 'text-emerald-500/80' : 'text-cyan-400/80'}>
                                  · {archiveStatus.isComplete ? `FULL ARCHIVE (${archiveStatus.totalIndexed.toLocaleString()})` : `${archiveStatus.totalIndexed.toLocaleString()} INDEXED`}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[8px] sm:text-[8.5px] text-[#7a9480]">
                              {searchSummary?.oldestDate && (
                                <span>
                                  FIRST: <strong className="text-[#a4c9ad]">{new Date(searchSummary.oldestDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                </span>
                              )}
                              {searchSummary?.newestDate && (
                                <span>
                                  LATEST: <strong className="text-[#a4c9ad]">{new Date(searchSummary.newestDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                </span>
                              )}
                              {searchSummary?.topTarget && (
                                <span>
                                  TOP: <strong className="text-emerald-400">{searchSummary.topTarget.title} ({searchSummary.topTarget.count}x)</strong>
                                </span>
                              )}
                              {searchSummary?.device && (
                                <span>
                                  PLATFORM: <strong className="text-emerald-300 font-semibold">{searchSummary.device}</strong>
                                </span>
                              )}
                            </div>
                            {archiveStatus.error && (
                              <div className="text-[8px] text-amber-400/90 pt-0.5">
                                {archiveStatus.error}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 text-[#687f6e] italic py-0.5">
                            <span>No records found in database history matching "{searchUserId}".</span>
                            <span className="not-italic text-[8px] text-[#55695a]">
                              {archiveStatus.isComplete ? `${archiveStatus.totalIndexed.toLocaleString()} LOGS SCANNED` : `${archiveStatus.totalIndexed.toLocaleString()} INDEXED`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scrollable Log Stream */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 pb-2 font-mono scrollbar-thin">
                      {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10 text-[#4f6454] italic">
                          <Radio className="w-4 h-4 mb-1 text-[#303f34]" />
                          <span className="text-xs">No telemetry trace events match the active criteria.</span>
                        </div>
                      ) : (
                        <>
                        {filteredLogs.slice(0, displayLimit).map((log, index) => {
                          const date = new Date(log.timestamp);
                          const timeOnly = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                          const isNew = log.type === 'unique';
                          const relativeTime = formatRelativeTime(log.timestamp);
                          const isCurrentVisitor = log.visitorId === currentVisitorIdShort;
                          const displayBrowser = log.browser || (isCurrentVisitor ? clientEnv.browser : null);
                          const displayOs = log.os || (isCurrentVisitor ? clientEnv.os : null);
                          const display = formatLogDisplay(log);

                          return (
                            <div 
                              key={`${log.timestamp}-${index}`} 
                              className="px-2.5 py-1.5 bg-[#080c09] hover:bg-[#101712] border border-[#162018] rounded transition-colors flex items-center justify-between gap-2 min-h-[32px] text-[10px] sm:text-[11px]"
                            >
                              {/* Left: Timestamp, Type Badge, Target Action */}
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 truncate">
                                {/* Monospace Timestamp */}
                                <span className="text-[#4e6453] text-[9px] sm:text-[10px] font-semibold shrink-0" title={date.toLocaleString()}>
                                  [{timeOnly}]
                                </span>

                                {/* Categorized Badge */}
                                {log.type === 'click' ? (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8px] uppercase font-bold tracking-wider bg-purple-950/80 text-purple-300 border border-purple-700/80">
                                    CLK
                                  </span>
                                ) : log.slug === 'telemetry-terminal' ? (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8px] uppercase font-bold tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                                    TERM
                                  </span>
                                ) : isNew ? (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8px] uppercase font-bold tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
                                    NEW
                                  </span>
                                ) : (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[7.5px] sm:text-[8px] uppercase font-bold tracking-wider bg-[#1c180a] text-amber-300 border border-amber-800/80">
                                    RET
                                  </span>
                                )}

                                {/* Destination Title */}
                                <span className="text-[#c8d8cb] hover:text-emerald-300 transition-colors truncate font-medium flex items-center gap-1">
                                  {log.type === 'click' ? (
                                    <MousePointerClick className="w-3 h-3 text-purple-400 shrink-0 inline" />
                                  ) : log.slug === 'telemetry-terminal' ? (
                                    <Terminal className="w-3 h-3 text-cyan-400 shrink-0 inline" />
                                  ) : null}
                                  <span className="truncate">{display.main}</span>
                                  {display.sub && (
                                    <span className="text-[#556e5d] text-[9px] shrink-0 font-normal">
                                      · {display.sub}
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Right: Device Pill, Visitor Node Chip, Relative Time */}
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {/* Inline Device Pill (Clickable Filter) */}
                                {(displayBrowser || displayOs) && (
                                  <div 
                                    onClick={() => setSearchUserId(displayOs || displayBrowser || 'Linux')}
                                    title={`Click to filter complete database history for ${displayOs || displayBrowser}`}
                                    className="flex items-center gap-1 text-[8px] sm:text-[8.5px] text-[#5e7765] hover:text-emerald-300 bg-[#0c120e] hover:bg-[#121c15] px-1.5 py-0.5 rounded border border-[#162017] hover:border-emerald-700/60 transition-colors cursor-pointer select-none group"
                                  >
                                    <Monitor className="w-2.5 h-2.5 text-emerald-500/70 group-hover:text-emerald-400 shrink-0" />
                                    <div className="flex items-center gap-1 truncate max-w-[130px]">
                                      {displayBrowser && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchUserId(displayBrowser);
                                          }}
                                          title={`Filter complete history for browser: ${displayBrowser}`}
                                          className="hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                                        >
                                          {displayBrowser}
                                        </button>
                                      )}
                                      {displayBrowser && displayOs && (
                                        <span className="text-[#324536] text-[7.5px]">·</span>
                                      )}
                                      {displayOs && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchUserId(displayOs);
                                          }}
                                          title={`Filter complete history for OS: ${displayOs}`}
                                          className="font-medium text-[#7a9d82] hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                                        >
                                          {displayOs}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Visitor Node Chip */}
                                {isCurrentVisitor ? (
                                  <button
                                    type="button"
                                    onClick={() => setSearchUserId(log.visitorId)}
                                    title="Click to search full database history for your node"
                                    className="text-[8.5px] sm:text-[9px] text-emerald-300 bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-700/60 font-mono font-semibold hover:bg-emerald-900/80 hover:border-emerald-500 transition-colors cursor-pointer"
                                  >
                                    {log.visitorId} <span className="hidden sm:inline">(YOU)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSearchUserId(log.visitorId)}
                                    title={`Click to search complete database history for node ${log.visitorId}`}
                                    className="text-[8.5px] sm:text-[9px] text-[#637d68] bg-[#0d140f] px-1.5 sm:px-2 py-0.5 rounded border border-[#1c271f] font-mono hover:text-emerald-400 hover:border-[#2f3f33] transition-colors cursor-pointer"
                                  >
                                    {log.visitorId}
                                  </button>
                                )}

                                {/* Elapsed Time */}
                                <span className="text-[#415546] shrink-0 text-[8px] sm:text-[8.5px] font-mono min-w-[34px] text-right">
                                  {relativeTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {filteredLogs.length > displayLimit && (
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setDisplayLimit(prev => prev + 250)}
                              className="px-3 py-1.5 bg-[#0e1611] hover:bg-[#15221a] border border-[#1f2e23] hover:border-emerald-700/60 text-[10px] font-mono text-emerald-300 rounded transition-colors cursor-pointer"
                            >
                              Load +250 ({(filteredLogs.length - displayLimit).toLocaleString()} remaining)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisplayLimit(filteredLogs.length)}
                              className="px-3 py-1.5 bg-[#0a100c] hover:bg-[#131d17] border border-[#1b261e] text-[10px] font-mono text-[#7a9480] hover:text-emerald-300 rounded transition-colors cursor-pointer"
                            >
                              Show All ({filteredLogs.length.toLocaleString()})
                            </button>
                          </div>
                        )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#4f6454] italic">
                System awaiting first scan.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
