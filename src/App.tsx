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
    <div className="min-h-screen w-full bg-[#0a0608] text-[#fce7f3] flex flex-col font-sans selection:bg-pink-900 selection:text-pink-100">
      {/* Main Layout Container (Fluid Screen Width) */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          articles={WIKI_ARTICLES}
          currentSlug={currentSlug}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onStatsClick={() => setIsStatsOpen(true)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Top Header Bar for Mobile / Tablet */}
          <header className="md:hidden sticky top-0 z-30 bg-[#130b10] border-b border-[#261420] p-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-[#180d14] border border-[#2e1726] text-[#fce7f3] hover:bg-[#210f1a] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f472b6]" />
              <span className="font-serif font-bold text-sm text-[#fce7f3]">Super Bone Meal</span>
            </div>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="w-8 h-8 rounded-md bg-[#24111d] border border-[#52213f] font-serif font-bold text-xs text-[#f472b6] flex items-center justify-center"
            >
              S
            </button>
          </header>

          {/* Article Render Stage */}
          <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto w-full">
            <div className="w-full max-w-6xl mx-auto">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>

      {/* Terminal Stats Modal */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </div>
  );
}
