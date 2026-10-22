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
  Radio,
  Layers,
  Search
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  getDocs,
  where,
  collection, 
  increment, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, hasConfig } from '../lib/firebase';

interface TelemetryLog {
  timestamp: string;
  type: 'unique' | 'repeat';
  slug: string;
  visitorId: string;
}

interface SearchSummary {
  totalLogs: number;
  uniqueCount: number;
  repeatCount: number;
  matchedNodes: string[];
  newestDate?: string;
  oldestDate?: string;
  topTarget?: { title: string; count: number };
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
}

export default function StatsModal({ isOpen, onClose, articles }: StatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [logFilter, setLogFilter] = useState<'all' | 'unique' | 'repeat'>('all');
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [isDeviceIgnored, setIsDeviceIgnored] = useState<boolean>(() => {
    return localStorage.getItem('wiki_telemetry_ignore_device') === 'true';
  });
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // User ID database search engine state
  const [searchUserId, setSearchUserId] = useState<string>('');
  const [searchResults, setSearchResults] = useState<TelemetryLog[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(null);
  const searchCacheRef = useRef<Map<string, TelemetryLog[]>>(new Map());

  const currentVisitorId = useMemo(() => {
    return localStorage.getItem('bonemeal_visitor_id') || localStorage.getItem('wiki_visitor_id') || 'unassigned';
  }, [isOpen]);

  const currentVisitorIdShort = currentVisitorId.substring(0, 12);

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
        if (localStorage.getItem('wiki_telemetry_ignore_device') === 'true') {
          return;
        }

        let visitorId = localStorage.getItem('bonemeal_visitor_id') || localStorage.getItem('wiki_visitor_id');
        if (!visitorId) {
          visitorId = 'surv_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('bonemeal_visitor_id', visitorId);
        }
        const shortVisitorId = visitorId.substring(0, 12);

        const recordLocalTerminal = (isUnique: boolean) => {
          try {
            const raw = localStorage.getItem('bonemeal_wiki_stats') || localStorage.getItem('local_wiki_stats');
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
              visitorId: shortVisitorId
            });
            if (localData.logs.length > 50) {
              localData.logs = localData.logs.slice(0, 50);
            }
            localStorage.setItem('bonemeal_wiki_stats', JSON.stringify(localData));
            setStats(localData);
          } catch (e) {
            console.error('Failed to log terminal open event to local sandbox', e);
          }
        };

        const optimisticType = localStorage.getItem('wiki_visitor_established') === 'true' ? 'repeat' : 'unique';
        const optimisticEntry: TelemetryLog = {
          timestamp: new Date().toISOString(),
          type: optimisticType,
          slug: 'telemetry-terminal',
          visitorId: shortVisitorId
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
          (async () => {
            try {
              const fullKey = `bonemeal_${visitorId}`;
              const visitorDocRef = doc(db, 'visitors', fullKey);
              const isKnownLocally = localStorage.getItem('wiki_visitor_established') === 'true';
              let isUnique = false;
              if (!isKnownLocally) {
                const visitorSnapshot = await getDoc(visitorDocRef);
                isUnique = !visitorSnapshot.exists();
                localStorage.setItem('wiki_visitor_established', 'true');
              }
              const visitorWrite = isUnique
                ? setDoc(visitorDocRef, {
                    wiki: 'super_bonemeal',
                    firstVisit: serverTimestamp(),
                    lastVisit: serverTimestamp()
                  })
                : setDoc(visitorDocRef, {
                    lastVisit: serverTimestamp()
                  }, { merge: true });

              const statsDocRef = doc(db, 'stats', 'super_bonemeal');
              const statsWrite = setDoc(statsDocRef, {
                wiki: 'super_bonemeal',
                totalCount: increment(1),
                uniqueCount: isUnique ? increment(1) : increment(0),
                repeatCount: !isUnique ? increment(1) : increment(0),
                ['pageViews.telemetry-terminal']: increment(1)
              }, { merge: true });

              const logWrite = addDoc(collection(db, 'telemetry_logs'), {
                wiki: 'super_bonemeal',
                timestamp: serverTimestamp(),
                type: isUnique ? 'unique' : 'repeat',
                slug: 'telemetry-terminal',
                visitorId: shortVisitorId
              });

              await Promise.all([visitorWrite, statsWrite, logWrite]);
            } catch (err) {
              console.warn('Firebase terminal logging failed, using local fallback', err);
              recordLocalTerminal(false);
            }
          })();
        } else {
          const raw = localStorage.getItem('bonemeal_wiki_stats') || localStorage.getItem('local_wiki_stats');
          let hasVisited = false;
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              hasVisited = parsed.logs?.some((l: TelemetryLog) => l.visitorId === shortVisitorId);
            } catch (e) {}
          }
          recordLocalTerminal(!hasVisited);
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
    if (!isOpen) return;

    const cachedStats = localStorage.getItem('cached_bonemeal_telemetry_stats') || 
                        localStorage.getItem('bonemeal_wiki_stats') || 
                        localStorage.getItem('local_wiki_stats');
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
    setIsSandbox(false);

    let statsUnsubscribe: () => void = () => {};
    let logsUnsubscribe: () => void = () => {};

    const enableSandboxFallback = () => {
      const localStatsStr = localStorage.getItem('bonemeal_wiki_stats') || localStorage.getItem('local_wiki_stats');
      if (localStatsStr) {
        try {
          setStats(JSON.parse(localStatsStr));
          setIsSandbox(true);
        } catch (e) {
          setError('Failed to parse local stats database.');
        }
      } else {
        const localId = localStorage.getItem('bonemeal_visitor_id') || 'surv_local';
        const defaultStats: StatsData = {
          uniqueCount: 16,
          repeatCount: 28,
          totalCount: 44,
          pageViews: { 'home': 22, 'items': 15, 'versions': 7 },
          logs: [
            {
              timestamp: new Date().toISOString(),
              type: 'unique' as const,
              slug: 'home',
              visitorId: localId.substring(0, 12)
            },
            {
              timestamp: new Date(Date.now() - 600000).toISOString(),
              type: 'repeat' as const,
              slug: 'items',
              visitorId: 'surv_f2910a'
            },
            {
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              type: 'unique' as const,
              slug: 'versions',
              visitorId: 'surv_f2910a'
            }
          ]
        };
        localStorage.setItem('bonemeal_wiki_stats', JSON.stringify(defaultStats));
        setStats(defaultStats);
        setIsSandbox(true);
      }
      setLoading(false);
    };

    if (!hasConfig) {
      enableSandboxFallback();
      return;
    }

    try {
      statsUnsubscribe = onSnapshot(doc(db, 'stats', 'super_bonemeal'), (statsDoc) => {
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
              localStorage.setItem('cached_bonemeal_telemetry_stats', JSON.stringify(nextStats));
            } catch {}
            return nextStats;
          });
          setIsSandbox(false);
        } else {
          setStats(prev => ({
            uniqueCount: 0,
            repeatCount: 0,
            totalCount: 0,
            pageViews: {},
            logs: prev?.logs || []
          }));
          setIsSandbox(false);
        }
        setLoading(false);
      }, (err) => {
        console.warn("Error listening to Firestore global stats, enabling local sandbox fallback.", err);
        enableSandboxFallback();
      });

      const logsQuery = query(
        collection(db, 'telemetry_logs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logs: TelemetryLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
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
            timestamp: tsStr,
            type: data.type || 'repeat',
            slug: data.slug || 'home',
            visitorId: data.visitorId || 'unknown'
          });
        });

        setStats(prev => {
          if (!prev) {
            return {
              uniqueCount: 0,
              repeatCount: 0,
              totalCount: logs.length,
              pageViews: {},
              logs
            };
          }
          return {
            ...prev,
            logs
          };
        });
      }, (err) => {
        console.warn("Error listening to logs stream, using local logs fallback.", err);
      });

    } catch (err) {
      console.warn("Failed to attach Firestore snapshot listeners", err);
      enableSandboxFallback();
    }

    return () => {
      statsUnsubscribe();
      logsUnsubscribe();
    };
  }, [isOpen, retryCount]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (isSandbox) {
      const localStatsStr = localStorage.getItem('bonemeal_wiki_stats') || localStorage.getItem('local_wiki_stats');
      if (localStatsStr) {
        try {
          setStats(JSON.parse(localStatsStr));
        } catch (e) {
          console.error(e);
        }
      }
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getArticleTitle = (slug: string) => {
    if (slug === 'telemetry-terminal' || slug === 'terminal') {
      return 'Telemetry Terminal';
    }
    const article = articles.find(a => a.slug === slug);
    if (article) return article.title;
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  };

  // Compute top visited pages breakdown
  const { topPages, totalTargetsCount } = useMemo(() => {
    if (!stats) return { topPages: [], totalTargetsCount: 0 };
    
    const viewsMap: Record<string, number> = { ...(stats.pageViews || {}) };
    if (Object.keys(viewsMap).length === 0 && stats.logs.length > 0) {
      stats.logs.forEach(log => {
        viewsMap[log.slug] = (viewsMap[log.slug] || 0) + 1;
      });
    }

    const sorted = Object.entries(viewsMap)
      .map(([slug, count]) => ({
        slug,
        title: getArticleTitle(slug),
        count
      }))
      .sort((a, b) => b.count - a.count);

    const maxCount = sorted.length > 0 ? Math.max(...sorted.map(p => p.count), 1) : 1;

    const ranked = sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentage: Math.round((item.count / maxCount) * 100)
    }));

    return {
      topPages: showAllTargets ? ranked : ranked.slice(0, 6),
      totalTargetsCount: ranked.length
    };
  }, [stats, articles, showAllTargets]);

  const computeSearchSummary = (results: TelemetryLog[]) => {
    if (results.length === 0) {
      setSearchSummary({
        totalLogs: 0,
        uniqueCount: 0,
        repeatCount: 0,
        matchedNodes: []
      });
      return;
    }
    const nodes = Array.from(new Set(results.map(r => r.visitorId)));
    const targetCounts: Record<string, number> = {};
    let uniqueCount = 0;
    let repeatCount = 0;

    results.forEach(r => {
      targetCounts[r.slug] = (targetCounts[r.slug] || 0) + 1;
      if (r.type === 'unique') uniqueCount++;
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

    setSearchSummary({
      totalLogs: results.length,
      uniqueCount,
      repeatCount,
      matchedNodes: nodes,
      newestDate: results[0]?.timestamp,
      oldestDate: results[results.length - 1]?.timestamp,
      topTarget: topSlug ? { title: getArticleTitle(topSlug), count: maxCount } : undefined
    });
  };

  // User ID database search engine effect with automatic debounce
  useEffect(() => {
    const trimmed = searchUserId.trim().toLowerCase();
    if (!trimmed) {
      setSearchResults(null);
      setSearchSummary(null);
      setIsSearching(false);
      return;
    }

    if (searchCacheRef.current.has(trimmed)) {
      const cached = searchCacheRef.current.get(trimmed)!;
      setSearchResults(cached);
      computeSearchSummary(cached);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        let results: TelemetryLog[] = [];
        if (hasConfig) {
          const prefixes = [trimmed];
          if (!trimmed.startsWith('surv_') && !trimmed.includes('_')) {
            prefixes.push('surv_' + trimmed);
          }
          const isGeneric = trimmed === 'surv' || trimmed === 'surv_';
          const logsMap = new Map<string, TelemetryLog>();

          for (const p of prefixes) {
            let q = query(
              collection(db, 'telemetry_logs'),
              where('visitorId', '>=', p),
              where('visitorId', '<=', p + '\uf8ff')
            );
            if (isGeneric) {
              q = query(q, limit(250));
            }
            const snap = await getDocs(q);
            snap.forEach(docSnap => {
              const data = docSnap.data();
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
              logsMap.set(docSnap.id, {
                timestamp: tsStr,
                type: data.type || 'repeat',
                slug: data.slug || 'home',
                visitorId: data.visitorId || 'unknown'
              });
            });
          }

          results = Array.from(logsMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } else {
          const localLogs = stats?.logs || [];
          results = localLogs.filter(l => l.visitorId.toLowerCase().includes(trimmed));
        }

        searchCacheRef.current.set(trimmed, results);
        setSearchResults(results);
        computeSearchSummary(results);
      } catch (err) {
        console.error('Error querying full Firestore history:', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(debounceTimer);
  }, [searchUserId, hasConfig, stats]);

  const activeLogsPool = searchResults !== null ? searchResults : (stats?.logs || []);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return activeLogsPool;
    return activeLogsPool.filter(log => log.type === logFilter);
  }, [activeLogsPool, logFilter]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop overlay with blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#120f0c] border border-[#2b2218] rounded-xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Terminal Window Header */}
          <div className="px-4 py-3 bg-[#17120e] border-b border-[#2b2118] flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              {/* Traffic light simulation with Double-Click Telemetry Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onDoubleClick={handleStopTracking}
                  title="Double-click: Stop tracking (ignore this device)"
                  className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                    isDeviceIgnored 
                      ? 'bg-red-500' 
                      : 'bg-red-500/35 hover:bg-red-500/75'
                  }`}
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" title="Telemetry Terminal Node" />
                <button
                  type="button"
                  onDoubleClick={handleResumeTracking}
                  title="Double-click: Resume tracking"
                  className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                    !isDeviceIgnored 
                      ? 'bg-[#dfc9ab]' 
                      : 'bg-[#dfc9ab]/35 hover:bg-[#dfc9ab]/75'
                  }`}
                />
              </div>
              <div className="h-4 w-[1px] bg-[#2e241c]" />
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#d4b28c]" />
                <span className="text-[11px] font-semibold tracking-wider text-[#dfc9ab] uppercase">
                  SUPER BONE MEAL TELEMETRY TERMINAL
                </span>
                {statusNotice && (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                    isDeviceIgnored
                      ? 'text-red-300 bg-red-950/60 border border-red-800/60'
                      : 'text-[#fbf7f0] bg-[#261f17] border border-[#8c7355]'
                  }`}>
                    {statusNotice}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode indicator pill */}
              {isSandbox ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-900/50 bg-amber-950/20 text-amber-300 text-[9px] tracking-wider uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  SANDBOX STORAGE
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#6b5842] bg-[#241c14] text-[#dfc9ab] text-[9px] tracking-wider uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dfc9ab] animate-pulse" />
                  LIVE DATABASE LINK
                </div>
              )}

              <div className="flex items-center gap-1.5 border-l border-[#2e241b] pl-3">
                <button 
                  onClick={handleManualRefresh}
                  disabled={loading || isRefreshing}
                  className="p-1.5 text-[#8c7e6c] hover:text-[#dfc9ab] hover:bg-[#1a1410] rounded transition-colors cursor-pointer disabled:opacity-40"
                  title="Synchronize telemetry logs"
                  id="stats-refresh-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-[#8c7e6c] hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                  title="Close terminal (Esc)"
                  id="stats-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {loading && !stats ? (
              <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
                <Activity className="w-7 h-7 text-[#d4b28c] animate-pulse" />
                <div className="text-[11px] text-[#8c7e6c] uppercase tracking-widest animate-pulse font-mono">
                  INITIALIZING TELEMETRY UPLINK...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-red-400 border border-red-900/40 bg-red-950/15 rounded p-6">
                <Database className="w-7 h-7 mb-2 text-red-500 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1 text-red-300">Access Protocol Fault</h4>
                <p className="text-[11px] text-red-400/80 max-w-md leading-relaxed">{error}</p>
                <button 
                  onClick={() => { setError(null); setRetryCount(prev => prev + 1); }}
                  className="mt-3 px-3 py-1 bg-red-950/40 hover:bg-red-950/70 border border-red-800 text-[10px] uppercase tracking-wider rounded transition-colors text-red-300 font-semibold cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : stats ? (
              <>
                {/* 1. HUD Metrics Ribbon (3 Crisp Modular Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Hits */}
                  <div className="p-3.5 bg-[#14100c] border border-[#261e17] rounded hover:border-[#3d3024] transition-colors relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-[#8c7e6c] uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#d4b28c]" />
                        Total Hits
                      </span>
                      <span className="text-[9px] text-[#b8a994] px-1.5 py-0.2 rounded border border-[#2b2118] bg-[#0d0b09]">
                        IMPRESSIONS
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#fbf7f0] font-sans tracking-tight">
                      {stats.totalCount.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#8c7e6c] mt-1 uppercase flex items-center gap-1 font-mono">
                      <span>Global telemetry records</span>
                    </div>
                  </div>

                  {/* Unique Survivors */}
                  <div className="p-3.5 bg-[#14100c] border border-[#261e17] rounded hover:border-[#3d3024] transition-colors relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-[#dfc9ab] uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#dfc9ab]" />
                        Unique Visitors
                      </span>
                      <span className="text-[9px] text-[#dfc9ab] px-1.5 py-0.2 rounded border border-[#6b5842] bg-[#221c16]">
                        DISTINCT
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#dfc9ab] font-sans tracking-tight">
                      {stats.uniqueCount.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#8c7e6c] mt-1 uppercase font-mono">
                      Unique terminal hardware nodes
                    </div>
                  </div>

                  {/* Returning Operatives */}
                  <div className="p-3.5 bg-[#14100c] border border-[#261e17] rounded hover:border-[#3d3024] transition-colors relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        Returning Visitors
                      </span>
                      <span className="text-[9px] text-amber-300 px-1.5 py-0.2 rounded border border-amber-900/40 bg-amber-950/30 font-mono">
                        {retentionRate}% RETENTION
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-amber-300 font-sans tracking-tight">
                      {stats.repeatCount.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#8c7e6c] mt-1 uppercase font-mono">
                      Repeated sessions logged
                    </div>
                  </div>
                </div>

                {/* 2. Split Analytical Panels: Top Destinations & Trace Stream */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  
                  {/* Left Column: Top Page Views / Destinations */}
                  <div className="lg:col-span-5 bg-[#14100c] border border-[#261e17] rounded p-3.5 flex flex-col h-[460px]">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#261e17] mb-2 select-none">
                      <span className="text-[11px] font-semibold text-[#dfc9ab] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#d4b28c]" />
                        Top Destinations ({totalTargetsCount})
                      </span>
                      {totalTargetsCount > 6 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTargets(prev => !prev)}
                          className="text-[9px] text-[#8c7e6c] hover:text-[#dfc9ab] font-mono uppercase transition-colors cursor-pointer"
                        >
                          {showAllTargets ? 'Show Top 6' : `View All (${totalTargetsCount})`}
                        </button>
                      )}
                    </div>

                    {topPages.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-[#8c7e6c] italic">
                        No page view distribution recorded.
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                        {topPages.map((page) => (
                          <div key={page.slug} className="group">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  page.rank === 1 
                                    ? 'bg-[#2a2118] border-[#8c7355] text-[#fbf7f0]' 
                                    : 'bg-[#18130f] border-[#2c2219] text-[#8c7e6c]'
                                }`}>
                                  #{String(page.rank).padStart(2, '0')}
                                </span>
                                <span className="truncate text-[#ede4d4] group-hover:text-[#dfc9ab] transition-colors" title={page.title}>
                                  {page.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#dfc9ab] font-mono font-bold shrink-0">
                                {page.count.toLocaleString()} <span className="text-[8px] font-normal text-[#8c7e6c]">HITS</span>
                              </span>
                            </div>

                            {/* Sleek Minimalist Progress Bar */}
                            <div className="w-full h-1 bg-[#1a1410] rounded-full overflow-hidden border border-[#2b2118]/40">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  page.rank === 1 ? 'bg-[#dfc9ab]' : 'bg-[#8c7355]'
                                }`}
                                style={{ width: `${page.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Realtime Telemetry Stream with Integrated User ID Search Engine */}
                  <div className="lg:col-span-7 bg-[#14100c] border border-[#261e17] rounded p-3.5 flex flex-col h-[460px]">
                    {/* Stream Header & Filters */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#261e17] mb-2 select-none">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${searchResults !== null ? 'bg-amber-400' : 'bg-[#dfc9ab]'} opacity-60`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${searchResults !== null ? 'bg-amber-500' : 'bg-[#dfc9ab]'}`}></span>
                        </span>
                        <span className="text-[11px] font-semibold text-[#dfc9ab] uppercase tracking-wider">
                          {searchResults !== null ? 'Database History Audit' : 'Telemetry Trace Stream'}
                        </span>
                        {searchResults !== null && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-mono uppercase font-bold">
                            HISTORICAL
                          </span>
                        )}
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1 bg-[#0d0b09] p-0.5 rounded border border-[#261e17]">
                        <button
                          type="button"
                          onClick={() => setLogFilter('all')}
                          className={`px-2 py-0.5 text-[9px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'all'
                              ? 'bg-[#271f16] text-[#fbf7f0] border border-[#524131]'
                              : 'text-[#8c7e6c] hover:text-[#dfc9ab]'
                          }`}
                        >
                          All ({activeLogsPool.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('unique')}
                          className={`px-2 py-0.5 text-[9px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'unique'
                              ? 'bg-[#2a2118] text-[#dfc9ab] border border-[#8c7355]'
                              : 'text-[#8c7e6c] hover:text-[#dfc9ab]'
                          }`}
                        >
                          Unique ({activeLogsPool.filter(l => l.type === 'unique').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogFilter('repeat')}
                          className={`px-2 py-0.5 text-[9px] uppercase font-semibold rounded transition-colors cursor-pointer ${
                            logFilter === 'repeat'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                              : 'text-[#8c7e6c] hover:text-amber-400'
                          }`}
                        >
                          Return ({activeLogsPool.filter(l => l.type === 'repeat').length})
                        </button>
                      </div>
                    </div>

                    {/* Optimized User ID Search Engine */}
                    <div className="relative mb-2">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-[#8c7e6c] absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={searchUserId}
                          onChange={(e) => setSearchUserId(e.target.value)}
                          placeholder="Search User ID across database history (e.g. surv_q8c, alvt29s)..."
                          className="w-full bg-[#0d0b09] border border-[#261e17] focus:border-[#c5a880] focus:outline-none text-[11px] font-mono text-[#ede4d4] placeholder-[#8c7e6c] pl-8 pr-16 py-1.5 rounded transition-all"
                        />
                        {searchUserId ? (
                          <div className="absolute right-2 flex items-center gap-1.5">
                            {isSearching && (
                              <span className="w-2.5 h-2.5 rounded-full border border-[#dfc9ab] border-t-transparent animate-spin" />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchUserId('');
                                setSearchResults(null);
                                setSearchSummary(null);
                              }}
                              className="text-[#8c7e6c] hover:text-[#ede4d4] transition-colors p-0.5 cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSearchUserId(currentVisitorIdShort)}
                            className="absolute right-2 text-[9px] text-[#8c7e6c] hover:text-[#dfc9ab] transition-colors uppercase font-mono px-1.5 py-0.5 bg-[#17120e] rounded border border-[#2b2118] cursor-pointer"
                            title="Audit history for your current browser node"
                          >
                            My Node
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Result Intelligence Card */}
                    {searchUserId.trim() && (
                      <div className="mb-2 bg-[#0d0b09] border border-[#261e17] rounded p-2 text-[10px] font-mono select-none">
                        {isSearching ? (
                          <div className="flex items-center gap-2 text-[#dfc9ab] py-0.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-[#dfc9ab] border-t-transparent animate-spin" />
                            <span>Querying full database history for node "{searchUserId}"...</span>
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1812] pb-1">
                              <div className="flex items-center gap-1.5 text-[#dfc9ab] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#dfc9ab]" />
                                <span>DATABASE AUDIT: {searchResults.length} RECORDS FOUND</span>
                              </div>
                              <div className="text-[9px] text-[#8c7e6c]">
                                {searchSummary?.matchedNodes.length} NODE(S) MATCHED
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-[#b8a994]">
                              {searchSummary?.oldestDate && (
                                <span>
                                  FIRST RECORDED: <strong className="text-[#fbf7f0]">{new Date(searchSummary.oldestDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                </span>
                              )}
                              {searchSummary?.newestDate && (
                                <span>
                                  LATEST ACTIVITY: <strong className="text-[#fbf7f0]">{new Date(searchSummary.newestDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                </span>
                              )}
                              {searchSummary?.topTarget && (
                                <span>
                                  TOP TARGET: <strong className="text-[#dfc9ab]">{searchSummary.topTarget.title} ({searchSummary.topTarget.count}x)</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#8c7e6c] italic py-0.5">
                            No records found in database history matching node ID "{searchUserId}".
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scrollable Log Stream */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono scrollbar-thin">
                      {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#8c7e6c] italic">
                          <Radio className="w-5 h-5 mb-1.5 text-[#423425]" />
                          <span>No telemetry trace events match the active criteria.</span>
                        </div>
                      ) : (
                        filteredLogs.map((log, index) => {
                          const date = new Date(log.timestamp);
                          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          const timeStr = `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} · ${dateStr}`;
                          const isNew = log.type === 'unique';
                          const relativeTime = formatRelativeTime(log.timestamp);

                          return (
                            <div 
                              key={`${log.timestamp}-${index}`} 
                              className="px-2.5 py-1.5 bg-[#0d0b09] hover:bg-[#1a1410] border border-[#221a13] rounded transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Timestamp */}
                                <span className="text-[#8c7e6c] text-[10px] font-semibold shrink-0" title={date.toLocaleString()}>
                                  [{timeStr}]
                                </span>

                                {/* Categorized Status Pill */}
                                {log.slug === 'telemetry-terminal' ? (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-[#2a2118] text-[#dfc9ab] border border-[#8c7355]">
                                    TERMINAL
                                  </span>
                                ) : isNew ? (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-[#261e16] text-[#dfc9ab] border border-[#6b5842]">
                                    NEW NODE
                                  </span>
                                ) : (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-[#221c16] text-amber-300 border border-amber-800/80">
                                    RETURN
                                  </span>
                                )}

                                {/* Destination Title */}
                                <span className="text-[#ede4d4] hover:text-[#dfc9ab] transition-colors truncate flex items-center gap-1.5">
                                  {log.slug === 'telemetry-terminal' && (
                                    <Terminal className="w-3 h-3 text-[#d4b28c] shrink-0 inline" />
                                  )}
                                  {getArticleTitle(log.slug)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Clickable Visitor ID Chip */}
                                {log.visitorId === currentVisitorIdShort ? (
                                  <button
                                    type="button"
                                    onClick={() => setSearchUserId(log.visitorId)}
                                    title="Click to search full database history for your node"
                                    className="text-[9px] text-[#fbf7f0] bg-[#2a2118] px-1.5 py-0.2 rounded border border-[#8c7355] font-mono font-semibold hover:bg-[#3d3023] hover:border-[#c5a880] transition-colors cursor-pointer"
                                  >
                                    {log.visitorId} (YOU)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSearchUserId(log.visitorId)}
                                    title={`Click to search complete database history for node ${log.visitorId}`}
                                    className="text-[9px] text-[#8c7e6c] bg-[#14100c] px-1.5 py-0.2 rounded border border-[#261e17] font-mono hover:text-[#dfc9ab] hover:border-[#423325] transition-colors cursor-pointer"
                                  >
                                    {log.visitorId}
                                  </button>
                                )}

                                {/* Elapsed */}
                                <span className="text-[9px] text-[#8c7e6c] w-12 text-right hidden sm:inline">
                                  {relativeTime}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Footer Protocol Banner */}
                <div className="p-3 bg-[#14100c] border border-[#261e17] rounded text-[10px] text-[#8c7e6c] leading-relaxed select-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[#dfc9ab] font-bold mr-1">PROTOCOL SUMMARY:</span>
                    {isSandbox 
                      ? "Sandbox mode engaged. Analytics persist safely in browser sandbox storage."
                      : "Telemetry uplink synchronized with central database cluster. Visitor sessions strictly anonymized."}
                  </div>
                  <div className="text-[9px] text-[#8c7e6c] shrink-0 font-mono">
                    PRESS <kbd className="px-1 py-0.2 bg-[#1b1511] border border-[#2e2319] text-[#b8a994] rounded text-[8px]">ESC</kbd> TO EXIT TERMINAL
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#8c7e6c] italic">
                System awaiting first scan.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
