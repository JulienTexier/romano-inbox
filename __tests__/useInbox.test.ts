import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyState, type InboxState } from '../src/inbox';
import type { Post, RawStatus } from '../src/posts';
import * as storage from '../src/storage';
import { useInbox } from '../src/useInbox';

const NOW = Math.floor(Date.now() / 1000);

const post = (id: string, ts: number): Post => ({ id, ts, text: `post ${id}`, media: [] });
const raw = (id: string, ts: number): RawStatus => ({
  id,
  text: `fresh ${id}`,
  created_timestamp: ts,
  created_at: new Date(ts * 1000).toUTCString(),
});

async function seed(state: InboxState) {
  await storage.saveState(state);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

test('refresh adds new posts and reports them', async () => {
  const fetchLatest = jest.fn().mockResolvedValue([raw('100', NOW - 60)]);
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.posts).toHaveLength(1));
  expect(result.current.posts[0].id).toBe('100');
  expect(result.current.status).toMatch(/^(1 new just now|Up to date · \d\d:\d\d)$/);
  expect(result.current.refreshing).toBe(false);
});

test('refresh failure keeps saved posts', async () => {
  await seed({ ...emptyState(), inbox: [post('1', NOW - 200), post('2', NOW - 100)], seen: ['1', '2'] });
  const fetchLatest = jest.fn().mockRejectedValue(new Error('offline'));
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.status).toMatch(/^Couldn't check/));
  expect(result.current.posts.map((p) => p.id)).toEqual(['2', '1']);
  expect(result.current.status).toBe("Couldn't check · showing saved posts");
});

test('read removes posts and persists', async () => {
  await seed({ ...emptyState(), inbox: [post('1', NOW - 200), post('2', NOW - 100)], seen: ['1', '2'] });
  const fetchLatest = jest.fn().mockResolvedValue([]);
  const saveSpy = jest.spyOn(storage, 'saveState');
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.posts).toHaveLength(2));
  await waitFor(() => expect(result.current.refreshing).toBe(false));
  saveSpy.mockClear();
  await act(async () => result.current.read(['2']));
  expect(result.current.posts.map((p) => p.id)).toEqual(['1']);
  await waitFor(() => expect(saveSpy).toHaveBeenCalled());
  const saved = saveSpy.mock.calls.at(-1)![0];
  expect(saved.inbox.map((p) => p.id)).toEqual(['1']);
  expect((await storage.loadState()).inbox.map((p) => p.id)).toEqual(['1']);
});

test('read keeps the screen state when saving fails', async () => {
  await seed({ ...emptyState(), inbox: [post('1', NOW - 200)], seen: ['1'] });
  const fetchLatest = jest.fn().mockResolvedValue([]);
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.posts).toHaveLength(1));
  await waitFor(() => expect(result.current.refreshing).toBe(false));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(storage, 'saveState').mockRejectedValue(new Error('disk full'));
  await act(async () => result.current.read(['1']));
  expect(result.current.posts).toHaveLength(0);
});

test('a refresh while one is running is ignored', async () => {
  let resolve!: (v: RawStatus[]) => void;
  const fetchLatest = jest.fn().mockImplementation(() => new Promise<RawStatus[]>((r) => (resolve = r)));
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(fetchLatest).toHaveBeenCalledTimes(1));
  await act(async () => {
    void result.current.refresh();
  });
  expect(fetchLatest).toHaveBeenCalledTimes(1);
  await act(async () => resolve([]));
  await waitFor(() => expect(result.current.refreshing).toBe(false));
});

test('loaded is false before saved state loads', async () => {
  const fetchLatest = jest.fn().mockResolvedValue([]);
  const seen: boolean[] = [];
  const { result } = await renderHook(() => {
    const inbox = useInbox({ fetchLatest });
    seen.push(inbox.loaded);
    return inbox;
  });
  expect(seen[0]).toBe(false);
  await waitFor(() => expect(result.current.loaded).toBe(true));
});

test('everChecked stays false when the first fetch fails', async () => {
  const fetchLatest = jest.fn().mockRejectedValue(new Error('offline'));
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.status).toMatch(/^Couldn't check/));
  expect(result.current.loaded).toBe(true);
  expect(result.current.everChecked).toBe(false);
});

test('everChecked becomes true after a successful fetch', async () => {
  const fetchLatest = jest.fn().mockResolvedValue([]);
  const { result } = await renderHook(() => useInbox({ fetchLatest }));
  await waitFor(() => expect(result.current.everChecked).toBe(true));
});
