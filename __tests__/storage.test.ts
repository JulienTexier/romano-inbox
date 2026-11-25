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
    inbox: [{ id: '9', ts: 123, text: 'Here we go', image: 'https://x/y.jpg' }],
    seen: ['8', '9'],
    maybeGap: true,
    lastChecked: 456,
  };
  await saveState(s);
  await expect(loadState()).resolves.toEqual(s);
});
