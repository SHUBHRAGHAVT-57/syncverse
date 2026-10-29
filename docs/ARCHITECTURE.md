# SyncVerse architecture (v0.1)

## Why a CRDT?

The central document is a `Y.Doc` with two shared fields:

- `doc.getText('content')` holds collaborative Markdown text.
- `doc.getMap<string>('metadata')` holds the shared `title`.

`y-codemirror.next` binds the Y.Text to CodeMirror 6. Yjs merges concurrent updates without requiring operational transformation logic authored in SyncVerse. An awareness instance distributes ephemeral participant names/colors and editor cursors. Awareness is not persisted as document content.

## Transport and persistence

The client creates a WebsocketProvider keyed by a cryptographically random UUIDv4 room ID. It also creates an IndexeddbPersistence provider (scoped to that room) so local changes are stored on-device. Each room has its own lifecycle; providers and editor instances are cleaned up on navigation.

The local development relay is `y-websocket@2.1.0` with `YPERSISTENCE` configured to use LevelDB. That older, documented stable provider/server version is intentional because its server and browser clients are compatible with Yjs v13, which is also supported by the `y-codemirror.next` binding. Do not switch the server to the current development `@y/websocket-server` release without verifying Yjs version and protocol compatibility.

The client's URL is explicit in `VITE_SYNCVERSE_WS_URL`. Production builds do not default to a local or insecure WebSocket endpoint.

## Synchronization lifecycle

1. Generate or open a UUIDv4 room URL (`?room=<uuid>`).
2. Instantiate the Y.Doc, local indexedDB adapter, and optional WS provider.
3. Bind CodeMirror and listeners to Y.Text, map metadata, and awareness.
4. Any local edit becomes a Yjs update, written to IndexedDB and sent to peers when connected.
5. Remote updates are merged into the Y.Doc and rendered into the editor.
6. When the room closes, unbind observers and destroy the provider/document.

Conflict resolution for collaborative titles is Y.Map's deterministic Yjs behavior. Last-writer intent is not guaranteed during simultaneous renames.

## Offline limitations

Local changes are preserved in IndexedDB (subject to browser quota, private-mode behavior, or user clearing storage). A closed tab cannot receive changes until reopened. Offline *cold loading of the application shell* is not guaranteed; a service worker is a later milestone. The UI should not imply that disconnected local edits have reached the server.

## Reliability strategy

- Node pure-unit tests: URL parsing, room validation, recent-history integrity, and socket URL safety.
- Browser E2E: two separate browser contexts, editing and merging, reload persistence, shared title, profile identity.
- Upcoming: network partition/rejoin test, persistence across relay restart, property-based concurrent operation tests, accessibility audits, and production load testing.

## Scaling path

The built-in WebSocket relay is single-process development infrastructure. A production iteration should introduce authenticated room authorization, a durable persistence provider, backup/recovery, rate limits, deployment observability, and an explicit scalability strategy. Do not infer production suitability from the existence of LevelDB persistence alone.
