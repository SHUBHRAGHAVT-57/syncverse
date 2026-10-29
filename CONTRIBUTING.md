# Contributing to SyncVerse

Thanks for considering a contribution. This project prioritizes functional correctness and understandable source over impressive screenshots.

## Local workflow

1. Fork the repository, create a focused feature branch, and run `npm install`.
2. Use `npm run dev` for the web app and local relay.
3. Add a regression test for each bug fix or behavior change.
4. Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` before opening a PR.
5. Document any changes to the persistence format, authentication assumptions, or public APIs.

Keep changes scoped; never commit `.env`, `node_modules`, `.syncverse-data`, credentials, or user documents. No hardcoded service tokens or fabricated test results. For vulnerability reports, see [SECURITY.md](docs/SECURITY.md).

## Engineering principles

- Preserve CRDT convergence and offline update safety.
- Prefer explicit, typed boundaries and deterministic tests.
- Treat room IDs as capabilities, **not** secure authorization.
- Include keyboard and narrow-screen support for all interactive elements.
- Make the distinction between local persistence and remote synchronization clear.
