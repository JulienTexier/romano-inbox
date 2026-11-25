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
