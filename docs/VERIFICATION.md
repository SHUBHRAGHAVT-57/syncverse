# Verification — 2026-11-19

These results describe the local working copy using real installed dependencies, CodeMirror, Yjs, IndexedDB, and a loopback WebSocket/LevelDB relay. They do not describe a published release or a newly completed GitHub Actions run.

Environment: Windows, Node.js **24.22.1**, npm **11.19.1**, Vite **8.3.5**, headless Chrome **157.0.8103.79**. The frontend used **127.0.0.1:4402** and relay **127.0.0.1:1234**, with external Playwright configuration to isolate other projects.

| Check | Executed result |
| --- | --- |
| `npm test` | **17/17 passed**, none skipped |
| `npm run typecheck` | **Passed** for app, tests, and Playwright configuration |
| `npm run build` | **Passed**, with the bundle warning below |
| Full Chromium E2E suite | **20/20 passed**, none skipped |
| Separate relay recovery suite | **1/1 passed**, none skipped |
| Preview/history regressions | **4 failed before the fix; all 4 passed afterward** and in the full suite |
| Actual screenshots | **5 inspected**, desktop 1440×1000 and mobile 390×844 CSS pixels |
| Responsive interactions | 320, 375, 760px tests passed; capture checks found no overflow at 320–1440px |
| Markdown export | Actual filename and UTF-8 download bytes checked |
| Runtime errors during capture walkthrough | **0 page errors** |
| Fresh `npm ci` in this environment | **Not verified**; a protected installed-dependency junction was reused |
| Updated GitHub Actions workflow | Configured, **not run remotely** in this pass |

Standard commands:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
# Stop npm run dev / an existing relay before this command:
npm.cmd run test:recovery
```

The isolated browser runs use the same test sources with external configurations pointing to the built app on 4402 and installed Chrome instead of the default development server on 5173. Recovery additionally selects `tests/recovery`, and that test owns the relay. CI installs Chromium and runs both repository suites sequentially.

## Behavior exercised

- Independent contexts exchange concurrent text, titles, presence, and pending offline edits. Reload restores synchronized text.
- Preview retains local undo/redo, selected text, and incoming peer updates. Undo on an exhausted local stack leaves peer content intact.
- A transport proxy closes a real relay socket and temporarily rejects reconnects. Pending edits are reported, then merge after automatic reconnect without Pause/Resume.
- The recovery test terminates/restarts its owned relay, merges edits from two disconnected clients, then closes every original client. Another restart restores text/title in a fresh context with no existing IndexedDB document, distinguishing LevelDB persistence from a surviving browser reseeding the room.
- Profile focus containment, Escape/focus restoration, save/cancel, cross-tab updates, long titles, recents/search/removal, and narrow layouts run against the actual app. The status-handshake test deliberately controls a socket to prove Live waits for synchronization.

## Measurements and limits

The build emitted **1,077.35 kB JavaScript (352.91 kB gzip)** and **16.81 kB CSS (4.29 kB gzip)**. Vite warns that the JS chunk exceeds 500 kB. Loading performance remains an open concern; the warning threshold was not raised. These are artifact sizes, not field Web Vitals or frame-rate measurements.

Screenshots show labeled sample documents and demo browser participants. Remote Google Fonts were blocked to verify fallback layout. These are emulated browser viewports, not physical-phone evidence. See [Walkthrough](WALKTHROUGH.md).

Not checked: Firefox/WebKit, physical phones, macOS shortcuts, screen-reader/full accessibility audit, high load, prolonged partitions, disk-full/power-loss recovery, or production hosting. A local restart test is not a backup/durability guarantee. IndexedDB quota/private-mode failures, cleared storage, and denied localStorage can prevent restoration. “Offline cache loaded” reports initial loading, not each subsequent durable write. Authentication, room authorization, and E2EE remain unimplemented; see [Security](SECURITY.md).
