import type { RawStatus } from './posts';

const SOURCE = 'https://api.fxtwitter.com/2/profile/FabrizioRomano/statuses';
const DELAYS = [1000, 3000];

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function fetchLatest(
  opts: {
    fetchImpl?: typeof fetch;
    attempts?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<RawStatus[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const attempts = opts.attempts ?? 3;
  const sleep = opts.sleep ?? realSleep;
  let lastError: unknown = new Error('fetch failed');
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchImpl(SOURCE);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { results?: RawStatus[] };
      return body.results ?? [];
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) await sleep(DELAYS[Math.min(i, DELAYS.length - 1)]);
    }
  }
  throw lastError;
}
