import React, { useState, useMemo } from 'react';
import { WikiArticle } from '../types';
import {
  BookOpen,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  Sparkles,
  Zap,
  UserCheck,
  History,
} from 'lucide-react';

interface SidebarProps {
  articles: WikiArticle[];
  currentSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onStatsClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  articles,
  currentSlug,
  isOpen,
  onClose,
  onStatsClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    return articles.filter(
      a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const categories = useMemo(() => {
    const groups: Record<string, WikiArticle[]> = {};
    filteredArticles.forEach(art => {
      const cat = art.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(art);
    });
    return groups;
  }, [filteredArticles]);

  const getArticleIcon = (slug: string) => {
    switch (slug) {
      case 'home':
        return <BookOpen className="w-4 h-4 text-[#f472b6]" />;
      case 'versions':
        return <History className="w-4 h-4 text-[#f472b6]" />;
      case 'items':
        return <Sparkles className="w-4 h-4 text-[#f472b6]" />;
      case 'mechanics_aoe':
        return <Zap className="w-4 h-4 text-[#f472b6]" />;
      case 'villager_trades':
        return <UserCheck className="w-4 h-4 text-[#f472b6]" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#8c607a]" />;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40
          w-[240px] h-screen
          bg-[#0d080b] border-r border-[#261420]
          flex flex-col
          transition-transform duration-300 ease-out shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header Branding */}
        <div className="p-4 border-b border-[#261420] flex items-center justify-between bg-[#130b10]">
          <div className="flex items-center gap-3">
            <button
              onClick={onStatsClick}
              className="w-10 h-10 rounded-md bg-[#24111d] border border-[#52213f] flex items-center justify-center text-[#f472b6] font-serif font-bold text-lg hover:bg-[#321729] transition-colors cursor-pointer overflow-hidden relative"
              title="View Mod Specifications"
            >
              <img
                src="./logo.png"
                alt="Logo"
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center">S</span>
            </button>
            <a href="#/wiki/home" className="flex flex-col text-left" onClick={onClose}>
              <h1 className="font-serif font-bold text-[#fce7f3] tracking-wider text-sm hover:text-[#f472b6] transition-colors uppercase">
                SUPER BONE MEAL
              </h1>
              <p className="text-[10px] font-mono text-[#8c607a] uppercase tracking-widest">
                SURVIVAL INDEX
              </p>
            </a>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded text-[#8c607a] hover:text-[#fce7f3] hover:bg-[#210f1a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#261420] bg-[#0d080b]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8c607a]" />
            <input
              type="text"
              placeholder="Search guide..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#140a10] border border-[#2a1421] rounded-md py-1.5 pl-9 pr-8 text-xs text-[#fbcfe8] placeholder-[#8c607a] focus:outline-none focus:border-[#f472b6] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#8c607a] hover:text-[#fce7f3]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {(Object.entries(categories) as [string, WikiArticle[]][]).map(([catName, catArticles]) => {
            const isCollapsed = collapsedCategories[catName];
            return (
              <div key={catName} className="space-y-1">
                <button
                  onClick={() => toggleCategory(catName)}
                  className="w-full flex items-center justify-between text-left py-1 text-[11px] font-mono font-semibold tracking-widest text-[#8c607a] hover:text-[#f472b6] uppercase transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-[#543048]" />
                    {catName}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="pl-1.5 space-y-0.5 border-l border-[#261420] ml-1.5 mt-1">
                    {catArticles.map(art => {
                      const isActive = currentSlug === art.slug;
                      return (
                        <a
                          key={art.slug}
                          href={`#/wiki/${art.slug}`}
                          onClick={onClose}
                          className={`
                            group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors duration-150
                            ${
                              isActive
                                ? 'bg-[#24111d] text-[#f472b6] font-medium border-l-2 border-[#f472b6]'
                                : 'text-[#c29eb5] hover:text-[#fce7f3] hover:bg-[#180d14]'
                            }
                          `}
                        >
                          <span className="shrink-0">
                            {getArticleIcon(art.slug)}
                          </span>
                          <span className="truncate">{art.title}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Mod Footer Links (No Discord link per request) */}
        <div className="p-3 border-t border-[#261420] bg-[#090507] text-[10px] font-mono flex flex-col gap-2">
          <div className="flex flex-col gap-1 border-b border-[#1e0f1a] pb-2">
            <a
              href="https://modrinth.com/mod/super-bone-meal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a88098] hover:text-[#f472b6] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6] shrink-0" />
              Modrinth Page
            </a>
            <a
              href="https://www.curseforge.com/minecraft/mc-mods/super-bone-meal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a88098] hover:text-[#f472b6] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              CurseForge Page
            </a>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-[#5c3c4f] pt-0.5">
            ESTABLISHED FOR ESTEEMED SURVIVORS
          </div>
        </div>
      </aside>
    </>
  );
};
