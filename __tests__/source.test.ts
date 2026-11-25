import { fetchLatest } from '../src/source';

test('keeps going after transient failures', async () => {
  const fetchImpl = jest.fn()
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ id: '1', created_at: '' }] }) });
  await expect(fetchLatest({ fetchImpl, sleep: async () => {} })).resolves.toHaveLength(1);
});
test('throws after the last attempt', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(fetchLatest({ fetchImpl, attempts: 3, sleep: async () => {} })).rejects.toThrow('404');
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
test('a stalled fetch times out and counts as a failed attempt', async () => {
  const fetchImpl = jest.fn((_url: string, init?: { signal?: AbortSignal }) =>
    new Promise<never>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }),
  ) as unknown as typeof fetch;
  await expect(fetchLatest({ fetchImpl, attempts: 1, timeoutMs: 50, sleep: async () => {} })).rejects.toThrow();
});
test('a stalled attempt is retried', async () => {
  const fetchImpl = jest.fn()
    .mockImplementationOnce((_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<never>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    )
    .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });
  await expect(fetchLatest({ fetchImpl, attempts: 2, timeoutMs: 50, sleep: async () => {} })).resolves.toEqual([]);
});
