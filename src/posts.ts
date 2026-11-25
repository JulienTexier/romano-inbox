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
  for (const m of media.all ?? []) {
    const url = m.type === 'photo' ? m.url : m.thumbnail_url;
    if (url) return url.replace('name=orig', 'name=medium');
  }
  return null;
}

export function toPost(s: RawStatus): Post {
  const ts = s.created_timestamp ?? Math.floor(Date.parse(s.created_at) / 1000);
  return { id: s.id, ts, text: cleanText(s.text), image: imageUrl(s.media) };
}
