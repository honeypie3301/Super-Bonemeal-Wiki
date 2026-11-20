import React, { useState } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Sprout,
  Coins,
  Cpu,
  Clock,
  Folder,
  FileText
} from 'lucide-react';
import { WikiArticle } from '../types';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  articles: WikiArticle[];
  currentSlug: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onBIconClick?: () => void;
  pageOccupancy?: Record<string, number>;
}

const Sidebar = React.memo(function Sidebar({
  articles,
  currentSlug,
  searchQuery,
  setSearchQuery,
  isOpen,
  onClose,
  onBIconClick,
  pageOccupancy
}: SidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const categories = React.useMemo(() => {
    const groups: Record<string, WikiArticle[]> = {};
    articles.forEach(article => {
      const cat = article.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(article);
    });
    return groups;
  }, [articles]);

  const getArticleIcon = (slug: string, isActive: boolean) => {
    const tone = isActive ? 'text-accent-text' : 'text-ink-subtle group-hover:text-ink';
    switch (slug) {
      case 'home':
        return <BookOpen className={`w-4 h-4 ${tone}`} />;
      case 'mechanics':
        return <Sprout className={`w-4 h-4 ${tone}`} />;
      case 'versions':
        return <Clock className={`w-4 h-4 ${tone}`} />;
      case 'items':
        return <Sparkles className={`w-4 h-4 ${isActive ? 'text-accent-text' : 'text-accent/80'}`} />;
      case 'acquisition':
        return <Coins className={`w-4 h-4 ${tone}`} />;
      case 'technical':
        return <Cpu className={`w-4 h-4 ${tone}`} />;
      default:
        return <FileText className={`w-4 h-4 ${tone}`} />;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40
          w-[280px] h-screen
          bg-surface border-r border-line
          flex flex-col transition-colors duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header Branding */}
        <div className="px-4 py-3.5 border-b border-line flex items-center justify-between gap-2 bg-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBIconClick?.();
              }}
              className="w-8 h-8 rounded-lg bg-surface-alt border border-line flex items-center justify-center text-accent-text font-display font-bold text-base hover:border-accent/60 hover:bg-accent-soft cursor-pointer transition-colors shrink-0"
              title="View Terminal Stats"
              aria-label="View Terminal Stats"
              id="sidebar-b-icon"
            >
              S
            </button>
            <a href="#/wiki/home" className="flex flex-col text-left min-w-0" onClick={onClose}>
              <h1 className="font-display font-bold text-ink tracking-tight text-sm hover:text-accent-text transition-colors truncate">
                Super Bonemeal
              </h1>
              <p className="text-[10px] font-mono text-ink-subtle uppercase tracking-wider truncate">
                Mod Field Guide
              </p>
            </a>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Close navigation sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-line-soft bg-surface">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-alt border border-line rounded-lg py-1.5 pl-8.5 pr-8 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors p-0.5 rounded flex items-center justify-center cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation / Article List */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {(Object.entries(categories) as [string, WikiArticle[]][]).map(([categoryName, catArticles]) => {
            const isCollapsed = collapsedCategories[categoryName];
            return (
              <div key={categoryName} className="space-y-1">
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full flex items-center justify-between text-left px-1.5 py-1 text-[11px] font-mono font-semibold tracking-wider text-ink-subtle hover:text-ink uppercase transition-colors cursor-pointer"
                  aria-expanded={!isCollapsed}
                  aria-label={`Toggle ${categoryName} category`}
                >
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3 h-3 text-ink-subtle" />
                    {categoryName}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-1 mt-1">
                    {catArticles.map(article => {
                      const isActive = currentSlug === article.slug;
                      const peerCount = pageOccupancy?.[article.slug] || 0;
                      return (
                        <a
                          key={article.slug}
                          href={`#/wiki/${article.slug}`}
                          onClick={onClose}
                          className={`
                            group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 border
                            ${isActive
                              ? 'bg-accent-soft text-accent-text font-semibold border-accent-border'
                              : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-alt'
                            }
                          `}
                        >
                          <span className="shrink-0">
                            {getArticleIcon(article.slug, isActive)}
                          </span>
                          <span className="truncate">{article.title}</span>
                          {peerCount > 0 && (
                            <span
                              className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-good-soft border border-good-border text-[10px] font-mono text-good-text tabular-nums shrink-0"
                              title={`${peerCount} active cursor${peerCount === 1 ? '' : 's'} on /${article.slug}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-good-text animate-pulse" />
                              {peerCount}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {articles.length === 0 && (
            <div className="text-center py-8 text-ink-subtle text-xs font-display italic">
              No results match search
            </div>
          )}
        </nav>

        {/* Footer info - Mod Links */}
        <div className="p-4 border-t border-line bg-surface-alt/50 text-[11px] font-mono flex flex-col gap-2">
          <div className="flex flex-col gap-1.5 border-b border-line-soft pb-2.5">
            <a
              href="https://modrinth.com/mod/super-bone-meal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted hover:text-accent-text hover:underline underline-offset-4 transition-colors"
            >
              Modrinth Page
            </a>
            <a
              href="https://www.curseforge.com/minecraft/mc-mods/super-bone-meal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted hover:text-accent-text hover:underline underline-offset-4 transition-colors"
            >
              CurseForge Page
            </a>
            <a
              href="https://discord.com/invite/NtRJqPCUQA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted hover:text-accent-text hover:underline underline-offset-4 transition-colors"
            >
              Official Discord
            </a>
          </div>
          <div className="select-none text-[9px] uppercase tracking-wider text-ink-subtle">
            SUPER BONEMEAL v1.4.0 • NEOFORGE 1.21.1
          </div>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
