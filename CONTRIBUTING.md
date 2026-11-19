# Contributing to SyncVerse

Thanks for considering a contribution. This project prioritizes functional correctness and understandable source over impressive screenshots.

## Local workflow

1. Fork the repository, create a focused feature branch, and run `npm ci`.
2. Use `npm run dev` for the web app and local relay.
3. Add a regression test for each bug fix or behavior change.
4. Run `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`, and `npm run test:recovery` before opening a PR. Stop `npm run dev` before the recovery suite: it owns port 1234 and uses a disposable relay database.
5. Document any changes to the persistence format, authentication assumptions, or public APIs.

Keep changes scoped; never commit `.env`, `node_modules`, `.syncverse-data`, credentials, or user documents. No hardcoded service tokens or fabricated test results. For vulnerability reports, see [SECURITY.md](docs/SECURITY.md).

## Engineering principles

- Preserve CRDT convergence and offline update safety.
- Prefer explicit, typed boundaries and deterministic tests.
- Treat room IDs as capabilities, **not** secure authorization.
- Include keyboard and narrow-screen support for all interactive elements.
- Make the distinction between local persistence and remote synchronization clear.
- Finish a focused change, its regression tests, and evidence before starting another feature. Record unresolved device/browser checks in the PR instead of treating them as passed.
