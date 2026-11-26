export type RawStatus = {
  id: string;
  text?: string;
  created_timestamp?: number;
  created_at: string;
  replying_to?: { screen_name?: string } | string | null;
  reposted_by?: unknown;
  media?: {
    all?: { type: string; url?: string; thumbnail_url?: string; width?: number; height?: number }[];
    mosaic?: { formats?: { jpeg?: string } };
  };
};

export type Media =
  | { type: 'photo'; url: string; width: number; height: number }
  | { type: 'video'; url: string; thumb: string | null; width: number; height: number; loop: boolean };

export type Post = { id: string; ts: number; text: string; media: Media[] };

const HANDLE = 'FabrizioRomano';

export function isOwnPost(s: RawStatus): boolean {
  if (s.reposted_by) return false;
  const rt = s.replying_to;
  if (!rt) return true;
  const name = typeof rt === 'string' ? rt : rt.screen_name;
  return String(name).toLowerCase() === HANDLE.toLowerCase();
}

export function cleanText(t: string | undefined): string {
  const noLinks = (t ?? '').replace(/https:\/\/t\.co\/\S+/g, '');
  return noLinks
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Every photo and video in the post, in order. Videos without a playable url fall back to their thumbnail as a photo.
export function mediaList(media: RawStatus['media']): Media[] {
  const out: Media[] = [];
  for (const m of media?.all ?? []) {
    const width = m.width ?? 0;
    const height = m.height ?? 0;
    if (m.type === 'photo' && m.url) {
      out.push({ type: 'photo', url: m.url.replace('name=orig', 'name=medium'), width, height });
    } else if ((m.type === 'video' || m.type === 'gif') && m.url) {
      out.push({ type: 'video', url: m.url, thumb: m.thumbnail_url ?? null, width, height, loop: m.type === 'gif' });
    } else if (m.thumbnail_url) {
      out.push({ type: 'photo', url: m.thumbnail_url, width, height });
    }
  }
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parses "Tue Nov 24 14:28:54 +0000 2026" without Date.parse (Hermes may not accept it).
function parseTwitterDate(str: string): number {
  const m = /^\s*\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+([+-])(\d{2})(\d{2})\s+(\d{4})\s*$/.exec(str);
  if (!m) return 0;
  const month = MONTHS.indexOf(m[1]);
  if (month < 0) return 0;
  const ms = Date.UTC(+m[9], month, +m[2], +m[3], +m[4], +m[5]);
  const offset = (m[6] === '-' ? -1 : 1) * (+m[7] * 60 + +m[8]) * 60000;
  const ts = Math.floor((ms - offset) / 1000);
  return Number.isFinite(ts) ? ts : 0;
}

export function toPost(s: RawStatus): Post {
  const ts = s.created_timestamp ?? parseTwitterDate(s.created_at);
  return { id: s.id, ts, text: cleanText(s.text), media: mediaList(s.media) };
}
