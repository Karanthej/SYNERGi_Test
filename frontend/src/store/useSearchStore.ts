import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SearchFilter = 'ALL' | 'WORKSPACES' | 'MEMBERS' | 'STARTUPS' | 'MESSAGES';

interface SearchState {
  isOpen: boolean;
  query: string;
  activeFilter: SearchFilter;
  recentSearches: string[];
  
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setQuery: (query: string) => void;
  setActiveFilter: (filter: SearchFilter) => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      isOpen: false,
      query: '',
      activeFilter: 'ALL',
      recentSearches: [],

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setQuery: (query) => set({ query }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      
      addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        const filtered = state.recentSearches.filter(s => s !== query.trim());
        return {
          recentSearches: [query.trim(), ...filtered].slice(0, 10) // Keep max 10
        };
      }),

      removeRecentSearch: (query) => set((state) => ({
        recentSearches: state.recentSearches.filter(s => s !== query)
      })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'synergi-search-storage',
      partialize: (state) => ({ recentSearches: state.recentSearches }), // Only persist recent searches
    }
  )
);
