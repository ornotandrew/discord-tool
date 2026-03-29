## Summary

Major refactor of discord-tool with shared package, split modules, and comprehensive tests.

## Changes

### @discord-tool/shared package
- `types.ts` — Discriminated union types for client/server contracts (type-safe commands)
- `config.ts` — Shared loadConfig() function
- `constants.ts` — SOCKET_PATH, TTS_DIR()

### Server handlers split into separate files
- handlers/status.ts, play.ts, tts.ts, etc.
- Each handler in its own file
- state.ts extracted from main index

### Client commands split into separate files
- commands/status.ts, play.ts, tts.ts, etc.
- socket.ts extracted from main index

### Tests
- 46 Vitest unit tests (24 server + 22 client)
- All passing

### Other
- Updated .gitignore to exclude build outputs
- Fixed type errors in test files

## Usage

```bash
npm run build   # Build all packages
npm test        # Run tests
npm run test:watch  # Watch mode
```

## Files Changed
- 51 files changed, +2307 -104