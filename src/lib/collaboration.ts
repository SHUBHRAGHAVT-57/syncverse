import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import { connectionUrl } from './documents';
import type { Profile } from './documents';
export type ConnectionState = 'connecting' | 'live' | 'offline' | 'local';
export interface Participant { clientId: number; name: string; color: string; local: boolean }
export interface CollaborationSession {
  document: Y.Doc;
  content: Y.Text;
  metadata: Y.Map<string>;
  awareness: Awareness;
  persistence: IndexeddbPersistence;
  provider: WebsocketProvider | null;
  destroy: () => void;
}
export function makeSession(roomId: string, profile: Profile, wsConfig?: string): CollaborationSession {
  const document = new Y.Doc();
  const content = document.getText('content');
  const metadata = document.getMap<string>('metadata');
  const requestedEndpoint = connectionUrl(window.location.hostname, wsConfig);
  const endpoint = window.location.protocol === 'https:' && requestedEndpoint?.startsWith('ws://') ? null : requestedEndpoint;
  const provider = endpoint ? new WebsocketProvider(endpoint, roomId, document, { connect: true }) : null;
  const awareness = provider?.awareness ?? new Awareness(document);
  awareness.setLocalStateField('user', { ...profile, colorLight: `${profile.color}40` });
  const persistence = new IndexeddbPersistence(`syncverse:${roomId}`, document);
  return { document, content, metadata, awareness, persistence, provider, destroy: () => {
    provider?.destroy();
    if (!provider) awareness.destroy();
    // IndexeddbPersistence registers its own document destruction hook.
    document.destroy();
  } };
}
export function participantsFromAwareness(awareness: Awareness, currentId: number): Participant[] {
  const members: Participant[] = [];
  awareness.getStates().forEach((state, clientId) => {
    const user: unknown = state.user;
    if (!user || typeof user !== 'object') return;
    const candidate = user as Record<string, unknown>;
    if (typeof candidate.name !== 'string' || typeof candidate.color !== 'string') return;
    members.push({ clientId, name: candidate.name.slice(0, 32), color: candidate.color, local: currentId === clientId });
  });
  return members.sort((a, b) => Number(b.local) - Number(a.local) || a.name.localeCompare(b.name));
}
