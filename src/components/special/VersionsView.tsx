import React, { useState, useEffect } from 'react';
import { UpdatedFrame } from '../UpdatedFrame';
import { STATIC_FALLBACK_VERSIONS } from '../../data/wikiData';
import { RefreshCw, Download, Tag, Calendar, ExternalLink, AlertCircle } from 'lucide-react';

interface ModVersion {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  version_type: string;
  date_published: string;
  changelog: string;
  downloads: number;
  fileUrl?: string;
  filename?: string;
}

export const VersionsView: React.FC = () => {
  const [versions, setVersions] = useState<ModVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'modrinth' | 'cfwidget' | 'fallback'>('modrinth');

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Primary: Modrinth Open REST API
      const response = await fetch('https://api.modrinth.com/v2/project/super-bone-meal/version');
      if (!response.ok) {
        throw new Error(`Modrinth API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const parsedVersions: ModVersion[] = data.map((v: any) => ({
        id: v.id,
        name: v.name || `Version ${v.version_number}`,
        version_number: v.version_number,
        game_versions: v.game_versions || [],
        loaders: v.loaders || [],
        version_type: v.version_type || 'release',
        date_published: v.date_published,
        changelog: v.changelog || 'No detailed changelog provided.',
        downloads: v.downloads || 0,
        fileUrl: v.files?.[0]?.url,
        filename: v.files?.[0]?.filename,
      }));

      setVersions(parsedVersions);
      setSource('modrinth');
    } catch (err: any) {
      console.warn('Modrinth API unavailable, attempting CurseForge widget fallback...', err);

      // 2. Secondary Fallback: CFWidget Proxy API
      try {
        const cfResponse = await fetch('https://api.cfwidget.com/minecraft/mc-mods/super-bone-meal');
        if (!cfResponse.ok) throw new Error('CFWidget API unavailable');

        const cfData = await cfResponse.json();
        if (cfData.files && cfData.files.length > 0) {
          const parsedCf: ModVersion[] = cfData.files.map((f: any) => ({
            id: String(f.id),
            name: f.name || f.display,
            version_number: f.version || f.display,
            game_versions: f.versions || ['1.21.1'],
            loaders: ['neoforge'],
            version_type: f.type || 'release',
            date_published: f.created_at || new Date().toISOString(),
            changelog: 'Synchronized via CurseForge release channel.',
            downloads: f.downloads || 0,
            fileUrl: f.url,
            filename: f.name,
          }));

          setVersions(parsedCf);
          setSource('cfwidget');
        } else {
          throw new Error('No files returned from CurseForge widget');
        }
      } catch (cfErr: any) {
        console.warn('Remote APIs offline, loading embedded offline release cache...', cfErr);
        // 3. Safety Net: Embedded Static Cache (Guarantees zero downtime)
        setVersions(STATIC_FALLBACK_VERSIONS);
        setSource('fallback');
        setError('Remote release APIs currently unreachable. Displaying cached release history.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const getSourceLabel = () => {
    switch (source) {
      case 'modrinth':
        return 'Modrinth API (Live)';
      case 'cfwidget':
        return 'CurseForge API (Live)';
      case 'fallback':
        return 'Offline Release Cache';
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Breadcrumb Header */}
      <div className="text-[10px] font-mono tracking-widest text-[#8c607a] uppercase flex items-center gap-2">
        <span>WIKI</span>
        <span>/</span>
        <span>CORE GUIDE</span>
        <span>/</span>
        <span className="text-[#f472b6] font-semibold">VERSION HISTORY</span>
      </div>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#fce7f3] tracking-tight">
            Version History
          </h1>
          <p className="text-xs font-mono text-[#a88098] mt-1">
            Official mod release logs and downloads
          </p>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={fetchVersions}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg bg-[#180d14] border border-[#2e1726] hover:border-[#f472b6]/50 text-xs font-mono text-[#fce7f3] flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#f472b6] ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing...' : 'Refresh Releases'}</span>
        </button>
      </div>

      {/* Version Logs Container */}
      <UpdatedFrame id="versions_frame">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[#2e1726]">
            <span className="text-[#8c607a]">
              Source:{' '}
              <strong className="text-[#f472b6] uppercase">
                {getSourceLabel()}
              </strong>
            </span>
            <span className="text-[#a88098]">
              Total Published: {versions.length} Builds
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center text-xs font-mono text-[#8c607a] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#f472b6] mx-auto" />
              <p>Fetching latest release builds...</p>
            </div>
          )}

          {/* Soft Offline Banner */}
          {error && !loading && (
            <div className="p-3 rounded-lg bg-[#1a0e14] border border-[#3b1c2b] text-xs font-mono text-[#e8b6d3] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#f472b6] shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Version Items List */}
          {!loading && versions.length > 0 && (
            <div className="space-y-4">
              {versions.map(ver => (
                <div
                  key={ver.id}
                  className="p-6 sm:p-8 rounded-xl bg-[#140b11] border border-[#2e1726] space-y-3 font-mono"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#261420]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6]">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-base text-[#fce7f3] flex items-center gap-2">
                          <span>{ver.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                            ver.version_type === 'release'
                              ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                              : 'bg-amber-950/60 border border-amber-800/60 text-amber-300'
                          }`}>
                            {ver.version_type}
                          </span>
                        </h3>
                        <p className="text-[10px] text-[#8c607a]">
                          Version {ver.version_number}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#a88098]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#f472b6]" />
                        {new Date(ver.date_published).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-[#f472b6]" />
                        {ver.downloads}
                      </span>
                    </div>
                  </div>

                  {/* Badges for Loaders and Game Versions */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="text-[#8c607a] uppercase">Loaders:</span>
                    {ver.loaders.map(ldr => (
                      <span key={ldr} className="px-2 py-0.5 rounded bg-[#21111c] border border-[#4a1f39] text-[#f472b6] capitalize">
                        {ldr}
                      </span>
                    ))}

                    <span className="text-[#8c607a] uppercase ml-2">Minecraft:</span>
                    {ver.game_versions.map(gv => (
                      <span key={gv} className="px-2 py-0.5 rounded bg-[#180e15] border border-[#2e1726] text-[#fce7f3]">
                        MC {gv}
                      </span>
                    ))}
                  </div>

                  {/* Changelog Content */}
                  <div className="pt-2">
                    <span className="text-[10px] text-[#8c607a] uppercase block mb-1">Changelog:</span>
                    <div className="p-3 rounded-lg bg-[#0d070b] border border-[#210f1b] text-xs text-[#c29eb5] whitespace-pre-line leading-relaxed">
                      {ver.changelog}
                    </div>
                  </div>

                  {/* File Download Action */}
                  {ver.fileUrl && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#8c607a] truncate max-w-[200px] sm:max-w-xs">
                        {ver.filename}
                      </span>
                      <a
                        href={ver.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-md bg-[#24111d] border border-[#52213f] hover:border-[#f472b6] text-xs text-[#fce7f3] hover:text-[#f472b6] flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#f472b6]" />
                        <span>Download Build</span>
                        <ExternalLink className="w-3 h-3 text-[#8c607a]" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </UpdatedFrame>
    </div>
  );
};
