import React, { useEffect, useState, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  FileText, 
  ExternalLink,
  MessageSquareWarning
} from 'lucide-react';
import { WikiArticle } from '../types';
import { parseWikiSyntax, slugify } from '../utils/parser';

import VersionsView from './special/VersionsView';
import ItemsView from './special/ItemsView';
import HomeView from './special/HomeView';

interface ArticleViewProps {
  article: WikiArticle;
  rawContent: string;
  articles: WikiArticle[];
  searchQuery: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleView({
  article,
  rawContent,
  articles,
  searchQuery
}: ArticleViewProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const isSpecialPage = ['home', 'items', 'versions'].includes(article.slug);

  // Parse headers and content
  useEffect(() => {
    if (!rawContent) return;

    // Check if interactive page or home/versions page - if so, hide "On This Page" entirely to maximize view width
    if (isSpecialPage) {
      setHeadings([]);
    } else {
      // Extract headings for TOC (only on standard document pages)
      const foundHeadings: HeadingItem[] = [];
      const lines = rawContent.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Skip comment lines entirely to prevent capturing comments as headings
        if (trimmed.startsWith('<!--') || trimmed.endsWith('-->')) {
          return;
        }

        // 1. MediaWiki Headings
        // ==== h4 ====
        const h4WikiMatch = trimmed.match(/^====\s*([^=]*?)\s*====\s*$/);
        if (h4WikiMatch) {
          foundHeadings.push({
            id: slugify(h4WikiMatch[1]),
            text: h4WikiMatch[1],
            level: 4
          });
          return;
        }

        // === h3 ===
        const h3WikiMatch = trimmed.match(/^===\s*([^=]*?)\s*===\s*$/);
        if (h3WikiMatch) {
          foundHeadings.push({
            id: slugify(h3WikiMatch[1]),
            text: h3WikiMatch[1],
            level: 3
          });
          return;
        }

        // == h2 ==
        const h2WikiMatch = trimmed.match(/^==\s*([^=]*?)\s*==\s*$/);
        if (h2WikiMatch) {
          foundHeadings.push({
            id: slugify(h2WikiMatch[1]),
            text: h2WikiMatch[1],
            level: 2
          });
          return;
        }

        // 2. HTML Headings, e.g. <h2 style="...">Heading Text</h2>
        const htmlMatch = trimmed.match(/<(h2|h3|h4)(?:\s+[^>]*?)?>(.*?)<\/\1>/i);
        if (htmlMatch) {
          const tag = htmlMatch[1].toLowerCase();
          const rawText = htmlMatch[2];
          const text = rawText.replace(/<[^>]*>/g, '').trim();
          const level = parseInt(tag[1], 10);
          foundHeadings.push({
            id: slugify(text),
            text: text,
            level: level
          });
        }
      });
      setHeadings(foundHeadings);
    }

    // Parse the wiki syntax to HTML
    let parsed = parseWikiSyntax(rawContent);

    // If there's a search query, highlight it inside text (outside of html tags)
    if (searchQuery && searchQuery.trim().length > 1) {
      const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      try {
        const queryRegex = new RegExp(`(?<!<[^>]*)\\b(${escapedQuery})\\b`, 'gi');
        parsed = parsed.replace(queryRegex, match => `<mark class="bg-pink-950/80 text-pink-200 px-0.5 rounded border border-pink-800/40">${match}</mark>`);
      } catch (e) {
        // Fallback if lookbehind is not supported or regex fails
      }
    }

    setHtmlContent(parsed);
  }, [rawContent, searchQuery, isSpecialPage]);

  // Find next and previous articles in sorted manifest
  const { prevArticle, nextArticle } = React.useMemo(() => {
    const currentIndex = articles.findIndex(a => a.slug === article.slug);
    return {
      prevArticle: currentIndex > 0 ? articles[currentIndex - 1] : null,
      nextArticle: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null
    };
  }, [article, articles]);

  // Track scroll for active heading, reading progress, and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // 1. Scroll-to-top button visibility
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // 2. Reading progress calculation
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }

      // 3. Highlight current heading in TOC
      if (headings.length === 0) return;

      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
      
      let currentActiveId = '';
      const scrollPosition = window.scrollY + 120; // offset

      for (let i = headingElements.length - 1; i >= 0; i--) {
        if (headingElements[i].offsetTop <= scrollPosition) {
          currentActiveId = headingElements[i].id;
          break;
        }
      }

      if (!currentActiveId && headingElements.length > 0) {
        currentActiveId = headingElements[0].id;
      }
      
      setActiveHeadingId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount/load
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const handleScrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    // Dispatch custom event for special views to sync selection
    window.dispatchEvent(new CustomEvent('wiki-scroll-to-heading', { detail: { id } }));
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row gap-8 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-8">
      
      {/* Reading Progress Bar (top of the page) */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-pink-950/20 z-50 pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-[#f472b6] transition-all duration-75"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#a88a96] uppercase tracking-wider mb-6 select-none">
          <a href="#/wiki/home" className="hover:text-[#f9a8d4] transition-colors">WIKI</a>
          <span>/</span>
          <span className="text-[#c4adb7]">{article.category}</span>
          <span>/</span>
          <span className="text-[#f472b6]">{article.title}</span>
        </div>

        {/* Title Block */}
        <div className="border-b border-[#2b1725] pb-6 mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#fce7f3] tracking-tight leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Article Body */}
        <article className="min-h-[400px]">
          {isSpecialPage ? (
            article.slug === 'home' ? (
              <HomeView />
            ) : article.slug === 'versions' ? (
              <VersionsView />
            ) : article.slug === 'items' ? (
              <ItemsView />
            ) : null
          ) : (
            /* HTML Rendered view */
            <div 
              ref={containerRef}
              className="wiki-html-content text-sm sm:text-base leading-relaxed text-[#e8d0da] space-y-6 select-text"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </article>

        {/* Next/Previous Article Controls */}
        <div className="mt-12 pt-6 border-t border-[#2b1725] flex flex-col sm:flex-row gap-4 justify-between items-stretch select-none">
          {prevArticle ? (
            <a 
              href={`#/wiki/${prevArticle.slug}`}
              className="flex-1 flex items-center gap-3 p-4 bg-[#140c12] hover:bg-[#1f111b] border border-[#2b1725] hover:border-[#421d33] rounded-lg group transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#a88a96] group-hover:text-[#f9a8d4] transition-colors" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-[#a88a96] uppercase tracking-wider">Previous Page</div>
                <div className="text-xs font-serif text-[#fce7f3] font-semibold group-hover:text-[#f9a8d4] transition-colors mt-0.5">{prevArticle.title}</div>
              </div>
            </a>
          ) : (
            <div className="flex-1 opacity-0 pointer-events-none hidden sm:block" />
          )}

          {nextArticle ? (
            <a 
              href={`#/wiki/${nextArticle.slug}`}
              className="flex-1 flex items-center justify-between p-4 bg-[#140c12] hover:bg-[#1f111b] border border-[#2b1725] hover:border-[#421d33] rounded-lg group transition-all"
            >
              <div className="text-left">
                <div className="text-[10px] font-mono text-[#a88a96] uppercase tracking-wider text-right sm:text-left">Next Page</div>
                <div className="text-xs font-serif text-[#fce7f3] font-semibold group-hover:text-[#f9a8d4] transition-colors mt-0.5">{nextArticle.title}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#a88a96] group-hover:text-[#f9a8d4] transition-colors" />
            </a>
          ) : (
            <div className="flex-1 opacity-0 pointer-events-none hidden sm:block" />
          )}
        </div>
      </div>

      {/* Right Column: Table of Contents (Desktop sticky) */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-[240px] shrink-0 select-none">
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pl-4 border-l border-[#2b1725]/60 space-y-4">
            <h3 className="font-mono text-[10px] font-bold text-[#a88a96] uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5e2b46]" />
              On This Page
            </h3>
            
            <ul className="space-y-2 text-xs">
              {headings.map((h, hIdx) => {
                const isActive = activeHeadingId === h.id;
                return (
                  <li 
                    key={`${h.id}-${hIdx}`}
                    className={`
                      leading-normal transition-all duration-150
                      ${h.level === 3 ? 'pl-3' : 'pl-0'}
                    `}
                  >
                    <button
                      onClick={() => handleScrollToHeading(h.id)}
                      className={`
                        text-left hover:text-[#fce7f3] block w-full truncate cursor-pointer
                        ${isActive 
                          ? 'text-[#f9a8d4] font-medium border-l border-[#f472b6] -ml-[17px] pl-[16px]' 
                          : 'text-[#a88a96]'
                        }
                      `}
                    >
                      {h.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      )}

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={handleScrollTop}
          className="fixed bottom-6 right-6 p-2.5 bg-[#261220] hover:bg-[#381a2e] border border-[#4d1f3b] hover:border-[#6b2a4f] text-[#f9a8d4] rounded-full shadow-lg z-50 cursor-pointer transition-all hover:scale-105 duration-200"
          title="Scroll to Top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  );
}
