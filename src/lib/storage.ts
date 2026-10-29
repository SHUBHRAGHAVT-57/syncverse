import { PALETTE, PROFILE_KEY, RECENTS_KEY, parseRecents, updateRecents } from './documents';
import type { Profile, RecentDocument } from './documents';
export function loadRecents(): RecentDocument[] {
  try { return parseRecents(window.localStorage.getItem(RECENTS_KEY)); } catch { return []; }
}
export function rememberDocument(next: RecentDocument): RecentDocument[] {
  const updated = updateRecents(loadRecents(), next);
  try { window.localStorage.setItem(RECENTS_KEY, JSON.stringify(updated)); } catch { /* local storage may be blocked */ }
  return updated;
}
export function forgetDocument(id: string): RecentDocument[] {
  const next = loadRecents().filter(item => item.id !== id);
  try { window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* no persistence */ }
  return next;
}
export function loadProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const value = JSON.parse(raw) as Partial<Profile>;
      if (typeof value.name === 'string' && value.name.trim() && typeof value.color === 'string' && PALETTE.includes(value.color)) return { name: value.name.trim().slice(0, 32), color: value.color };
    }
  } catch { /* local storage unavailable */ }
  return { name: 'Guest creator', color: PALETTE[0] };
}
export function saveProfile(profile: Profile): void {
  try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* no persistence */ }
}
