# Security model and disclosure

## This release is not safe for sensitive documents

There are no user accounts, access-control checks, encryption-at-rest guarantees, or end-to-end encryption. **Anyone with a room URL can view and modify that room** on a reachable relay. A UUID is only a high-entropy identifier, not authentication. Documents are stored in plaintext in the local relay's LevelDB data directory and locally in browser IndexedDB.

## Threats not mitigated by v0.1

- Link recipients forwarding URLs to third parties; URL exposure through browser history or screenshots.
- Unauthorized edits if a room ID becomes known.
- Flooding/denial-of-service attacks against an internet-exposed WebSocket server.
- Unencrypted transport if deployed with `ws://` over a public network.
- Backend data compromise, malicious browser extensions, loss of data through storage clears.
- Markdown external images are blocked in the preview to reduce tracking; document links can still point to external websites.

## Recommended guardrails

Use only localhost / a trusted network for the initial prototype. Never deploy the development server to the public internet. For production, require authenticated WebSocket upgrades, per-room authorization, TLS, abuse controls, strict origin validation, privacy-safe logging, backups, and a robust persistence service. Consider CSP controls, Markdown image policy, and optional E2EE before handling private data.

## Reporting

Please avoid publicly disclosing exploitable details against a running deployment. Open a security advisory on the eventual GitHub repository or contact the maintainer privately.
