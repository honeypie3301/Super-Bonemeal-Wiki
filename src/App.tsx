import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatsModal } from './components/StatsModal';
import { HomeView } from './components/special/HomeView';
import { ItemsView } from './components/special/ItemsView';
import { MechanicsView } from './components/special/MechanicsView';
import { TradesView } from './components/special/TradesView';
import { VersionsView } from './components/special/VersionsView';
import { WIKI_ARTICLES } from './data/wikiData';
import { Menu, Sparkles } from 'lucide-react';

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Parse URL hash for SPA hash routing (e.g., #/wiki/items)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/wiki/')) {
        const slug = hash.replace('#/wiki/', '');
        if (WIKI_ARTICLES.some(a => a.slug === slug)) {
          setCurrentSlug(slug);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (slug: string) => {
    window.location.hash = `#/wiki/${slug}`;
    setCurrentSlug(slug);
    setIsSidebarOpen(false);
  };

  const renderActiveView = () => {
    switch (currentSlug) {
      case 'home':
        return <HomeView onNavigate={navigateTo} />;
      case 'versions':
        return <VersionsView />;
      case 'items':
      case 'item_super_bonemeal':
        return <ItemsView />;
      case 'mechanics_aoe':
        return <MechanicsView />;
      case 'villager_trades':
        return <TradesView />;
      default:
        return <HomeView onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060806] text-[#c9d1c9] flex flex-col font-sans selection:bg-[#2d4a34] selection:text-[#e0e7e0]">
      {/* Main 2-column flex body wrapper */}
      <div className="flex flex-1 w-full relative">
        {/* Sidebar Navigation */}
        <Sidebar
          articles={WIKI_ARTICLES}
          currentSlug={currentSlug}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onStatsClick={() => setIsStatsOpen(true)}
        />

        {/* Main Content Viewport Wrapper */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#060806] overflow-x-hidden">
          {/* Top Header Bar for Mobile / Tablet */}
          <header className="md:hidden sticky top-0 z-30 bg-[#0a0d0b] border-b border-[#1a221c] p-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-[#121814] border border-[#1a221c] text-[#c9d1c9] hover:bg-[#1a221c] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f472b6]" />
              <span className="font-serif font-bold text-sm text-[#fce7f3]">Super Bone Meal</span>
            </div>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="w-8 h-8 rounded-md bg-[#1a221c] border border-[#2a382e] font-serif font-bold text-xs text-[#f472b6] flex items-center justify-center overflow-hidden relative"
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
          </header>

          {/* Inner Padded Page Container */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 w-full max-w-[1000px] mx-auto space-y-8">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Terminal Stats Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </div>
  );
}
