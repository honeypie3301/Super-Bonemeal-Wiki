import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Sparkles, Activity, ShieldAlert, GitCommit, Download, RefreshCw, Layers, ExternalLink, CheckCircle } from 'lucide-react';
import UpdatedFrame from '../UpdatedFrame';

interface ModrinthVersion {
  id: string;
  name: string;
  version_number: string;
  changelog?: string;
  date_published: string;
  downloads: number;
  version_type: 'release' | 'beta' | 'alpha';
  loaders: string[];
  game_versions: string[];
  files: {
    url: string;
    filename: string;
    primary: boolean;
    size: number;
  }[];
}

interface FallbackVersion {
  version: string;
  tag: string;
  date: string;
  status: 'release' | 'beta' | 'alpha';
  loaders: string[];
  gameVersions: string[];
  highlights: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const fallbackVersions: FallbackVersion[] = [
  {
    version: "Super Bone Meal v1.2.0",
    tag: "v1.2.0",
    date: "2024-11-20",
    status: "release",
    loaders: ["NeoForge", "Fabric", "Forge"],
    gameVersions: ["1.21.1", "1.20.1"],
    highlights: [
      {
        title: "Trading System Integration",
        description: "Added dedicated survival trading mechanisms. Wandering Traders offer 1 Super Bone Meal for 2 Emeralds, and Level 2 Apprentice Farmer Villagers offer 2 Super Bone Meal for 1 Emerald.",
        icon: <Sparkles className="w-4 h-4 text-[#f472b6]" />
      },
      {
        title: "50x50 Massive Area Fertilization",
        description: "Expands botanical acceleration over a massive 50x50 radius (2,500 blocks) with smart grass filtering to prevent unsightly tall grass clutter.",
        icon: <Activity className="w-4 h-4 text-[#f9a8d4]" />
      },
      {
        title: "Instant Single-Target Crop Pulses",
        description: "Right-clicking crops, saplings, sugar cane, or bamboo applies 10 rapid growth pulses in 1 tick to force instant maturity.",
        icon: <CheckCircle className="w-4 h-4 text-[#f472b6]" />
      }
    ]
  },
  {
    version: "Super Bone Meal v1.1.0",
    tag: "v1.1.0",
    date: "2024-09-15",
    status: "release",
    loaders: ["NeoForge", "Fabric"],
    gameVersions: ["1.21.1"],
    highlights: [
      {
        title: "Smart Grass Detection",
        description: "Implemented checks preventing double-growth on existing short grass to preserve clean landscape aesthetics.",
        icon: <Sparkles className="w-4 h-4 text-[#f472b6]" />
      },
      {
        title: "Shapeless Bulk Crafting",
        description: "Introduced craft duplication recipes combining Bone Blocks and Super Bone Meal in any crafting bench.",
        icon: <Layers className="w-4 h-4 text-[#f9a8d4]" />
      }
    ]
  },
  {
    version: "Super Bone Meal v1.0.0",
    tag: "v1.0.0",
    date: "2024-07-10",
    status: "release",
    loaders: ["NeoForge", "Fabric", "Forge"],
    gameVersions: ["1.21.0", "1.20.1"],
    highlights: [
      {
        title: "Initial Launch",
        description: "First public release featuring high-potency bone meal formulation and 100-200 villager particle emission bursts.",
        icon: <Sparkles className="w-4 h-4 text-[#f472b6]" />
      }
    ]
  }
];

export default function VersionsView() {
  const [modrinthData, setModrinthData] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.modrinth.com/v2/project/super-bone-meal/version');
      if (!response.ok) {
        throw new Error(`Modrinth API responded with status ${response.status}`);
      }
      const data: ModrinthVersion[] = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setModrinthData(data);
      } else {
        setModrinthData([]);
      }
    } catch (err: any) {
      console.warn('Could not fetch live Modrinth version history, using cached data:', err);
      setError(err?.message || 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  return (
    <div className="space-y-12 py-4 select-text">
      {/* Intro section */}
      <div className="p-5 bg-[#140c12] border border-[#2b1725] rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-serif text-base font-bold text-[#fce7f3]">Mod Release & Version History</h4>
          <p className="text-xs text-[#c4adb7] leading-relaxed mt-1">
            Real-time version distribution and update changelogs synced directly from the Modrinth API for Super Bone Meal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchVersions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f101a] border border-[#441f35] text-[#f9a8d4] rounded text-xs font-mono hover:border-[#6b2a4f] hover:text-[#fce7f3] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync API
          </button>
          
          <a
            href="https://modrinth.com/mod/super-bone-meal"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#291321] border border-[#6b2a4f] text-[#f472b6] rounded text-xs font-mono hover:bg-[#381a2e] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Modrinth
          </a>
        </div>
      </div>

      {/* Timeline container */}
      <div className="relative pl-6 sm:pl-8 border-l border-[#2e1627]">
        {/* Render Live Modrinth Data if available */}
        {modrinthData.length > 0 ? (
          modrinthData.map((v, index) => {
            const dateFormatted = new Date(v.date_published).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <UpdatedFrame key={v.id} id={`ver_${v.id}`} isUpdated={index === 0}>
                <div className="relative mb-12 last:mb-0">
                  {/* Dot Indicator */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#0e080b] border-2 border-[#f472b6] shadow-sm shadow-pink-950/40 z-10">
                    <GitCommit className="w-3.5 h-3.5 text-[#f472b6]" />
                  </div>

                  {/* Version Header Card */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#fce7f3] tracking-tight">
                        {v.name || `Super Bone Meal v${v.version_number}`}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#261220] text-[#f9a8d4] border border-[#4d1f3b] uppercase">
                        <Tag className="w-2.5 h-2.5" />
                        {v.version_number}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        v.version_type === 'release'
                          ? 'bg-[#1e1019] text-[#f472b6] border border-[#521e3c]'
                          : 'bg-[#291e12] text-amber-400 border border-[#543b1a]'
                      }`}>
                        {v.version_type}
                      </span>
                    </div>

                    {/* Metadata: Date, Loaders, Game Versions */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#a88a96] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span>Published: {dateFormatted}</span>
                      </div>
                      
                      {v.loaders && v.loaders.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[#6e4b5d]">Loaders:</span>
                          {v.loaders.map(loader => (
                            <span key={loader} className="px-1.5 py-0.5 bg-[#170c14] border border-[#2d1525] rounded text-[10px] text-[#fce7f3] capitalize">
                              {loader}
                            </span>
                          ))}
                        </div>
                      )}

                      {v.game_versions && v.game_versions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[#6e4b5d]">Minecraft:</span>
                          <span className="px-1.5 py-0.5 bg-[#170c14] border border-[#2d1525] rounded text-[10px] text-[#f9a8d4]">
                            {v.game_versions.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Changelog or Description Box */}
                    {v.changelog && (
                      <div className="p-4 bg-[#120a10] border border-[#261521] rounded-lg hover:border-[#421d33] transition-all duration-300">
                        <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#a88a96] mb-2 font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#f472b6]" />
                          Release Notes & Changelog
                        </h4>
                        <div className="text-xs text-[#c4adb7] font-mono whitespace-pre-line leading-relaxed">
                          {v.changelog}
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    {v.files && v.files.length > 0 && (
                      <div className="pt-1">
                        <a
                          href={v.files[0].url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#24111d] hover:bg-[#36172a] text-[#fce7f3] border border-[#521f3d] rounded-md text-xs font-mono transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#f472b6]" />
                          Download {v.files[0].filename} ({(v.files[0].size / 1024).toFixed(1)} KB)
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </UpdatedFrame>
            );
          })
        ) : (
          /* Render Cached/Fallback Structure while loading or if offline */
          fallbackVersions.map((v, index) => (
            <UpdatedFrame key={v.version} id={`ver_fallback_${v.tag}`} isUpdated={index === 0}>
              <div className="relative mb-12 last:mb-0">
                {/* Dot Indicator */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#0e080b] border-2 border-[#f472b6] shadow-sm shadow-pink-950/40 z-10">
                  <GitCommit className="w-3.5 h-3.5 text-[#f472b6]" />
                </div>

                {/* Version Header Card */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#fce7f3] tracking-tight">
                      {v.version}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#261220] text-[#f9a8d4] border border-[#4d1f3b] uppercase">
                      <Tag className="w-2.5 h-2.5" />
                      {v.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e1019] text-[#f472b6] border border-[#521e3c] uppercase">
                      {v.status}
                    </span>
                  </div>

                  {/* Date & Tags */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#a88a96] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                      <span>Released: {v.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#6e4b5d]">Loaders:</span>
                      {v.loaders.map(loader => (
                        <span key={loader} className="px-1.5 py-0.5 bg-[#170c14] border border-[#2d1525] rounded text-[10px] text-[#fce7f3]">
                          {loader}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#6e4b5d]">MC:</span>
                      <span className="px-1.5 py-0.5 bg-[#170c14] border border-[#2d1525] rounded text-[10px] text-[#f9a8d4]">
                        {v.gameVersions.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Highlights List */}
                  <div className="grid gap-4 mt-4">
                    {v.highlights.map((h, hIndex) => (
                      <div 
                        key={hIndex} 
                        className="p-4 bg-[#120a10] border border-[#261521] rounded-lg hover:border-[#421d33] transition-all duration-300"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-1.5 rounded bg-[#1e0f19] border border-[#3b1c2e] shrink-0 h-fit">
                            {h.icon}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-serif text-sm font-bold text-[#fce7f3]">
                              {h.title}
                            </h4>
                            <p className="text-xs text-[#c4adb7] leading-relaxed">
                              {h.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </UpdatedFrame>
          ))
        )}
      </div>
    </div>
  );
}
