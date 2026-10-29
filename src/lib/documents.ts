/** A document link is an unguessable room capability, not an authentication mechanism. */
export const RECENTS_KEY = 'syncverse:recent:v1';
export const PROFILE_KEY = 'syncverse:profile:v1';
export const ROOM_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export interface RecentDocument { id: string; title: string; updatedAt: number }
export interface Profile { name: string; color: string }
export const PALETTE = ['#9b8cff', '#6ed9d0', '#f2ae7e', '#df86d2', '#91bdff', '#e5c477'];
export function isRoomId(value: unknown): value is string { return typeof value === 'string' && ROOM_RE.test(value); }
export function roomFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('room');
  return value === null ? null : (isRoomId(value) ? value.toLowerCase() : 'invalid');
}
export function cleanTitle(raw: string): string { return raw.trim().replace(/\s+/g, ' ').slice(0, 100) || 'Untitled document'; }
export function parseRecents(raw: string | null): RecentDocument[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((item): item is RecentDocument => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Record<string, unknown>;
      if (!isRoomId(obj.id) || typeof obj.title !== 'string' || typeof obj.updatedAt !== 'number' || !Number.isFinite(obj.updatedAt) || seen.has(obj.id)) return false;
      seen.add(obj.id); return true;
    }).slice(0, 30);
  } catch { return []; }
}
export function updateRecents(items: RecentDocument[], next: RecentDocument): RecentDocument[] {
  if (!isRoomId(next.id)) return items;
  return [ { ...next, title: cleanTitle(next.title) }, ...items.filter(item => item.id !== next.id) ].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);
}
export function connectionUrl(hostname: string, configured: string | undefined): string | null {
  if (configured?.trim()) {
    try { const url = new URL(configured.trim()); return ['ws:', 'wss:'].includes(url.protocol) && !!url.hostname ? url.toString().replace(/\/$/, '') : null; }
    catch { return null; }
  }
  return ['localhost', '127.0.0.1'].includes(hostname) ? `ws://${hostname}:1234` : null;
}
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
