import { useCallback, useEffect, useState } from 'react';
import {
  searchIndividualProfiles,
  type IndividualSearchHit,
} from '@/features/portfolio/publicProfileApi';

const DEFAULT_DEBOUNCE_MS = 300;
export const USERNAME_SEARCH_MIN_CHARS = 2;

export function useUsernameSearch(minChars = USERNAME_SEARCH_MIN_CHARS) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IndividualSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim().replace(/^@/, '');
    if (trimmed.length < minChars) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const hits = await searchIndividualProfiles(trimmed);
      setResults(hits);
    } catch {
      setResults([]);
      setError('searchFailed');
    } finally {
      setLoading(false);
    }
  }, [minChars]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, DEFAULT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const trimmedLength = query.trim().replace(/^@/, '').length;

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    trimmedLength,
    canSearch: trimmedLength >= minChars,
  };
}

export type { IndividualSearchHit };
