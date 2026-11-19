import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import { connectionUrl, PALETTE } from './documents';
import type { Profile } from './documents';
export type { ConnectionState } from './connection-status';
export interface Participant { clientId: number; name: string; color: string; local: boolean }
export interface CollaborationSession {
  document: Y.Doc;
  content: Y.Text;
  metadata: Y.Map<unknown>;
  awareness: Awareness;
  persistence: IndexeddbPersistence;
  provider: WebsocketProvider | null;
  destroy: () => void;
}

function readAwarenessUser(value: unknown): (Profile & { colorLight: string }) | null {
  if (!value || typeof value !== 'object' || !('name' in value) || typeof value.name !== 'string') {
    return null;
  }
  const input = 'color' in value ? value.color : undefined;
  const color = typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input) ? input : PALETTE[0];
  return { name: value.name.slice(0, 32).trim() || 'Anonymous', color, colorLight: `${color}40` };
}

export function setAwarenessProfile(awareness: Awareness, profile: Profile): void {
  awareness.setLocalStateField('user', readAwarenessUser(profile));
}

export function editorAwareness(awareness: Awareness): Pick<
  Awareness, 'doc' | 'getLocalState' | 'setLocalStateField' | 'getStates' | 'on' | 'off'
> {
  return {
    doc: awareness.doc,
    getLocalState: awareness.getLocalState.bind(awareness),
    setLocalStateField: awareness.setLocalStateField.bind(awareness),
    on: awareness.on.bind(awareness),
    off: awareness.off.bind(awareness),
    // CodeMirror interpolates these colors into style attributes. Sanitize the read view.
    getStates: () => new Map(Array.from(awareness.getStates(), ([id, state]) => [
      id, { ...state, user: readAwarenessUser(state.user) },
    ])),
  };
}

export function makeSession(roomId: string, profile: Profile, wsConfig?: string): CollaborationSession {
  const document = new Y.Doc();
  const content = document.getText('content');
  const metadata = document.getMap<unknown>('metadata');
  const requestedEndpoint = connectionUrl(window.location.hostname, wsConfig);
  const endpoint = window.location.protocol === 'https:' && requestedEndpoint?.startsWith('ws://') ? null : requestedEndpoint;
  const provider = endpoint ? new WebsocketProvider(endpoint, roomId, document, { connect: true }) : null;
  const awareness = provider?.awareness ?? new Awareness(document);
  setAwarenessProfile(awareness, profile);
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
    const user = readAwarenessUser(state.user);
    if (!user) return;
    members.push({ clientId, name: user.name, color: user.color, local: currentId === clientId });
  });
  return members.sort((a, b) => Number(b.local) - Number(a.local) || a.name.localeCompare(b.name));
}
