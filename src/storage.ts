import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyState, type InboxState } from './inbox';
import type { Post } from './posts';

const KEY = 'romano-inbox-v1';

export async function loadState(): Promise<InboxState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyState();
    const v = JSON.parse(raw);
    if (!v || !Array.isArray(v.inbox)) return emptyState();
    return {
      inbox: v.inbox.map(upgradePost),
      seen: Array.isArray(v.seen) ? v.seen : [],
      maybeGap: v.maybeGap === true,
      lastChecked: typeof v.lastChecked === 'number' ? v.lastChecked : null,
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(s: InboxState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

// Posts saved before multi-photo support had one `image` url instead of `media`.
function upgradePost(p: any): Post {
  if (Array.isArray(p?.media)) return p;
  const { image, ...rest } = p ?? {};
  return { ...rest, media: typeof image === 'string' ? [{ type: 'photo', url: image, width: 0, height: 0 }] : [] };
}
