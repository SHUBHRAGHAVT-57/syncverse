# SyncVerse milestones

Finish the current milestone and its evidence before expanding features. These entries describe the local working copy on 2026-11-19, not a newly published release.

## v0.1 — Collaborative Markdown foundation

- [x] Responsive workspace, document links, local recents/search, and editable profiles
- [x] Y.Text editing, shared titles, presence, IndexedDB, and local WebSocket/LevelDB relay
- [x] Markdown preview/export and history/selection retained across Preview
- [x] Peer-safe local undo with an exhausted-stack regression
- [x] Lockfile and CI configuration using npm ci
- [x] Execute 17 unit tests, app/test typechecks, build, and 20 Chromium scenarios
- [x] Execute unexpected socket interruption and owned relay restart/fresh-context restoration
- [x] Inspect actual desktop/mobile captures and keyboard/narrow-screen interactions
- [ ] Recheck clean installation and updated workflow on a fresh CI runner
- [ ] Verify Firefox/WebKit, physical phones, and assistive technology
- [ ] Address the measured JavaScript bundle-size warning
- [ ] Exercise storage denial/quota, prolonged partitions, and disk/power-loss recovery

Evidence: [Verification](VERIFICATION.md). Rationale: [Engineering decisions](ENGINEERING.md).

## Next — Safe collaboration service

- [ ] Authentication and server-enforced room permissions
- [ ] TLS, origin validation, rate limits, and privacy-safe observability
- [ ] Durable persistence, backups, retention, and restore drills
- [ ] Load tests and a multi-process/scaling strategy
- [ ] Browser/accessibility matrix and measured performance/recovery budgets

## Later — Product expansion

Rich-text structures, comments, boards, audit trails, and workspace management remain proposals. They should not displace the reliability/security gates above. No production availability, encryption guarantee, or delivery date is promised.
