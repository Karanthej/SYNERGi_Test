import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '@/lib/apiClient';

interface SearchResult {
  id: string;
  type: 'STARTUP' | 'USER' | 'TASK' | 'FILE';
  title: string;
  subtitle: string;
  url: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch (error) {
        /* console.error removed */
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (url: string) => {
    navigate(url);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 sm:px-0">
      <div className="fixed inset-0 /50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
      
      <div className="relative w-full max-w-2xl bg-white glass-surface rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-[80vh]">
        <div className="relative flex items-center px-4 py-4 border-b border-[var(--glass-border)] dark:border-gray-800">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-0 focus:ring-0 text-lg px-4 outline-none text-foreground dark:text-white placeholder-gray-400"
            placeholder="Search startups, talents, tasks... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {query.length > 0 && query.length < 2 && (
            <div className="p-8 text-center text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}
          
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleSelect(result.url)}
                    className="w-full text-left px-6 py-3 hover:bg-primary/10 dark:hover:bg-indigo-900/20 flex items-center space-x-4 transition-colors focus:bg-primary/10 outline-none"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg glass-surface flex items-center justify-center text-muted-foreground">
                      {result.type === 'STARTUP' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      )}
                      {result.type === 'USER' && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground dark:text-white">{result.title}</h4>
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="glass-surface/50 px-4 py-3 text-xs text-muted-foreground flex justify-between border-t border-[var(--glass-border)] dark:border-gray-800">
          <span>Search powered by SYNERGi</span>
          <span className="flex space-x-3">
            <span><kbd className="font-sans bg-white glass-surface px-1.5 py-0.5 rounded shadow-sm border dark:border-gray-600">??</kbd> to navigate</span>
            <span><kbd className="font-sans bg-white glass-surface px-1.5 py-0.5 rounded shadow-sm border dark:border-gray-600">Enter</kbd> to select</span>
            <span><kbd className="font-sans bg-white glass-surface px-1.5 py-0.5 rounded shadow-sm border dark:border-gray-600">Esc</kbd> to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}


