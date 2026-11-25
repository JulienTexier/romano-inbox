import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { emptyState, markRead, mergeFetched, type InboxState } from './inbox';
import type { Post } from './posts';
import { fetchLatest as defaultFetchLatest } from './source';
import { loadState, saveState } from './storage';

export type UseInbox = {
  posts: Post[]; // newest first
  status: string;
  refreshing: boolean;
  maybeGap: boolean;
  refresh(): Promise<void>;
  read(ids: string[]): void;
};

function clock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function useInbox(deps: { fetchLatest?: typeof defaultFetchLatest } = {}): UseInbox {
  const fetchLatest = deps.fetchLatest ?? defaultFetchLatest;
  const fetchRef = useRef(fetchLatest);
  fetchRef.current = fetchLatest;

  const stateRef = useRef<InboxState>(emptyState());
  const loadedRef = useRef(false);
  const runningRef = useRef(false);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const [state, setState] = useState<InboxState>(emptyState());
  const [status, setStatus] = useState('Loading…');
  const [refreshing, setRefreshing] = useState(false);

  const commit = useCallback((next: InboxState) => {
    stateRef.current = next;
    setState(next);
    // Saves run one after another so an older snapshot never lands last.
    saveChain.current = saveChain.current
      .then(() => saveState(next))
      .catch((e) => console.warn('Could not save the inbox', e));
  }, []);

  const refresh = useCallback(async () => {
    if (runningRef.current || !loadedRef.current) return;
    runningRef.current = true;
    setRefreshing(true);
    try {
      const fetched = await fetchRef.current();
      const nowSec = Math.floor(Date.now() / 1000);
      // Merge into the latest state: posts read while fetching stay read.
      const { state: next, added } = mergeFetched(stateRef.current, fetched, nowSec);
      commit(next);
      setStatus(added > 0 ? `${added} new just now` : `Up to date · ${clock(new Date())}`);
    } catch {
      setStatus("Couldn't check · showing saved posts");
    } finally {
      runningRef.current = false;
      setRefreshing(false);
    }
  }, [commit]);

  const read = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      commit(markRead(stateRef.current, ids));
    },
    [commit],
  );

  useEffect(() => {
    let cancelled = false;
    loadState().then((saved) => {
      if (cancelled) return;
      stateRef.current = saved;
      loadedRef.current = true;
      setState(saved);
      void refresh();
    });
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [refresh]);

  const posts = [...state.inbox].reverse();
  return { posts, status, refreshing, maybeGap: state.maybeGap, refresh, read };
}
