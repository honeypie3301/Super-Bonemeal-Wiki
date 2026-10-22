import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Tag, 
  Sparkles, 
  Activity, 
  ShieldAlert, 
  GitCommit, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Archive, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  FileCode,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';

export interface ModrinthFile {
  id?: string;
  url: string;
  filename: string;
  primary?: boolean;
  size: number;
}

export interface ModrinthVersion {
  id: string;
  project_id?: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  date_published: string;
  downloads: number;
  version_type: 'release' | 'beta' | 'alpha';
  changelog?: string;
  files: ModrinthFile[];
}

export interface ArchivedVersion {
  version: string;
  tag: string;
  date: string;
  status: 'scrapped' | 'milestone';
  highlights: {
    title: string;
    description: string;
  }[];
}

const ARCHIVED_VERSIONS: ArchivedVersion[] = [
  {
    version: "Super Bone Meal v1.4.0",
    tag: "v1.4.0",
    date: "August 21, 2026",
    status: "milestone",
    highlights: [
      {
        title: "Loot Tables Injections",
        description: "Configured loot table generation for Archaeology (10% chance, 0–3 items), Chests (6% chance, 1–5 items), and Fishing (25% chance, 1–2 items)."
      },
      {
        title: "Shapeless Crafting Recipe",
        description: "Implemented shapeless crafting using 4 Bone Blocks and 5 Bone Meals yielding 2 Super Bone Meals."
      },
      {
        title: "Metadata & Logo Ingestion",
        description: "Integrated official mod logo asset and configured NeoForge >= 21.1.232 metadata in neoforge.mods.toml."
      }
    ]
  },
  {
    version: "Super Bone Meal v1.3.4",
    tag: "v1.3.4",
    date: "August 20, 2026",
    status: "milestone",
    highlights: [
      {
        title: "Villager & Trader Economy",
        description: "Added trades for Wandering Trader (2 Emeralds -> 1 Super Bone Meal, max 4 trades) and Level 2 Apprentice Farmer (1 Emerald -> 2 Super Bone Meals, max 10 trades)."
      }
    ]
  },
  {
    version: "Super Bone Meal v1.0.0",
    tag: "v1.0.0",
    date: "February 20, 2026",
    status: "milestone",
    highlights: [
      {
        title: "Core Mechanics Deployment",
        description: "Initial release featuring 50x2x50 volume fertilization loop and 10-cycle targeted plant growth acceleration."
      }
    ]
  }
];

// Offline snapshot fallback
const FALLBACK_MODRINTH_VERSIONS: ModrinthVersion[] = [
  {
    id: "VwLivJ7U",
    project_id: "fX8yk2ug",
    name: "Super Bone Meal 1.4.0",
    version_number: "1.4.0",
    game_versions: ["1.21.1"],
    loaders: ["neoforge"],
    date_published: "2026-08-21T14:14:55.583326Z",
    downloads: 385,
    version_type: "release",
    changelog: "New Content\n\n* Villager and Wanderer trading\n* 3 loot tables\n* Logo\n\nChanges\n\n* Configured shapeless crafting recipe: 4 Bone Blocks + 5 Bone Meals -> 2 Super Bone Meals\n* Verified NeoForge 1.21.1 target build requirements",
    files: [
      {
        url: "https://cdn.modrinth.com/data/fX8yk2ug/versions/VwLivJ7U/super_bonemeal-1.4.0-neoforge-1.21.1.jar",
        filename: "super_bonemeal-1.4.0-neoforge-1.21.1.jar",
        primary: true,
        size: 89214
      }
    ]
  },
  {
    id: "x6gIcEB7",
    project_id: "fX8yk2ug",
    name: "Super Bone Meal 1.3.3",
    version_number: "1.3.3",
    game_versions: ["1.21.1"],
    loaders: ["neoforge"],
    date_published: "2026-03-11T09:27:36.218975Z",
    downloads: 512,
    version_type: "release",
    changelog: "* Targeted growth single-plant focus: directly clicking crop, sapling, or moss runs 10 pulses instantly without affecting surrounding area.\n* Adjusted vertical scan range to reduce unnecessary calculations.\n* Merged redundant check loops into a streamlined logic gate.\n* Added support for c:saplings, minecraft:crops, and snowrealmagic:plants tags.",
    files: [
      {
        url: "https://cdn.modrinth.com/data/fX8yk2ug/versions/x6gIcEB7/super_bonemeal-1.3.3-neoforge-1.21.1.jar",
        filename: "super_bonemeal-1.3.3-neoforge-1.21.1.jar",
        primary: true,
        size: 14363
      }
    ]
  },
  {
    id: "X6xf27Nm",
    project_id: "fX8yk2ug",
    name: "Super Bone Meal 1.3.3 (Forge)",
    version_number: "1.3.3",
    game_versions: ["1.20.1"],
    loaders: ["forge"],
    date_published: "2026-03-11T09:38:45.806719Z",
    downloads: 1290,
    version_type: "release",
    changelog: "Minecraft 1.20.1 Forge port.\n\n* Single plant focus mode\n* Tag compatibility for forge crops",
    files: [
      {
        url: "https://cdn.modrinth.com/data/fX8yk2ug/versions/X6xf27Nm/super_bonemeal-1.3.3-forge-1.20.1.jar",
        filename: "super_bonemeal-1.3.3-forge-1.20.1.jar",
        primary: true,
        size: 643936
      }
    ]
  },
  {
    id: "tLC9m5S6",
    project_id: "fX8yk2ug",
    name: "Super Bone Meal 1.3.2",
    version_number: "1.3.2",
    game_versions: ["1.21.1"],
    loaders: ["neoforge"],
    date_published: "2026-02-26T15:36:59.026536Z",
    downloads: 410,
    version_type: "release",
    changelog: "* Implemented tag-based detection for saplings and crops.\n* Added Moss Block spreading logic support.\n* Reduced AOE height scan range.",
    files: [
      {
        url: "https://cdn.modrinth.com/data/fX8yk2ug/versions/tLC9m5S6/super_bonemeal_experimental-1.3.2-neoforge-1.21.1.jar",
        filename: "super_bonemeal_experimental-1.3.2-neoforge-1.21.1.jar",
        primary: true,
        size: 14452
      }
    ]
  }
];

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Simple parser for changelog text (markdown bullet points and bold tags)
function renderChangelog(text?: string) {
  if (!text) return <p className="text-xs text-[#8c7e6c] italic">No changelog provided.</p>;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-xs text-[#cfc2ae] font-mono leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#dfc9ab] select-none mt-1">•</span>
              <span>{content}</span>
            </div>
          );
        }
        
        if (trimmed.endsWith(':') || trimmed.toLowerCase() === 'new content' || trimmed.toLowerCase() === 'changes') {
          return (
            <div key={idx} className="font-bold text-[#fbf7f0] font-serif uppercase tracking-wider pt-2 pb-0.5 text-[11px] border-b border-[#2b2219]">
              {trimmed}
            </div>
          );
        }
        return <div key={idx}>{trimmed}</div>;
      })}
    </div>
  );
}

export default function VersionsView() {
  const [modrinthVersions, setModrinthVersions] = useState<ModrinthVersion[]>(FALLBACK_MODRINTH_VERSIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'modrinth' | 'archived'>('all');
  const [loaderFilter, setLoaderFilter] = useState<'all' | 'neoforge' | 'forge'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expandable changelogs
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleChangelog = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.modrinth.com/v2/project/super-bone-meal/version', {
        headers: {
          'User-Agent': 'SuperBoneMealWiki/1.0 (https://github.com/honeypie3301/Super-Bonemeal-Wiki)'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ModrinthVersion[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setModrinthVersions(data);
        setIsLive(true);
        setLastUpdated(new Date());
        try {
          localStorage.setItem('super_bonemeal_modrinth_versions_cache', JSON.stringify({
            timestamp: Date.now(),
            data
          }));
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch {
      // Try local cache fallback
      try {
        const cached = localStorage.getItem('super_bonemeal_modrinth_versions_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.data)) {
            setModrinthVersions(parsed.data);
            setLastUpdated(new Date(parsed.timestamp));
          }
        }
      } catch {
        // Fall back to bundled static snapshot
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  // Filtered Modrinth versions
  const filteredModrinth = useMemo(() => {
    return modrinthVersions.filter(v => {
      // Loader match
      if (loaderFilter !== 'all') {
        const hasLoader = v.loaders.some(l => l.toLowerCase() === loaderFilter);
        if (!hasLoader) return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesVer = v.version_number.toLowerCase().includes(q);
        const matchesChangelog = (v.changelog || '').toLowerCase().includes(q);
        const matchesGame = v.game_versions.some(gv => gv.includes(q));
        if (!matchesName && !matchesVer && !matchesChangelog && !matchesGame) return false;
      }
      return true;
    });
  }, [modrinthVersions, loaderFilter, searchQuery]);

  // Filtered Archived versions
  const filteredArchived = useMemo(() => {
    return ARCHIVED_VERSIONS.filter(v => {
      if (loaderFilter !== 'all' && loaderFilter !== 'neoforge') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesVer = v.version.toLowerCase().includes(q);
        const matchesTag = v.tag.toLowerCase().includes(q);
        const matchesHighlights = v.highlights.some(h => 
          h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q)
        );
        if (!matchesVer && !matchesTag && !matchesHighlights) return false;
      }
      return true;
    });
  }, [loaderFilter, searchQuery]);

  const totalModrinthCount = modrinthVersions.length;
  const totalArchivedCount = ARCHIVED_VERSIONS.length;

  return (
    <UpdatedFrame id="versions_modrinth_hybrid" isUpdated={true}>
      <div className="space-y-8 py-2 select-text">
        
        {/* Header Overview Card */}
        <div className="p-5 bg-[#14100c] border border-[#2c2219] rounded-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#fbf7f0] tracking-wide">
                  Version Archive &amp; Release Log
                </h2>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#261e16] text-[#dfc9ab] border border-[#6b5842]">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#dfc9ab]" />
                    LIVE MODRINTH
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#221c16] text-amber-300 border border-amber-800/60">
                    SNAPSHOT
                  </span>
                )}
              </div>
              <p className="text-xs text-[#b8a994] leading-relaxed max-w-2xl font-sans">
                Official release versions synchronized via the Modrinth REST API alongside preserved internal pre-release milestone chronicles.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={fetchVersions}
                disabled={isLoading}
                title="Refresh releases from Modrinth"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1510] hover:bg-[#251d16] text-[#dfc9ab] border border-[#3d3124] rounded-lg text-xs font-mono transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Sync Modrinth'}</span>
              </button>
              <a
                href="https://modrinth.com/mod/super-bone-meal/versions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#261e16] hover:bg-[#33281e] text-[#fbf7f0] border border-[#6b5842] rounded-lg text-xs font-mono transition-all"
              >
                <span>Modrinth Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#261e17]">
            <div className="p-2.5 bg-[#0d0b09] border border-[#221a13] rounded-lg">
              <span className="text-[10px] font-mono text-[#8c7e6c] uppercase block">Latest Build</span>
              <span className="text-xs font-mono font-bold text-[#dfc9ab]">
                v{modrinthVersions[0]?.version_number || '1.4.0'}
              </span>
            </div>
            <div className="p-2.5 bg-[#0d0b09] border border-[#221a13] rounded-lg">
              <span className="text-[10px] font-mono text-[#8c7e6c] uppercase block">Modrinth Releases</span>
              <span className="text-xs font-mono font-bold text-[#fbf7f0]">
                {totalModrinthCount} builds
              </span>
            </div>
            <div className="p-2.5 bg-[#0d0b09] border border-[#221a13] rounded-lg">
              <span className="text-[10px] font-mono text-[#8c7e6c] uppercase block">Milestones</span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {totalArchivedCount} chronicles
              </span>
            </div>
            <div className="p-2.5 bg-[#0d0b09] border border-[#221a13] rounded-lg">
              <span className="text-[10px] font-mono text-[#8c7e6c] uppercase block">Primary Platform</span>
              <span className="text-xs font-mono font-bold text-[#d4b28c]">
                NeoForge 1.21.1
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#120f0c] border border-[#241c15] rounded-xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#2a2118] text-[#fbf7f0] border border-[#8c7355] font-bold'
                  : 'bg-[#18130f] text-[#b8a994] hover:text-[#fbf7f0] border border-[#2c2219]'
              }`}
            >
              All Versions ({totalModrinthCount + (loaderFilter === 'all' || loaderFilter === 'neoforge' ? totalArchivedCount : 0)})
            </button>
            <button
              onClick={() => setActiveTab('modrinth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'modrinth'
                  ? 'bg-[#2a2118] text-[#fbf7f0] border border-[#8c7355] font-bold'
                  : 'bg-[#18130f] text-[#b8a994] hover:text-[#fbf7f0] border border-[#2c2219]'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              Official Releases ({totalModrinthCount})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-[#261f17] text-amber-300 border border-amber-700/80 font-bold'
                  : 'bg-[#18130f] text-[#b8a994] hover:text-[#fbf7f0] border border-[#2c2219]'
              }`}
            >
              <Archive className="w-3 h-3" />
              Milestone Archives ({totalArchivedCount})
            </button>
          </div>

          {/* Secondary Controls: Loader filter + search query */}
          <div className="flex items-center gap-2">
            {/* Loader Filter */}
            <div className="flex items-center gap-1 bg-[#17120e] border border-[#2b2118] rounded-lg p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setLoaderFilter('all')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  loaderFilter === 'all' ? 'bg-[#271f16] text-[#dfc9ab] font-bold' : 'text-[#8c7e6c] hover:text-[#ede4d4]'
                }`}
              >
                All Loaders
              </button>
              <button
                onClick={() => setLoaderFilter('neoforge')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  loaderFilter === 'neoforge' ? 'bg-[#271f16] text-[#dfc9ab] font-bold' : 'text-[#8c7e6c] hover:text-[#ede4d4]'
                }`}
              >
                NeoForge
              </button>
              <button
                onClick={() => setLoaderFilter('forge')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  loaderFilter === 'forge' ? 'bg-[#271f16] text-[#dfc9ab] font-bold' : 'text-[#8c7e6c] hover:text-[#ede4d4]'
                }`}
              >
                Forge
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative flex items-center min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c7e6c] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter version / changelog..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#17120e] border border-[#2b2118] rounded-lg py-1 pl-8 pr-2 text-xs text-[#ede4d4] placeholder-[#8c7e6c] focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>
        </div>

        {/* Timeline Stream */}
        <div className="relative pl-6 sm:pl-8 border-l border-[#2c2219] space-y-10">
          
          {/* 1. Official Modrinth Releases */}
          {(activeTab === 'all' || activeTab === 'modrinth') && (
            <>
              {filteredModrinth.map((v) => {
                const primaryFile = v.files.find(f => f.primary) || v.files[0];
                const isExpanded = !!expandedIds[v.id];
                const gameVerStr = v.game_versions.join(', ');
                const loaderStr = v.loaders.join(', ');

                return (
                  <div key={v.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#0d0b09] border-2 border-[#d4b28c] shadow-sm shadow-[#2b2118] z-10">
                      <GitCommit className="w-3.5 h-3.5 text-[#d4b28c]" />
                    </div>

                    {/* Version Card */}
                    <div className="bg-[#14100c] border border-[#281f16] hover:border-[#423324] rounded-xl p-5 space-y-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#fbf7f0] tracking-tight">
                              {v.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#241c15] text-[#dfc9ab] border border-[#594733] uppercase">
                              <Tag className="w-2.5 h-2.5" />
                              v{v.version_number}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1d1711] text-[#cbb89e] border border-[#3b2f22]">
                              {loaderStr.toUpperCase()} • {gameVerStr}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#261e16] text-[#dfc9ab] border border-[#6b5842]">
                              Official
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#8c7e6c] font-mono pt-0.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#d4b28c]" />
                              {formatDate(v.date_published)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[#b8a994]">
                              <Download className="w-3.5 h-3.5 text-[#d4b28c]" />
                              {v.downloads.toLocaleString()} downloads
                            </span>
                            {primaryFile && (
                              <span className="flex items-center gap-1.5 text-[#8c7e6c]">
                                <FileCode className="w-3.5 h-3.5" />
                                {formatBytes(primaryFile.size)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct Download Button */}
                        {primaryFile && (
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <a
                              href={primaryFile.url}
                              download
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#251d16] hover:bg-[#36291e] text-[#fbf7f0] hover:text-white border border-[#6b5842] rounded-lg text-xs font-mono font-bold transition-all shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5 text-[#dfc9ab]" />
                              <span>Download .jar</span>
                            </a>
                            <a
                              href={`https://modrinth.com/mod/super-bone-meal/version/${v.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Inspect on Modrinth"
                              className="p-1.5 bg-[#17120e] hover:bg-[#251d16] text-[#8c7e6c] hover:text-[#dfc9ab] border border-[#2b2118] rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Expandable Changelog Accordion */}
                      {v.changelog && (
                        <div className="pt-2 border-t border-[#261e17]">
                          <button
                            onClick={() => toggleChangelog(v.id)}
                            className="flex items-center justify-between w-full text-left py-1 text-xs font-mono text-[#b8a994] hover:text-[#fbf7f0] transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <FileCode className="w-3.5 h-3.5 text-[#d4b28c]" />
                              {isExpanded ? 'Hide Release Changelog' : 'View Release Changelog'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 p-4 bg-[#0d0b09] border border-[#221b14] rounded-lg">
                              {renderChangelog(v.changelog)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 2. Archived / Milestone Versions */}
          {(activeTab === 'all' || activeTab === 'archived') && (
            <>
              {filteredArchived.map((v) => (
                <div key={v.version} className="relative group">
                  {/* Timeline Node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#0d0b09] border-2 border-amber-600/80 shadow-sm shadow-amber-950/20 z-10">
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                  </div>

                  {/* Version Card */}
                  <div className="bg-[#14100c] border border-amber-900/30 hover:border-amber-800/50 rounded-xl p-5 space-y-4 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#fbf7f0] tracking-tight">
                            {v.version}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#261e16] text-amber-300 border border-amber-800/60 uppercase">
                            <Tag className="w-2.5 h-2.5" />
                            {v.tag}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1d1711] text-amber-400/90 border border-[#3d2f21] uppercase">
                            Milestone Chronicle
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8c7e6c] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#d4b28c]" />
                          <span>Recorded Milestone: {v.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Developmental Highlights */}
                    <div className="grid gap-3 pt-2">
                      {v.highlights.map((h, hIdx) => (
                        <div
                          key={hIdx}
                          className="p-3.5 bg-[#0d0b09] border border-[#221a13] rounded-lg"
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 p-1 rounded bg-[#1c1611] border border-[#2e2319] shrink-0 h-fit">
                              {hIdx === 0 && <Sparkles className="w-3.5 h-3.5 text-[#d4b28c]" />}
                              {hIdx === 1 && <Activity className="w-3.5 h-3.5 text-[#dfc9ab]" />}
                              {hIdx === 2 && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-serif text-xs font-bold text-[#fbf7f0]">
                                {h.title}
                              </h4>
                              <p className="text-xs text-[#b8a994] leading-relaxed font-sans">
                                {h.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty State */}
          {filteredModrinth.length === 0 && filteredArchived.length === 0 && (
            <div className="p-8 text-center bg-[#14100c] border border-[#2c2219] rounded-xl space-y-2">
              <p className="text-sm text-[#b8a994] font-mono">No matching versions found.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLoaderFilter('all');
                  setActiveTab('all');
                }}
                className="text-xs text-[#dfc9ab] hover:underline font-mono cursor-pointer"
              >
                Clear active filters
              </button>
            </div>
          )}

        </div>
      </div>
    </UpdatedFrame>
  );
}
