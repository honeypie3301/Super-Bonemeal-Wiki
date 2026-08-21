import React, { useState } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Folder,
  FileText,
  Sprout
} from 'lucide-react';
import { WikiArticle } from '../types';

interface SidebarProps {
  articles: WikiArticle[];
  currentSlug: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onBIconClick?: () => void;
}

export default function Sidebar({
  articles,
  currentSlug,
  searchQuery,
  setSearchQuery,
  isOpen,
  onClose,
  onBIconClick
}: SidebarProps) {
  // Keep track of which categories are collapsed. Default all open.
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group articles by category
  const categories = React.useMemo(() => {
    const groups: Record<string, WikiArticle[]> = {};
    articles.forEach(article => {
      const cat = article.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(article);
    });
    return groups;
  }, [articles]);

  // Get icons based on category or article title
  const getArticleIcon = (slug: string) => {
    switch (slug) {
      case 'home':
        return <BookOpen className="w-4 h-4 text-[#f472b6]" />;
      case 'items':
        return <Sprout className="w-4 h-4 text-[#f9a8d4]" />;
      case 'versions':
        return <Clock className="w-4 h-4 text-[#fb7185]" />;
      default:
        return <FileText className="w-4 h-4 text-[#a88a96]" />;
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-40
          w-[280px] h-screen
          bg-[#0f0a0d] border-r border-[#26161f]
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-[#26161f] flex items-center justify-between bg-[#140d12]">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBIconClick?.();
              }}
              className="w-8 h-8 rounded-lg bg-[#2a1622] border border-[#442337] flex items-center justify-center p-1 hover:bg-[#3d1e31] hover:border-[#632f50] cursor-pointer transition-colors shrink-0 overflow-hidden"
              title="View Terminal Stats"
              id="sidebar-b-icon"
            >
              <img src="/logo.png" alt="Super Bone Meal Logo" className="w-full h-full object-contain" />
            </button>
            <a href="#/wiki/home" className="flex flex-col text-left" onClick={onClose}>
              <h1 className="font-serif font-bold text-[#fce7f3] tracking-wide text-sm hover:text-[#f9a8d4] transition-colors">
                SUPER BONE MEAL
              </h1>
              <p className="text-[10px] font-mono text-[#a88a96] uppercase tracking-wider">
                Official Wiki
              </p>
            </a>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 rounded text-[#a88a96] hover:text-[#fce7f3] hover:bg-[#20111a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#26161f]/50 bg-[#0f0a0d]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#a88a96]" />
            <input
              type="text"
              placeholder="Search guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#170e14] border border-[#2a1722] rounded-md py-1.5 pl-9 pr-8 text-xs text-[#e8d0da] placeholder-[#a88a96] focus:outline-none focus:border-[#f472b6] focus:ring-1 focus:ring-[#f472b6] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#a88a96] hover:text-[#fce7f3] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Navigation / Article List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {(Object.entries(categories) as [string, WikiArticle[]][]).map(([categoryName, catArticles]) => {
            const isCollapsed = collapsedCategories[categoryName];
            return (
              <div key={categoryName} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full flex items-center justify-between text-left py-1 text-[11px] font-mono font-semibold tracking-wider text-[#a88a96] hover:text-[#f9a8d4] uppercase transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3 h-3 text-[#522d41]" />
                    {categoryName}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {/* Category Articles */}
                {!isCollapsed && (
                  <div className="pl-1.5 space-y-0.5 border-l border-[#26161f]/60 ml-1.5 mt-1 transition-all duration-300">
                    {catArticles.map(article => {
                      const isActive = currentSlug === article.slug;
                      return (
                        <a
                          key={article.slug}
                          href={`#/wiki/${article.slug}`}
                          onClick={onClose}
                          className={`
                            group flex items-center gap-2.5 px-3 py-1.5 rounded text-xs transition-all duration-150
                            ${isActive 
                              ? 'bg-[#25121e] text-[#f9a8d4] font-medium border-l-2 border-[#f472b6]' 
                              : 'text-[#c4adb7] hover:text-[#fce7f3] hover:bg-[#1a0e16]'
                            }
                          `}
                        >
                          <span className="shrink-0 transition-transform group-hover:scale-110 duration-200">
                            {getArticleIcon(article.slug)}
                          </span>
                          <span className="truncate">{article.title}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {articles.length === 0 && (
            <div className="text-center py-8 text-[#a88a96] text-xs font-serif italic">
              No results match search
            </div>
          )}
        </nav>

        {/* Footer info - Mod Links */}
        <div className="p-4 border-t border-[#26161f] bg-[#0c080a] text-[10px] font-mono flex flex-col gap-2">
          <div className="flex flex-col gap-1.5 border-b border-[#20121a] pb-2 mb-2">
            <a 
              href="https://modrinth.com/mod/super-bone-meal" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#f472b6] hover:text-[#f9a8d4] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              Modrinth Page
            </a>
            <a 
              href="https://www.curseforge.com/minecraft/mc-mods/super-bone-meal" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#f472b6] hover:text-[#f9a8d4] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              CurseForge Page
            </a>
          </div>
          <div className="select-none text-[9px] uppercase tracking-wider text-[#4d2d3e]">PLANT ACCELERATION & FLORA HARVEST</div>
        </div>
      </aside>
    </>
  );
}
