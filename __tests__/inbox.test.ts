import { emptyState, markRead, mergeFetched } from '../src/inbox';

const raw = (id: string, ts: number, extra = {}) => ({ id, created_at: '', created_timestamp: ts, text: `post ${id}`, ...extra });

test('first run keeps only the last 12 hours but marks everything seen', () => {
  const now = 100_000;
  const { state, added } = mergeFetched(emptyState(), [raw('2', now - 3600), raw('1', now - 13 * 3600)], now);
  expect(added).toBe(1);
  expect(state.inbox.map((p) => p.id)).toEqual(['2']);
  expect([...state.seen].sort()).toEqual(['1', '2']);
});
test('adds only unseen own posts, oldest first', () => {
  const s0 = { ...emptyState(), seen: ['1'] };
  const { state, added } = mergeFetched(s0, [raw('3', 30), raw('2', 20, { reposted_by: {} }), raw('1', 10)], 40);
  expect(added).toBe(1);
  expect(state.inbox.map((p) => p.id)).toEqual(['3']);
});
test('flags a gap when no known id is returned', () => {
  const s0 = { ...emptyState(), seen: ['1'] };
  expect(mergeFetched(s0, [raw('5', 50)], 60).state.maybeGap).toBe(true);
});
test('caps inbox at 300 and seen at 600', () => {
  const many = Array.from({ length: 700 }, (_, i) => raw(String(1000 + i), i));
  const { state } = mergeFetched({ ...emptyState(), seen: ['0'] }, many, 1000);
  expect(state.inbox).toHaveLength(300);
  expect(state.seen).toHaveLength(600);
});
test('keeps the newest seen ids by numeric order, beyond 2^53', () => {
  const base = 2000000000000000000n;
  const many = Array.from({ length: 601 }, (_, i) => raw(String(base + BigInt(i)), i));
  const { state } = mergeFetched({ ...emptyState(), seen: [String(base)] }, many.reverse(), 1000);
  expect(state.seen).toHaveLength(600);
  expect(state.seen).not.toContain(String(base));
  expect(state.seen).toContain(String(base + 600n));
});
test('sets lastChecked, orders inbox oldest first, does not mutate input', () => {
  const s0 = { ...emptyState(), seen: ['1'], inbox: [{ id: '1', ts: 5, text: '', media: [] }] };
  const snapshot = JSON.parse(JSON.stringify(s0));
  const { state } = mergeFetched(s0, [raw('3', 30), raw('2', 20), raw('1', 5)], 99);
  expect(state.inbox.map((p) => p.id)).toEqual(['1', '2', '3']);
  expect(state.lastChecked).toBe(99);
  expect(s0).toEqual(snapshot);
});
test('markRead removes ids and clears the gap flag', () => {
  const s = { ...emptyState(), maybeGap: true, inbox: [{ id: 'a', ts: 1, text: '', media: [] }] };
  expect(markRead(s, ['a'])).toMatchObject({ inbox: [], maybeGap: false });
  expect(s.inbox).toHaveLength(1);
});
