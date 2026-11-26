import { cleanText, mediaList, isOwnPost, toPost } from '../src/posts';

test('drops reposts and replies to others, keeps own threads', () => {
  expect(isOwnPost({ id: '1', created_at: '', reposted_by: { screen_name: 'x' } })).toBe(false);
  expect(isOwnPost({ id: '2', created_at: '', replying_to: { screen_name: 'someone' } })).toBe(false);
  expect(isOwnPost({ id: '3', created_at: '', replying_to: { screen_name: 'fabrizioromano' } })).toBe(true);
  expect(isOwnPost({ id: '4', created_at: '', replying_to: null })).toBe(true);
});
test('strips t.co links and collapses blank lines', () => {
  expect(cleanText('Here we go! https://t.co/abc\n\n\n\nDone')).toBe('Here we go!\n\nDone');
});
test('keeps every photo in order at medium size, with dimensions', () => {
  expect(
    mediaList({
      mosaic: { formats: { jpeg: 'M' } },
      all: [
        { type: 'photo', url: 'A?name=orig', width: 2048, height: 1366 },
        { type: 'photo', url: 'B?name=orig' },
      ],
    }),
  ).toEqual([
    { type: 'photo', url: 'A?name=medium', width: 2048, height: 1366 },
    { type: 'photo', url: 'B?name=medium', width: 0, height: 0 },
  ]);
  expect(mediaList(undefined)).toEqual([]);
});
test('keeps videos and gifs with their thumbnail; gifs loop', () => {
  expect(
    mediaList({
      all: [
        { type: 'video', url: 'V.mp4', thumbnail_url: 'T', width: 1280, height: 720 },
        { type: 'gif', url: 'G.mp4' },
      ],
    }),
  ).toEqual([
    { type: 'video', url: 'V.mp4', thumb: 'T', width: 1280, height: 720, loop: false },
    { type: 'video', url: 'G.mp4', thumb: null, width: 0, height: 0, loop: true },
  ]);
});
test('a video without a playable url falls back to its thumbnail', () => {
  expect(mediaList({ all: [{ type: 'video', thumbnail_url: 'T' }] })).toEqual([{ type: 'photo', url: 'T', width: 0, height: 0 }]);
});
test('toPost falls back to created_at when created_timestamp is missing', () => {
  expect(toPost({ id: '9', created_at: 'Tue Nov 24 14:28:54 +0000 2026', text: 'x' }).ts).toBe(1795530534);
});
test('toPost gives ts 0 for an unparseable created_at', () => {
  expect(toPost({ id: '9', created_at: '' }).ts).toBe(0);
});
test('toPost honours a +0200 offset in created_at', () => {
  expect(toPost({ id: '9', created_at: 'Tue Nov 24 16:28:54 +0200 2026' }).ts).toBe(1795530534);
});
