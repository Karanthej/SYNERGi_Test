import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '@/store/useChatStore';
import { workspaceService } from '@/services/workspaceService';
import { apiClient as api } from '@/lib/apiClient';

export interface SearchResult {
  id: string;
  type: 'WORKSPACE' | 'MEMBER' | 'STARTUP' | 'MESSAGE' | 'USER';
  title: string;
  subtitle: string;
  url?: string;
  metadata?: any;
}

interface BackendGlobalSearchResult {
  id: string;
  type: 'STARTUP' | 'USER' | 'TASK' | 'FILE';
  title: string;
  subtitle: string;
  url: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useGlobalSearch(query: string) {
  const debouncedQuery = useDebounce(query.toLowerCase(), 300);
  const [backendResults, setBackendResults] = useState<SearchResult[]>([]);
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);

  // Local Stores
  const messages = useChatStore(state => state.messages);
  const { data: workspaces = [] } = useQuery({
    queryKey: ['myWorkspaces'],
    queryFn: workspaceService.getMyWorkspaces
  });

  // Since we don't have a single API to fetch all members across all workspaces,
  // we will search through workspaces' known data if possible, or skip members unless we're in a workspace context.
  // For global search, the backend search returns generic "Users".

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setBackendResults([]);
      setIsSearchingBackend(false);
      return;
    }

    let isMounted = true;
    setIsSearchingBackend(true);

    api.get<{ data: BackendGlobalSearchResult[] }>(`/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => {
        if (!isMounted) return;
        const mapped: SearchResult[] = res.data.data.map(item => ({
          id: item.id,
          type: item.type === 'STARTUP' ? 'STARTUP' : 'USER',
          title: item.title,
          subtitle: item.subtitle,
          url: item.url
        }));
        setBackendResults(mapped);
      })
      .catch(() => {
        /* console.error removed */
      })
      .finally(() => {
        if (isMounted) setIsSearchingBackend(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const localResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    const results: SearchResult[] = [];

    // Search Workspaces
    workspaces.forEach(ws => {
      if (ws.startupName.toLowerCase().includes(debouncedQuery) || ws.tagline?.toLowerCase().includes(debouncedQuery)) {
        results.push({
          id: ws.startupUuid,
          type: 'WORKSPACE',
          title: ws.startupName,
          subtitle: ws.tagline || 'Collaboration Space',
          url: `/workspace/${ws.startupUuid}` // Adjusted based on role later if needed
        });
      }
    });

    // Search Messages
    Object.entries(messages).forEach(([roomUuid, roomMsgs]) => {
      roomMsgs.forEach(msg => {
        if (msg.content.toLowerCase().includes(debouncedQuery)) {
          results.push({
            id: msg.uuid,
            type: 'MESSAGE',
            title: msg.senderName,
            subtitle: msg.content,
            metadata: {
              roomUuid,
              createdAt: msg.createdAt
            }
          });
        }
      });
    });

    return results;
  }, [debouncedQuery, workspaces, messages]);

  // Combine and deduplicate
  const combinedResults = useMemo(() => {
    const all = [...localResults, ...backendResults];
    // Simple deduplication by id (in case a startup is returned by both backend and local workspace list)
    const seen = new Set<string>();
    return all.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [localResults, backendResults]);

  return {
    results: combinedResults,
    isSearching: isSearchingBackend,
    debouncedQuery
  };
}
