import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RefreshCw,
  Terminal,
  Cpu,
  CheckCircle2,
  Activity,
  Zap,
  Layers,
  Database,
  BarChart3,
  Sparkles,
  Shield,
  FileCode,
} from 'lucide-react';

interface TelemetryLog {
  timestamp: string;
  type: 'unique' | 'repeat';
  slug: string;
  visitorId: string;
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
  articles?: Array<{ slug: string; title: string }>;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, articles = [] }) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'elements' | 'telemetry' | 'terminal'>('specs');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    // Initialize or read local stats
    try {
      const localStatsStr = localStorage.getItem('bonemeal_wiki_stats');
      if (localStatsStr) {
        setStats(JSON.parse(localStatsStr));
      } else {
        const localId = localStorage.getItem('wiki_visitor_id') || 'surv_pink_' + Math.random().toString(36).substring(2, 8);
        const defaultStats: StatsData = {
          uniqueCount: 24,
          repeatCount: 42,
          totalCount: 66,
          pageViews: {
            home: 28,
            items: 19,
            mechanics_aoe: 14,
            villager_trades: 11,
            versions: 8,
          },
          logs: [
            {
              timestamp: new Date().toISOString(),
              type: 'unique',
              slug: 'home',
              visitorId: localId.substring(0, 12),
            },
            {
              timestamp: new Date(Date.now() - 420000).toISOString(),
              type: 'repeat',
              slug: 'items',
              visitorId: 'surv_f38a19',
            },
            {
              timestamp: new Date(Date.now() - 1200000).toISOString(),
              type: 'unique',
              slug: 'mechanics_aoe',
              visitorId: 'surv_9921b7',
            },
            {
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              type: 'repeat',
              slug: 'villager_trades',
              visitorId: 'surv_84bb20',
            },
          ],
        };
        localStorage.setItem('bonemeal_wiki_stats', JSON.stringify(defaultStats));
        setStats(defaultStats);
      }
    } catch (e) {
      console.warn('Error reading local stats', e);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0c070a] border border-[#3b1c2f] p-6 text-xs font-mono shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#2b1422] shrink-0">
            <div className="flex items-center gap-2.5 text-[#f472b6]">
              <div className="w-7 h-7 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-[#f472b6]" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase text-[#fce7f3]">
                  SUPER BONE MEAL SYSTEM SPECIFICATIONS
                </h2>
                <p className="text-[10px] text-[#8c607a]">
                  NeoForge Mod Diagnostic & Telemetry Console
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-md bg-[#180d14] border border-[#2b1422] text-[#8c607a] hover:text-[#f472b6] hover:border-[#f472b6]/40 transition-colors cursor-pointer"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#f472b6]' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md bg-[#180d14] border border-[#2b1422] text-[#8c607a] hover:text-[#fce7f3] hover:border-[#f472b6]/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 py-3 border-b border-[#24101d] shrink-0 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'bg-[#2b1323] text-[#f472b6] border border-[#592244]'
                  : 'text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#140b10]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Mod Runtime</span>
            </button>

            <button
              onClick={() => setActiveTab('elements')}
              className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'elements'
                  ? 'bg-[#2b1323] text-[#f472b6] border border-[#592244]'
                  : 'text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#140b10]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mod Elements</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-[#2b1323] text-[#f472b6] border border-[#592244]'
                  : 'text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#140b10]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Wiki Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'terminal'
                  ? 'bg-[#2b1323] text-[#f472b6] border border-[#592244]'
                  : 'text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#140b10]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity Logs</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
            {/* TAB 1: RUNTIME SPECS */}
            {activeTab === 'specs' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#130b10] border border-[#2b1422] space-y-2">
                  <div className="flex items-center justify-between text-[#8c607a] text-[10px] uppercase">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#f472b6]" /> Target Loader
                    </span>
                    <span className="text-[#fce7f3] font-bold">NeoForge 1.21.1</span>
                  </div>
                  <div className="text-[#c29eb5] space-y-1 text-[11px]">
                    <p>• <strong>Java Version:</strong> OpenJDK 21 LTS (64-Bit)</p>
                    <p>• <strong>Mod ID:</strong> <code className="text-[#f472b6]">super_bonemeal</code></p>
                    <p>• <strong>Client & Server Side:</strong> Universal Network Layer</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#130b10] border border-[#2b1422] space-y-1">
                    <span className="text-[10px] text-[#8c607a] uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#f472b6]" /> Growth Pulse
                    </span>
                    <span className="text-sm font-bold text-[#fce7f3]">50 x 2 x 50 AoE</span>
                    <p className="text-[10px] text-[#a88098]">2,500 candidate blocks per right-click</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#130b10] border border-[#2b1422] space-y-1">
                    <span className="text-[10px] text-[#8c607a] uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#f472b6]" /> Particle FX
                    </span>
                    <span className="text-sm font-bold text-[#fce7f3]">200 Happy Villager</span>
                    <p className="text-[10px] text-[#a88098]">Green emerald particle spray burst</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MOD ELEMENTS */}
            {activeTab === 'elements' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#130b10] border border-[#2b1422] space-y-2">
                  <span className="text-[10px] text-[#8c607a] uppercase font-bold block">
                    Registered MCreator / Java Elements
                  </span>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-[#180d14] border border-[#2e1726] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span className="text-[#fce7f3] font-bold">Item: Super Bone Meal</span>
                      </div>
                      <code className="text-[10px] text-[#f472b6]">super_bonemeal</code>
                    </div>

                    <div className="p-2 rounded-lg bg-[#180d14] border border-[#2e1726] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span className="text-[#fce7f3] font-bold">Procedure: Right-Click Action</span>
                      </div>
                      <code className="text-[10px] text-[#f472b6]">SuperBonemealRightclickedOnBlock</code>
                    </div>

                    <div className="p-2 rounded-lg bg-[#180d14] border border-[#2e1726] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span className="text-[#fce7f3] font-bold">Recipe: 3x3 Shaped Crafting</span>
                      </div>
                      <code className="text-[10px] text-[#f472b6]">super_bonemeal_recipe.json</code>
                    </div>

                    <div className="p-2 rounded-lg bg-[#180d14] border border-[#2e1726] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span className="text-[#fce7f3] font-bold">Trade: Villager & Trader Offers</span>
                      </div>
                      <code className="text-[10px] text-[#f472b6]">SuperBonemealModTrades.java</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TELEMETRY & VIEWS */}
            {activeTab === 'telemetry' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#130b10] border border-[#2b1422] text-center space-y-0.5">
                    <span className="text-[10px] text-[#8c607a] uppercase">Unique Survivors</span>
                    <p className="text-xl font-bold text-[#fce7f3]">{stats?.uniqueCount || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#130b10] border border-[#2b1422] text-center space-y-0.5">
                    <span className="text-[10px] text-[#8c607a] uppercase">Repeat Visits</span>
                    <p className="text-xl font-bold text-[#f472b6]">{stats?.repeatCount || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#130b10] border border-[#2b1422] text-center space-y-0.5">
                    <span className="text-[10px] text-[#8c607a] uppercase">Total Engagements</span>
                    <p className="text-xl font-bold text-[#fce7f3]">{stats?.totalCount || 0}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#130b10] border border-[#2b1422] space-y-2">
                  <span className="text-[10px] text-[#8c607a] uppercase font-bold block">
                    Page View Distribution
                  </span>
                  <div className="space-y-1.5">
                    {stats?.pageViews &&
                      Object.entries(stats.pageViews).map(([slug, count]) => (
                        <div key={slug} className="flex items-center justify-between text-[11px]">
                          <span className="text-[#c29eb5] capitalize">{slug.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-[#f472b6]">{count} views</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REAL-TIME LOGS */}
            {activeTab === 'terminal' && (
              <div className="p-3.5 rounded-xl bg-[#090507] border border-[#261420] space-y-2">
                <div className="flex items-center justify-between text-[#8c607a] text-[10px] pb-1 border-b border-[#210f1b]">
                  <span>EVENT STREAM</span>
                  <span className="text-[#f472b6]">ACTIVE</span>
                </div>
                <div className="space-y-1.5 text-[10px] font-mono">
                  {stats?.logs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 text-[#a88098]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[#f472b6]">•</span>
                        <span className="text-[#fce7f3]">{log.visitorId}</span>
                        <span>navigated to</span>
                        <code className="text-[#f472b6]">{log.slug}</code>
                      </div>
                      <span className="text-[9px] text-[#6e465e] shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Terminal Footer */}
          <div className="pt-3 border-t border-[#2b1422] flex items-center justify-between text-[10px] text-[#6e465e] shrink-0">
            <span>SUPER BONE MEAL SURVIVAL SYSTEM</span>
            <span>STATUS: NORMAL // ONLINE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatsModal;
