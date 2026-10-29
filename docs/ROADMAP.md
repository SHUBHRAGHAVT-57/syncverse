# SyncVerse roadmap

The roadmap separates **implemented source** from **verified behavior**. Features are not considered release-ready until build, browser and recovery tests pass.

## v0.1 — Collaborative Markdown foundation

- [x] React + TypeScript workspace and responsive editor UI (authored)
- [x] Y.Text collaborative editor, shared titles, and presence (authored)
- [x] IndexedDB offline persistence and WebSocket provider (authored)
- [x] Document links, local recent list, Markdown preview/export (authored)
- [x] Unit tests for pure state/URL logic (executed successfully)
- [ ] Install dependencies and generate committed `package-lock.json`
- [ ] Run full typecheck, production build, browser E2E and accessibility audits
- [ ] Exercise relay restart/recovery and offline reconnection tests
- [ ] Test keyboard-only workflow and mobile layout in real browsers

## v0.2 — Better collaboration

- [ ] Structured rich text and shared comments
- [ ] Collaborative board and structured task schema
- [ ] Presence panel that distinguishes connection state from stale members
- [ ] Import/export enhancements and conflict-resistant document naming UX

## v0.3 — Security and accounts

- [ ] Authentication and per-room authorization
- [ ] Read-only roles and permission enforcement at the relay
- [ ] Encryption in transit, data retention and backup/recovery policy
- [ ] Abuse/rate limit controls and deployment observability

## v1.0 — Production product

- [ ] Durable multi-user backend, scaling and load tests
- [ ] Audit trails and workspace management
- [ ] Accessibility compliance and browser matrix
- [ ] Benchmarked performance and recoverability SLOs
