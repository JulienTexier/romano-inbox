export type RawStatus = {
  id: string;
  text?: string;
  created_timestamp?: number;
  created_at: string;
  replying_to?: { screen_name?: string } | string | null;
  reposted_by?: unknown;
  media?: {
    all?: { type: string; url?: string; thumbnail_url?: string }[];
    mosaic?: { formats?: { jpeg?: string } };
  };
};

export type Post = { id: string; ts: number; text: string; image: string | null };

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

export function imageUrl(media: RawStatus['media']): string | null {
  if (!media) return null;
  const mosaic = media.mosaic?.formats?.jpeg;
  if (mosaic) return mosaic;
  const all = media.all ?? [];
  const photo = all.find((m) => m.type === 'photo' && m.url);
  if (photo?.url) return photo.url.replace('name=orig', 'name=medium');
  const video = all.find((m) => m.type !== 'photo' && m.thumbnail_url);
  return video?.thumbnail_url ?? null;
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
  return { id: s.id, ts, text: cleanText(s.text), image: imageUrl(s.media) };
}
