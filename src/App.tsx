import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, Search, X, BookOpen, AlertCircle, HelpCircle, FileText, FileSearch } from 'lucide-react';
import { doc, getDoc, setDoc, addDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb, hasConfig } from './lib/firebase';
import { WikiArticle } from './types';
import { WIKI_ARTICLES } from './data/wikiArticles';
import Sidebar from './components/Sidebar';
import ArticleView from './components/ArticleView';
import StatsModal from './components/StatsModal';

function WikiContainer() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [articles] = useState<WikiArticle[]>(WIKI_ARTICLES);
  const [articlesContent] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    WIKI_ARTICLES.forEach(a => {
      map[a.slug] = a.content;
    });
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Sync hash section parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      // Delay slightly to allow rendering
      const timer = setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [slug, searchParams]);

  // Determine active article
  const activeSlug = slug || 'home';
  const activeArticle = articles.find(a => a.slug === activeSlug) || articles[0];
  const activeContent = articlesContent[activeSlug] || (activeArticle ? articlesContent[activeArticle.slug] : '') || '';

  // Track page visits
  useEffect(() => {
    const recordLocalVisit = (slug: string, visitorId: string) => {
      const localStatsStr = localStorage.getItem('bonemeal_wiki_stats');
      let stats = {
        uniqueCount: 1,
        repeatCount: 0,
        totalCount: 1,
        pageViews: { [slug]: 1 } as Record<string, number>,
        logs: [
          {
            timestamp: new Date().toISOString(),
            type: 'unique' as 'unique' | 'repeat',
            slug: slug,
            visitorId: visitorId.substring(0, 12)
          }
        ]
      };

      if (localStatsStr) {
        try {
          stats = JSON.parse(localStatsStr);
          // Check if this visitor ID has logged a unique connection before in logs
          const hasVisited = stats.logs?.some((l: any) => l.visitorId === visitorId.substring(0, 12));
          const isUnique = !hasVisited;

          stats.totalCount = (stats.totalCount || 0) + 1;
          if (isUnique) {
            stats.uniqueCount = (stats.uniqueCount || 0) + 1;
          } else {
            stats.repeatCount = (stats.repeatCount || 0) + 1;
          }
          
          if (!stats.pageViews) stats.pageViews = {};
          stats.pageViews[slug] = (stats.pageViews[slug] || 0) + 1;

          if (!stats.logs) stats.logs = [];
          stats.logs.unshift({
            timestamp: new Date().toISOString(),
            type: (isUnique ? 'unique' : 'repeat') as 'unique' | 'repeat',
            slug: slug,
            visitorId: visitorId.substring(0, 12)
          });

          if (stats.logs.length > 50) {
            stats.logs = stats.logs.slice(0, 50);
          }
        } catch (e) {
          console.error("Failed to update local sandbox stats", e);
        }
      }

      localStorage.setItem('bonemeal_wiki_stats', JSON.stringify(stats));
    };

    const recordVisitFirebase = async (slug: string, visitorId: string): Promise<boolean> => {
      if (!hasConfig) {
        return false;
      }
      try {
        const visitorDocRef = doc(firestoreDb, 'bonemeal_visitors', visitorId);
        const visitorSnapshot = await getDoc(visitorDocRef);
        const isUnique = !visitorSnapshot.exists();

        if (isUnique) {
          await setDoc(visitorDocRef, {
            firstVisit: serverTimestamp(),
            lastVisit: serverTimestamp()
          });
        } else {
          await setDoc(visitorDocRef, {
            lastVisit: serverTimestamp()
          }, { merge: true });
        }

        const statsDocRef = doc(firestoreDb, 'bonemeal_stats', 'global');
        await setDoc(statsDocRef, {
          totalCount: increment(1),
          uniqueCount: isUnique ? increment(1) : increment(0),
          repeatCount: !isUnique ? increment(1) : increment(0),
          [`pageViews.${slug}`]: increment(1)
        }, { merge: true });

        await addDoc(collection(firestoreDb, 'bonemeal_telemetry_logs'), {
          timestamp: serverTimestamp(),
          type: isUnique ? 'unique' : 'repeat',
          slug,
          visitorId: visitorId.substring(0, 12)
        });

        return true;
      } catch (err) {
        console.warn('Firebase registration failed, falling back to local simulation.', err);
        return false;
      }
    };

    const recordVisit = async () => {
      try {
        let visitorId = localStorage.getItem('bonemeal_visitor_id');
        if (!visitorId) {
          visitorId = 'surv_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('bonemeal_visitor_id', visitorId);
        }

        // Try Firebase first for real-time global telemetry
        const firebaseSuccess = await recordVisitFirebase(activeSlug, visitorId);
        if (firebaseSuccess) {
          return;
        }

        // Fallback: update local sandbox so the UI still displays simulated data gracefully
        recordLocalVisit(activeSlug, visitorId);
      } catch (err) {
        console.error('Failed to record page visit:', err);
      }
    };

    if (!loading && !error) {
      recordVisit();
    }
  }, [activeSlug, loading, error]);

  // 2. Perform deep-content relevance search
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: Array<{
      article: WikiArticle;
      score: number;
      snippet: string;
    }> = [];

    articles.forEach(article => {
      const content = articlesContent[article.slug] || '';
      const lowerContent = content.toLowerCase();
      const lowerTitle = article.title.toLowerCase();

      let score = 0;
      let snippet = '';

      // Title exact or fuzzy match
      if (lowerTitle === query) {
        score += 500;
      } else if (lowerTitle.includes(query)) {
        score += 200;
      }

      // Slug exact match
      if (article.slug === query) {
        score += 300;
      }

      // Count occurrences in body content
      const words = lowerContent.split(query);
      const occurrences = words.length - 1;
      if (occurrences > 0) {
        score += occurrences * 15;

        // Extract a snippet containing the keyword
        const index = lowerContent.indexOf(query);
        const start = Math.max(0, index - 60);
        const end = Math.min(content.length, index + query.length + 80);
        
        let contextSnippet = content.substring(start, end).trim();
        if (start > 0) contextSnippet = '...' + contextSnippet;
        if (end < content.length) contextSnippet = contextSnippet + '...';

        // Strip HTML/wiki tags from snippet for clean preview
        snippet = contextSnippet
          .replace(/<[^>]*>/g, '')
          .replace(/\[\[([^|\]\n]+)\|([^\]\n]+)\]\]/g, '$2')
          .replace(/\[\[([^|\]\n]+)\]\]/g, '$1')
          .replace(/[''{}]/g, '');
      }

      if (score > 0) {
        results.push({
          article,
          score,
          snippet: snippet || (content.length > 120 ? content.substring(0, 120) + '...' : content)
        });
      }
    });

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, articles, articlesContent]);

  // Filter sidebar articles based on search query
  const filteredArticles = React.useMemo(() => {
    if (!searchQuery.trim()) return articles;
    return searchResults.map(r => r.article);
  }, [searchQuery, articles, searchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c070a] flex flex-col items-center justify-center font-sans select-none">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1f1019] border-2 border-[#521f3d] flex items-center justify-center shadow-[0_0_24px_rgba(244,114,182,0.25)] relative overflow-hidden">
            <img 
              src="./logo.png" 
              alt="Super Bone Meal Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]"
              onError={(e) => {
                // Fallback to text emblem if image is loading
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-serif font-extrabold text-xl text-[#fce7f3] absolute">
              S
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono text-[#f472b6] uppercase tracking-[0.25em] font-semibold">
              Super Bone Meal Field Guide
            </span>
            <span className="text-[10px] font-mono text-[#8f6d7d] uppercase tracking-widest">
              Accessing Agrarian Index...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0c070a] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md p-6 bg-[#140c12] border border-[#3b1c2e] rounded-xl shadow-2xl">
          <AlertCircle className="w-10 h-10 text-[#f472b6] mx-auto mb-4" />
          <h2 className="font-serif text-lg text-[#fce7f3] font-semibold mb-2">Failed to Load Wiki Data</h2>
          <p className="text-xs text-[#c4adb7] leading-relaxed mb-6 font-mono">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#261220] hover:bg-[#381a2e] text-[#f9a8d4] border border-[#4d1f3b] text-xs font-mono rounded-md transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0609] text-[#e8d0da] font-sans flex">
      
      {/* Sidebar - fully dynamic and searchable */}
      <Sidebar
        articles={filteredArticles}
        currentSlug={activeSlug}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onBIconClick={() => setStatsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Mobile Header Navbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#120a10]/95 backdrop-blur border-b border-[#261521]">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded text-[#a88a96] hover:text-[#fce7f3] hover:bg-[#20101b] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif font-bold text-sm text-[#fce7f3] tracking-wide uppercase">
            {activeArticle ? activeArticle.title : 'Agrarian Index'}
          </span>
          <button 
            onClick={() => setStatsOpen(true)}
            className="w-8 h-8 rounded-lg bg-[#24111d] border border-[#4d1f3b] flex items-center justify-center p-1 hover:bg-[#36172a] transition-colors cursor-pointer overflow-hidden"
            title="View Terminal Stats"
            id="header-b-icon"
          >
            <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
          </button>
        </header>

        {/* Dynamic Article Page or Global Deep-Search Results View */}
        <main className="flex-1">
          {searchQuery.trim() ? (
            /* Show comprehensive search catalog results screen */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
              <div className="border-b border-[#281320] pb-6 mb-8 select-none">
                <div className="flex items-center gap-2 text-xs font-mono text-[#f472b6] uppercase tracking-wider mb-2">
                  <FileSearch className="w-4 h-4" />
                  <span>Interactive Catalog Search</span>
                </div>
                <h1 className="font-serif text-3xl font-bold text-[#fce7f3]">
                  Search results for "{searchQuery}"
                </h1>
                <p className="text-xs text-[#a88a96] mt-1">
                  Found {searchResults.length} relevant entries in deep page contents.
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-6">
                  {searchResults.map(({ article, score, snippet }) => (
                    <div 
                      key={article.slug}
                      onClick={() => {
                        setSearchQuery('');
                        navigate(`/wiki/${article.slug}`);
                      }}
                      className="p-5 bg-[#120a10] hover:bg-[#1c0e18] border border-[#261521] hover:border-[#4d1f3b] rounded-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="font-serif text-lg text-[#f9a8d4] group-hover:text-[#fce7f3] font-semibold transition-colors">
                          {article.title}
                        </h3>
                        <span className="text-[10px] font-mono bg-[#1c0e18] text-[#a88a96] border border-[#331828] px-2 py-0.5 rounded uppercase">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#c4adb7] font-mono leading-relaxed bg-[#0a0508] p-3 rounded border border-[#1f0e1a] select-none">
                        {snippet}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#120a10] border border-[#261521] rounded-lg select-none">
                  <HelpCircle className="w-12 h-12 text-[#4d1f3b] mx-auto mb-4" />
                  <p className="text-sm font-serif italic text-[#c4adb7]">No documentation matches your query.</p>
                  <p className="text-xs text-[#a88a96] mt-2 font-mono">Try searching for keywords like "trades", "fertilizer", "radius", or "crops".</p>
                </div>
              )}
            </div>
          ) : activeArticle ? (
            /* Show normal Article view */
            <ArticleView
              article={activeArticle}
              rawContent={activeContent}
              articles={articles}
              searchQuery={searchQuery}
            />
          ) : (
            /* Fallback to index redirects */
            <div className="flex flex-col items-center justify-center h-[60vh] select-none">
              <AlertCircle className="w-8 h-8 text-[#a88a96] mb-3" />
              <p className="text-sm font-serif italic text-[#c4adb7]">Article not found.</p>
              <a href="#/wiki/home" className="text-xs text-[#f472b6] hover:underline mt-2 font-mono">Return Home</a>
            </div>
          )}
        </main>
      </div>

      {/* Stats overlay terminal */}
      <StatsModal 
        isOpen={statsOpen} 
        onClose={() => setStatsOpen(false)} 
        articles={articles}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/wiki/:slug" element={<WikiContainer />} />
        <Route path="*" element={<Navigate to="/wiki/home" replace />} />
      </Routes>
    </HashRouter>
  );
}
