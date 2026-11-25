import { cleanText, imageUrl, isOwnPost, toPost } from '../src/posts';

test('drops reposts and replies to others, keeps own threads', () => {
  expect(isOwnPost({ id: '1', created_at: '', reposted_by: { screen_name: 'x' } })).toBe(false);
  expect(isOwnPost({ id: '2', created_at: '', replying_to: { screen_name: 'someone' } })).toBe(false);
  expect(isOwnPost({ id: '3', created_at: '', replying_to: { screen_name: 'fabrizioromano' } })).toBe(true);
  expect(isOwnPost({ id: '4', created_at: '', replying_to: null })).toBe(true);
});
test('strips t.co links and collapses blank lines', () => {
  expect(cleanText('Here we go! https://t.co/abc\n\n\n\nDone')).toBe('Here we go!\n\nDone');
});
test('picks mosaic, then medium photo, then video thumbnail', () => {
  expect(imageUrl({ mosaic: { formats: { jpeg: 'M' } }, all: [{ type: 'photo', url: 'P?name=orig' }] })).toBe('M');
  expect(imageUrl({ all: [{ type: 'photo', url: 'P?name=orig' }] })).toBe('P?name=medium');
  expect(imageUrl({ all: [{ type: 'video', thumbnail_url: 'T' }] })).toBe('T');
  expect(imageUrl(undefined)).toBeNull();
});
test('toPost falls back to created_at when created_timestamp is missing', () => {
  expect(toPost({ id: '9', created_at: 'Tue Nov 24 14:28:54 +0000 2026', text: 'x' }).ts).toBe(1795530534);
});
