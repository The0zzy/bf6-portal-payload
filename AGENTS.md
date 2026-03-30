# Project Guidelines

## Build And Verify

- Node.js 23+ is required (`package.json` engines).
- Install dependencies with `npm install`.
- When editing, run `npm run lint` before final response.
- Core checks:
    - `npm run build` (generates `dist/bundle.ts` and `dist/bundle.strings.json`)
    - `npm run lint`
    - `npm run prettier`
- Utility scripts:
    - `npm run export-thumbnail` (Portal thumbnail constraints)
    - `npm run minify-spatials` (spatial JSON optimization)
    - `npm run deploy[:patch|:minor|:major]` (build + upload)

## Architecture

- This is an event-driven Battlefield Portal mod written in strict TypeScript.
- `src/index.ts` is the thin router for Portal event handlers and ongoing loops.
- Payload game mode implementation lives under `src/Payload/`:
    - `Payload.ts`: central event router for Payload mode.
    - `PayloadCore.ts`: game loop, spline movement, checkpoint progression, and objective flow.
    - `PayloadConfig.ts`: static configuration data and player variable keys.
    - `PayloadState.ts`: singleton runtime state (including runtime-only flags like overtime/gameOngoing).
    - `PayloadUI.ts`: global and per-player UI handling.
    - `PayloadScoring.ts`: scoreboard and objective points.
    - `PayloadSounds.ts`: VO/music/SFX orchestration.
    - `PayloadWeather.ts`: weather and VFX reset logic.
- Runtime-populated payload spatial definitions are stored in state (`PayloadState.payloadSpatialsConfig`), not config.
- Legacy pre-refactor entrypoint is kept as `src/old_index.ts` for reference.
- Ongoing handlers run ~30 times per second. Keep per-tick logic minimal and allocation-light.

## Portal API Conventions

- Do not invent `mod.*` APIs. Use only symbols defined in `node_modules/bf6-portal-mod-types/`.
- Any player action that can fail for undeployed players must guard with alive/deployed checks first.
- There is no `mod.AllTeams()`. Derive active teams from players.
- Portal arrays are not native JS arrays. Iterate using `mod.CountOf()` and `mod.ValueInArray()`.
- In-game text must come from `*.strings.json` and be referenced via `mod.Message(mod.stringkeys...)`.
- Prefer `async/await` around `mod.Wait()` for readability in async game flow.

## Bundler And Runtime Gotchas

- The bundler merges exported symbols across files. Avoid duplicate exported function names.
- No hot reload workflow: rebuild, upload script + strings, restart server, then test.
- Portal log path on Windows: `C:\Users\<username>\AppData\Local\Temp\Battlefield 6\PortalLog.txt`.

## Documentation Map

- Project overview and gameplay: `README.md`.
- Proposed architectural refactor direction: `refactor_plan.md`.
- Additional template/utility notes: `.ai/bf6-portal-utils-knowledge.md`.
- Keep AGENTS concise; add deep implementation details to dedicated docs and link them here.
