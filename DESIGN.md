# SyncVerse interface

SyncVerse is a Markdown workspace for individual drafts and shared writing. The existing purple and ink identity stays; the workspace is an operating surface rather than a marketing page.

## Product truth

Recent documents and profiles are device-local. Shared document links allow editing by anyone with the link. Live collaboration requires a configured WebSocket server. Loading the offline cache does not confirm every later edit has reached durable storage. No activity, team metrics, or availability claims are invented.

## Interface decisions

- Put document creation, title search, and recent drafts in the first working viewport. Use compact rows with dates and an always-visible remove-from-recents action.
- Use purple for primary actions, active navigation, and focus. Keep ink surfaces flat, with borders to separate working regions. No promotional hero, decorative gradients, or KPI cards.
- Use the incumbent DM Sans and Manrope families with readable fallback metrics. Body and secondary text remain high contrast. Primary controls and color swatches use 44px targets; narrow dialogs arrange color choices into two rows.
- Native profile dialog retains focus containment, Escape, explicit cancel/save, and focus restoration. Write/Preview controls expose their selected state.
- Keep mobile creation and profile editing visible. Long titles truncate in the library and wrap in the editor heading. Document navigation starts at the document controls.

## Verification limits

The focused UI harness replaces collaboration and the editor with controlled fixtures; screenshots of populated workspaces use explicit test data. Remote fonts are blocked in harness captures to exercise fallback layout. It verifies rendered controls, responsive layout, keyboard operation, history/profile updates, and connection labels, not real Yjs, IndexedDB, CodeMirror, network sync, or physical devices.
