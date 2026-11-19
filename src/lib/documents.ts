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
export function cleanTitle(raw: unknown): string { return typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ').slice(0, 100) || 'Untitled document' : 'Untitled document'; }
export function parseRecents(raw: string | null): RecentDocument[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const latest = new Map<string, RecentDocument>();
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      if (!isRoomId(obj.id) || typeof obj.title !== 'string' || typeof obj.updatedAt !== 'number' || !Number.isFinite(new Date(obj.updatedAt).getTime())) continue;
      const id = obj.id.toLowerCase();
      const previous = latest.get(id);
      if (!previous || obj.updatedAt > previous.updatedAt) latest.set(id, { id, title: cleanTitle(obj.title), updatedAt: obj.updatedAt });
    }
    return [...latest.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);
  } catch { return []; }
}
export function updateRecents(items: RecentDocument[], next: RecentDocument): RecentDocument[] {
  if (!isRoomId(next.id) || !Number.isFinite(new Date(next.updatedAt).getTime())) return items;
  const id = next.id.toLowerCase();
  return [ { ...next, id, title: cleanTitle(next.title) }, ...items.filter(item => item.id.toLowerCase() !== id) ].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);
}
export function connectionUrl(hostname: string, configured: string | undefined): string | null {
  if (configured?.trim()) {
    try {
      const url = new URL(configured.trim());
      // y-websocket appends the room to this base URL, before adding its own query parameters.
      if (!['ws:', 'wss:'].includes(url.protocol) || !url.hostname || url.username || url.password || /[?#]/.test(url.href)) return null;
      return url.toString().replace(/\/+$/, '');
    }
    catch { return null; }
  }
  return ['localhost', '127.0.0.1'].includes(hostname) ? `ws://${hostname}:1234` : null;
}
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
