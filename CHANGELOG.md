# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-10-19

The `useJSONWorker` hook is unchanged. This release fixes how the package is published and modernises the tooling around it.

### Fixed

- `dist/index.js` re-exported `./useJSONWorker` without a file extension, which native Node ESM cannot resolve (bundlers hid it). It now imports `./useJSONWorker.js`.

### Added

- An `exports` map with types, and `sideEffects: false`.
- `repository`, `homepage`, `bugs`, `keywords` and `author` in `package.json`.
- Releases are published from a tag-triggered workflow with npm trusted publishing and provenance.
- `lint`, `typecheck` and `check:package` (publint and Are the Types Wrong?) scripts, run in CI.

### Changed

- `engines.node` is `>=22`; Node 18 and 20 are no longer tested.
- The React peer range is `^18 || ^19` (was `>=18`); CI tests both React 18 and 19.
- Development dependencies are updated to current majors: React 19 types, Vite 8, Vitest 5, jsdom 30, ESLint 10. TypeScript is 6, because typescript-eslint does not support TypeScript 7 yet.

[0.2.0]: https://github.com/fdamianenriquez/react-json-worker/releases/tag/v0.2.0
