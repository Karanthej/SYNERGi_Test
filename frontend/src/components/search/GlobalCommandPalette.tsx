import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, X, Loader2, Clock, History } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import type { SearchFilter } from '@/store/useSearchStore';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import type { SearchResult } from '@/hooks/useGlobalSearch';
import { SearchResultItem } from './SearchResultItem';

export function GlobalCommandPalette() {
  const navigate = useNavigate();
  const { 
    isOpen, 
    setIsOpen, 
    query, 
    setQuery, 
    activeFilter, 
    setActiveFilter,
    recentSearches,
    addRecentSearch,
    removeRecentSearch
  } = useSearchStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const { results, isSearching, debouncedQuery } = useGlobalSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter results
  const filteredResults = results.filter(r => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WORKSPACES' && r.type === 'WORKSPACE') return true;
    if (activeFilter === 'MEMBERS' && (r.type === 'MEMBER' || r.type === 'USER')) return true;
    if (activeFilter === 'STARTUPS' && r.type === 'STARTUP') return true;
    if (activeFilter === 'MESSAGES' && r.type === 'MESSAGE') return true;
    return false;
  });

  const virtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  // Handle Global Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  // Focus Input & Reset Index
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [query, activeFilter]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    
    if (filteredResults.length === 0 && query.length === 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < recentSearches.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && recentSearches[activeIndex]) {
        e.preventDefault();
        setQuery(recentSearches[activeIndex]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = prev < filteredResults.length - 1 ? prev + 1 : prev;
        virtualizer.scrollToIndex(next, { align: 'auto' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = prev > 0 ? prev - 1 : 0;
        virtualizer.scrollToIndex(next, { align: 'auto' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[activeIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  const handleSelect = (result: SearchResult) => {
    addRecentSearch(query);
    setIsOpen(false);
    
    if (result.type === 'MESSAGE' && result.metadata?.roomUuid) {
      // In the future, this might require specific routing if global message link is needed
      // Currently, jump to dashboard workspace chat or specific space
      navigate(`/founder/workspace/${result.metadata.roomUuid}`); // Hacky fallback
    } else if (result.url) {
      navigate(result.url);
    }
  };

  const handleRecentSelect = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[10vh] mx-auto z-[101] w-full max-w-2xl bg-[#0f111a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Search Input Header */}
            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20">
              <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search workspaces, members, messages..."
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-muted-foreground/60"
              />
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0 ml-2" />
              ) : (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-white/5 border border-white/10 rounded">ESC</kbd>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-1">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02] overflow-x-auto custom-scrollbar shrink-0">
              {(['ALL', 'WORKSPACES', 'MEMBERS', 'STARTUPS', 'MESSAGES'] as SearchFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                    activeFilter === filter 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-transparent'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Results Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{ minHeight: '300px' }}
            >
              {query.length === 0 ? (
                // Empty State / Recent Searches
                <div className="p-4">
                  {recentSearches.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                        <History className="w-3 h-3" /> Recent Searches
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((sq, i) => (
                          <div 
                            key={sq}
                            onClick={() => handleRecentSelect(sq)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${activeIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                          >
                            <span className="text-sm text-white flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" /> {sq}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeRecentSearch(sq); }}
                              className="p-1 hover:text-red-400 text-muted-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-white font-medium mb-1">What are you looking for?</p>
                      <p className="text-xs text-muted-foreground">Search across your entire workspace network.</p>
                    </div>
                  )}
                </div>
              ) : (
                // Search Results
                <>
                  {filteredResults.length === 0 && !isSearching ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                      <p className="text-white font-medium mb-1">No results found</p>
                      <p className="text-xs text-muted-foreground">We couldn't find anything matching "{query}"</p>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                        const item = filteredResults[virtualItem.index];
                        return (
                          <div
                            key={virtualItem.key}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <SearchResultItem
                              result={item}
                              query={debouncedQuery}
                              isActive={activeIndex === virtualItem.index}
                              onSelect={() => handleSelect(item)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 text-[10px] text-muted-foreground flex justify-between">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↑</kbd><kbd className="bg-white/10 px-1 rounded">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↵</kbd> to select</span>
              </div>
              <div>{filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
