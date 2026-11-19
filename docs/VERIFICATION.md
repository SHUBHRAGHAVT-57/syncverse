# Verification — 2026-11-19

The local runs used installed CodeMirror, Yjs, IndexedDB, and a loopback WebSocket/LevelDB relay.

The test environment was Windows with Node.js **24.22.1**, npm **11.19.1**, Vite **8.3.5**, and Playwright Chromium **156.0.8078.4**. Both suites ran in sequence with frontend port **4412** and relay port **1242**. Separate probes confirmed both ports were free after each suite.

| Check | Executed result |
| --- | --- |
| `npm test` | **17/17 passed**, none skipped |
| `npm run typecheck` | **Passed** for app, tests, and Playwright configuration |
| `npm run build -- --configLoader runner` | **Passed**, with the bundle warning below |
| Full Chromium E2E suite | **25/25 passed**, none skipped |
| Separate relay recovery suite | **1/1 passed**, none skipped |
| Selection history regression | Selection undo erased document text before the fix. The same test passed with the fix. |
| Actual screenshots | **5 inspected**, desktop 1440×1000 and mobile 390×844 CSS pixels |
| Responsive interactions | 320, 375, 760px tests passed; capture checks found no overflow at 320–1440px |
| Markdown export | Actual filename and UTF-8 download bytes checked |
| Runtime errors during capture walkthrough | **0 page errors** |
| Fresh `npm ci` in this environment | **Not verified**; a protected installed-dependency junction was reused |

Run the checks from the repository directory.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:recovery
```

The end-to-end suite starts Vite and an in-memory relay. The recovery suite starts Vite on its own endpoint and the test controls a relay with a temporary LevelDB database. Both configurations accept `SYNCVERSE_TEST_WEB_PORT` and `SYNCVERSE_TEST_RELAY_PORT`. CI installs Chromium and runs the suites sequentially.

## Behavior exercised

- Independent contexts exchange concurrent text, titles, presence, and pending offline edits. Reload restores synchronized text.
- Preview retains local undo and redo, selected text, and incoming peer updates. Keyboard and native history input both use Yjs for text edits. CodeMirror still handles selection undo and redo.
- A transport proxy closes a real relay socket and temporarily rejects reconnects. Pending edits are reported, then merge after automatic reconnect without Pause/Resume.
- The recovery test terminates/restarts its owned relay, merges edits from two disconnected clients, then closes every original client. Another restart restores text/title in a fresh context with no existing IndexedDB document, distinguishing LevelDB persistence from a surviving browser reseeding the room.
- Profile focus containment, Escape/focus restoration, save/cancel, cross-tab updates, long titles, recents/search/removal, and narrow layouts run against the actual app. The status-handshake test deliberately controls a socket to prove Live waits for synchronization.
- A peer's invalid color falls back safely in the avatar, caret, and selection. A delayed clipboard rejection offers manual copying only while its room is open.

## Measurements and limits

The build emitted **1,078.22 kB JavaScript (353.20 kB gzip)** and **16.81 kB CSS (4.29 kB gzip)**. Vite warns that the JavaScript chunk exceeds 500 kB. Field Web Vitals and frame rates remain unmeasured.

Screenshots show labeled sample documents and demo browser participants. Remote Google Fonts were blocked to verify fallback layout. These are emulated browser viewports, not physical-phone evidence. See [Walkthrough](WALKTHROUGH.md).

Not checked: Firefox/WebKit, physical phones, macOS shortcuts, screen-reader/full accessibility audit, high load, prolonged partitions, disk-full/power-loss recovery, or production hosting. A local restart test is not a backup/durability guarantee. IndexedDB quota/private-mode failures, cleared storage, and denied localStorage can prevent restoration. “Offline cache loaded” reports initial loading, not each subsequent durable write. Authentication, room authorization, and E2EE remain unimplemented; see [Security](SECURITY.md).
