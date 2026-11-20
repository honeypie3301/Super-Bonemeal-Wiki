import React, { useEffect, useState, useRef, useMemo, Suspense, lazy } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  FileText, 
  ExternalLink,
  MessageSquareWarning,
  Loader2
} from 'lucide-react';
import { WikiArticle } from '../types';
import { parseWikiSyntax, slugify } from '../utils/parser';

import HomeView from './special/HomeView';
const MechanicsView = lazy(() => import('./special/MechanicsView'));
const VersionsView = lazy(() => import('./special/VersionsView'));
const ItemsView = lazy(() => import('./special/ItemsView'));
const AcquisitionView = lazy(() => import('./special/AcquisitionView'));
const TechnicalView = lazy(() => import('./special/TechnicalView'));

interface ArticleViewProps {
  article: WikiArticle;
  rawContent?: string;
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
  rawContent = '',
  articles,
  searchQuery
}: ArticleViewProps) {
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const showScrollTopRef = useRef(false);

  const isSpecialPage = ['home', 'mechanics', 'versions', 'items', 'acquisition', 'technical'].includes(article.slug);

  // Synchronously memoize headers and parsed HTML to avoid double-render passes
  const { htmlContent, headings } = useMemo(() => {
    if (!rawContent) {
      return { htmlContent: '', headings: [] as HeadingItem[] };
    }

    const foundHeadings: HeadingItem[] = [];
    if (!isSpecialPage) {
      const lines = rawContent.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<!--') || trimmed.endsWith('-->')) {
          return;
        }

        const h4WikiMatch = trimmed.match(/^====\s*([^=]*?)\s*====\s*$/);
        if (h4WikiMatch) {
          foundHeadings.push({
            id: slugify(h4WikiMatch[1]),
            text: h4WikiMatch[1],
            level: 4
          });
          return;
        }

        const h3WikiMatch = trimmed.match(/^===\s*([^=]*?)\s*===\s*$/);
        if (h3WikiMatch) {
          foundHeadings.push({
            id: slugify(h3WikiMatch[1]),
            text: h3WikiMatch[1],
            level: 3
          });
          return;
        }

        const h2WikiMatch = trimmed.match(/^==\s*([^=]*?)\s*==\s*$/);
        if (h2WikiMatch) {
          foundHeadings.push({
            id: slugify(h2WikiMatch[1]),
            text: h2WikiMatch[1],
            level: 2
          });
          return;
        }

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
    }

    let parsed = parseWikiSyntax(rawContent);

    if (searchQuery && searchQuery.trim().length > 1) {
      const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      try {
        const queryRegex = new RegExp(`(?<!<[^>]*)\\b(${escapedQuery})\\b`, 'gi');
        parsed = parsed.replace(queryRegex, match => `<mark class="bg-accent-soft text-accent-text px-0.5 rounded border border-accent-border">${match}</mark>`);
      } catch {
        // Fallback if lookbehind is not supported or regex fails
      }
    }

    return { htmlContent: parsed, headings: foundHeadings };
  }, [rawContent, searchQuery, isSpecialPage]);

  // Find next and previous articles in sorted manifest
  const { prevArticle, nextArticle } = useMemo(() => {
    const currentIndex = articles.findIndex(a => a.slug === article.slug);
    return {
      prevArticle: currentIndex > 0 ? articles[currentIndex - 1] : null,
      nextArticle: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null
    };
  }, [article, articles]);

  // Track scroll with GPU transform scaleX and edge-triggered scroll-top state
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const nextShowTop = scrollY > 400;
          if (nextShowTop !== showScrollTopRef.current) {
            showScrollTopRef.current = nextShowTop;
            setShowScrollTop(nextShowTop);
          }

          if (progressBarRef.current) {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = totalHeight > 0 ? Math.min(1, Math.max(0, scrollY / totalHeight)) : 0;
            progressBarRef.current.style.transform = `scaleX(${ratio})`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for Table of Contents heading tracking (avoids getBoundingClientRect layout thrashing)
  useEffect(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible headings
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by their vertical position in document
          const topEntry = visibleEntries.reduce((prev, curr) => 
            curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev
          );
          setActiveHeadingId(topEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: [0, 1.0]
      }
    );

    headingElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  const handleScrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    // Dispatch custom event for special views (Entities, Dimensions, Blocks) to sync selection
    window.dispatchEvent(new CustomEvent('wiki-scroll-to-heading', { detail: { id } }));
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row gap-8 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-8">

      {/* Reading Progress Bar (top of the page) */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-line-soft z-50 pointer-events-none">
        <div
          ref={progressBarRef}
          className="h-full w-full origin-left will-change-transform bg-accent transition-transform duration-75"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-subtle mb-5 select-none">
          <a href="#/wiki/home" className="hover:text-accent-text hover:underline underline-offset-4 transition-colors">Wiki</a>
          <span aria-hidden="true">/</span>
          <span className="text-ink-muted">{article.category}</span>
          <span aria-hidden="true">/</span>
          <span className="text-accent-text font-medium truncate">{article.title}</span>
        </div>

        {/* Title Block */}
        <div className="border-b border-line pb-5 mb-8">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-ink tracking-tight leading-tight [text-wrap:balance]">
            {article.title}
          </h1>
        </div>

        {/* Article Body */}
        <article className="min-h-[400px]">
          {isSpecialPage ? (
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center p-16 space-y-3 font-mono text-xs text-accent-text">
                <Loader2 className="w-6 h-6 animate-spin text-accent-text" />
                <span className="tracking-wider uppercase">Loading Archive Module...</span>
              </div>
            }>
              {article.slug === 'home' ? (
                <HomeView />
              ) : article.slug === 'mechanics' ? (
                <MechanicsView />
              ) : article.slug === 'versions' ? (
                <VersionsView />
              ) : article.slug === 'items' ? (
                <ItemsView />
              ) : article.slug === 'acquisition' ? (
                <AcquisitionView />
              ) : article.slug === 'technical' ? (
                <TechnicalView />
              ) : null}
            </Suspense>
          ) : (
            <div
              ref={containerRef}
              className="wiki-html-content text-sm sm:text-base leading-relaxed text-ink-muted space-y-6 select-text"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </article>

        {/* Next/Previous Article Controls */}
        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row gap-4 justify-between items-stretch select-none">
          {prevArticle ? (
            <a
              href={`#/wiki/${prevArticle.slug}`}
              className="flex-1 flex items-center gap-3 p-4 bg-surface hover:bg-surface-alt border border-line hover:border-accent/50 rounded-xl group transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-ink-subtle group-hover:text-accent-text transition-colors shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-[11px] font-mono text-ink-subtle">Previous Page</div>
                <div className="text-sm font-display text-ink font-semibold group-hover:text-accent-text transition-colors mt-0.5 truncate">{prevArticle.title}</div>
              </div>
            </a>
          ) : (
            <div className="flex-1 opacity-0 pointer-events-none hidden sm:block" />
          )}

          {nextArticle ? (
            <a
              href={`#/wiki/${nextArticle.slug}`}
              className="flex-1 flex items-center justify-between gap-3 p-4 bg-surface hover:bg-surface-alt border border-line hover:border-accent/50 rounded-xl group transition-colors"
            >
              <div className="text-left min-w-0">
                <div className="text-[11px] font-mono text-ink-subtle">Next Page</div>
                <div className="text-sm font-display text-ink font-semibold group-hover:text-accent-text transition-colors mt-0.5 truncate">{nextArticle.title}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-subtle group-hover:text-accent-text transition-colors shrink-0" />
            </a>
          ) : (
            <div className="flex-1 opacity-0 pointer-events-none hidden sm:block" />
          )}
        </div>
      </div>

      {/* Right Column: Table of Contents (Desktop sticky) */}
      {headings.length > 0 && (
        <aside className="hidden lg:block w-[240px] shrink-0 select-none">
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pl-4 border-l border-line-soft space-y-3">
            <h3 className="font-mono text-[11px] font-semibold text-ink-subtle uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-ink-subtle" />
              On This Page
            </h3>

            <ul className="space-y-1.5 text-xs">
              {headings.map((h, hIdx) => {
                const isActive = activeHeadingId === h.id;
                return (
                  <li
                    key={`${h.id}-${hIdx}`}
                    className={`
                      leading-normal transition-colors duration-150
                      ${h.level === 3 ? 'pl-3' : 'pl-0'}
                    `}
                  >
                    <button
                      onClick={() => handleScrollToHeading(h.id)}
                      className={`
                        text-left hover:text-ink block w-full truncate cursor-pointer py-0.5
                        ${isActive
                          ? 'text-accent-text font-semibold'
                          : 'text-ink-subtle'
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
          className="fixed bottom-6 right-6 p-2.5 bg-surface hover:bg-surface-alt border border-line hover:border-accent/60 text-accent-text rounded-full shadow-lg z-50 cursor-pointer transition-all hover:scale-105 duration-200"
          title="Scroll to Top"
          aria-label="Scroll to top of document"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  );
}
