import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyState } from '../src/inbox';
import { loadState, saveState } from '../src/storage';

beforeEach(() => AsyncStorage.clear());

test('loadState returns an empty state when nothing is stored', async () => {
  await expect(loadState()).resolves.toEqual(emptyState());
});
test('loadState falls back on corrupt JSON', async () => {
  await AsyncStorage.setItem('romano-inbox-v1', '{not json');
  await expect(loadState()).resolves.toEqual(emptyState());
});
test('loadState falls back on a value without an inbox array', async () => {
  await AsyncStorage.setItem('romano-inbox-v1', '{"seen":["1"]}');
  await expect(loadState()).resolves.toEqual(emptyState());
});
test('saveState then loadState round-trips', async () => {
  const s = {
    inbox: [{ id: '9', ts: 123, text: 'Here we go', media: [{ type: 'photo' as const, url: 'https://x/y.jpg', width: 4, height: 3 }] }],
    seen: ['8', '9'],
    maybeGap: true,
    lastChecked: 456,
  };
  await saveState(s);
  await expect(loadState()).resolves.toEqual(s);
});
test('loadState upgrades posts saved with a single image', async () => {
  await AsyncStorage.setItem(
    'romano-inbox-v1',
    JSON.stringify({ inbox: [{ id: '1', ts: 1, text: 'a', image: 'https://x/y.jpg' }, { id: '2', ts: 2, text: 'b', image: null }], seen: ['1', '2'] }),
  );
  const s = await loadState();
  expect(s.inbox).toEqual([
    { id: '1', ts: 1, text: 'a', media: [{ type: 'photo', url: 'https://x/y.jpg', width: 0, height: 0 }] },
    { id: '2', ts: 2, text: 'b', media: [] },
  ]);
});
