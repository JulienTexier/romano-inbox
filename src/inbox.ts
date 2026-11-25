import { isOwnPost, toPost, type Post, type RawStatus } from './posts';

export type InboxState = {
  inbox: Post[]; // oldest first
  seen: string[];
  maybeGap: boolean;
  lastChecked: number | null;
};

const FIRST_RUN_LOOKBACK_SEC = 12 * 3600;
const INBOX_MAX = 300;
const SEEN_MAX = 600;

export function emptyState(): InboxState {
  return { inbox: [], seen: [], maybeGap: false, lastChecked: null };
}

// Ids are numeric strings beyond 2^53; a non-numeric id sorts first so it is dropped first.
function idValue(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    return -1n;
  }
}

export function mergeFetched(
  state: InboxState,
  fetched: RawStatus[],
  nowSec: number,
): { state: InboxState; added: number } {
  const seen = new Set(state.seen);
  const firstRun = seen.size === 0;
  const cutoff = nowSec - FIRST_RUN_LOOKBACK_SEC;
  let maybeGap = state.maybeGap;
  if (seen.size > 0 && fetched.length > 0 && !fetched.some((s) => seen.has(s.id))) maybeGap = true;

  const inbox = [...state.inbox];
  let added = 0;
  for (const s of fetched) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    if (!isOwnPost(s)) continue;
    const post = toPost(s);
    if (firstRun && post.ts < cutoff) continue;
    inbox.push(post);
    added++;
  }
  // Array.prototype.sort is stable, so ties keep fetch order.
  inbox.sort((a, b) => a.ts - b.ts);
  const seenSorted = [...seen].sort((a, b) => {
    const x = idValue(a);
    const y = idValue(b);
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return {
    state: {
      inbox: inbox.slice(-INBOX_MAX),
      seen: seenSorted.slice(-SEEN_MAX),
      maybeGap,
      lastChecked: nowSec,
    },
    added,
  };
}

export function markRead(state: InboxState, ids: string[]): InboxState {
  const drop = new Set(ids);
  return { ...state, inbox: state.inbox.filter((p) => !drop.has(p.id)), maybeGap: false };
}
