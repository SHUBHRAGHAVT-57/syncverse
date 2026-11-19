# SyncVerse: preserving state across collaboration

SyncVerse is a local-first collaborative Markdown prototype maintained by Shubh Raghav. React owns the workspace/room lifecycle; CodeMirror provides editing; Yjs and its adapters provide shared state, awareness, transport, and persistence. This case study describes their integration, without claiming those libraries as original work.

## The failure

Preview conditionally removed `MarkdownEditor` from React's tree. Cleanup destroyed its CodeMirror view and local `Y.UndoManager`. Shared text survived, but returning to Write recreated an empty history and moved the cursor to the start. Replacing previously selected text then inserted at the wrong location.

A separate defect affected undo without Preview: `basicSetup` installed native history shortcuts while the Yjs undo manager lacked its keyboard map. Native history could reverse peer changes. Keeping the editor mounted alone would preserve that unsafe behavior.

## The decision

Keep one editor per room and hide its wrapper using native `hidden` while showing Preview. That preserves selection/history and removes the inactive editor from focus and the accessibility tree. The preview continues observing shared text. Leaving the room still destroys its resources; history does not survive a reload or a different room.

Bind `yUndoManagerKeymap` before `basicSetup`. Extension ordering gives Yjs shortcuts priority; the binding tracks local editor origins and consumes undo even when the local stack is empty. It therefore cannot fall through to native history and remove peer content. Remove the redundant default-keymap registration. No dependency, persistence schema, or protocol change was needed.

This follows [CodeMirror keymap precedence](https://codemirror.net/examples/config/), the pinned [binding's undo implementation](https://github.com/yjs/y-codemirror.next/blob/v0.3.5/src/y-undomanager.js), and [Yjs selective undo](https://docs.yjs.dev/api/undo-manager). The tradeoff is retaining one hidden editor during Preview rather than serializing its internal state.

## Evidence and boundaries

Four real-browser regressions failed before the fix: Preview undo/redo, selected-text continuation, peer-safe local undo while writing, and peer edits during Preview. All four passed afterward and in the **20-scenario Chromium suite**. **17 unit tests**, application/test typechecks, and the production build passed.

A separate passing recovery test interrupts its owned relay, permits edits from two disconnected clients, restarts against the same LevelDB database, and checks convergence. After closing all original clients, another restart and fresh browser context restore text/title without an existing browser cache. A socket-proxy interruption test also proves automatic reconnect without clicking Pause/Resume.

The local production build emits about **1.08 MB of JavaScript (353 kB gzip)** and triggers Vite's size warning. Loading performance remains open. See [Verification](VERIFICATION.md) and the [walkthrough](WALKTHROUGH.md).

The relay remains development infrastructure. Room links do not enforce permissions; browser storage can fail or be cleared. No accounts, production backups, load-tested service, or physical-device/assistive-technology certification is implied. The [milestones](ROADMAP.md) prioritize those gates before new product features.
