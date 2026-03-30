# Architectural Refactoring Plan

The purpose of this refactor is to solve module scoping issues and better organize the codebase by moving from explicit, standalone imported/exported functions to cleanly encapsulated Game Mode Classes. 

All classes belonging to this specific game mode will be prefixed with `Payload` (e.g., `PayloadCore`, `PayloadUI`, `PayloadScoring`) to support a future multi-mode experience. This will allow the main `index.ts` file to act strictly as a router that loads the relevant game mode classes during initialization.

## Proposed Strategy: Singleton vs. Static

Based on your feedback, here is the finalized split between Singletons and Static Classes:

### 1. The State (Singleton)
**`PayloadState`** will be a **Singleton**. 
Because state changes continuously during a match and needs to be completely reset if you were to switch modes without restarting the server, encapsulating it in an instantiable object makes sense.

```typescript
export class PayloadState {
    private static instance: PayloadState;
    public progress: number = 0;
    public waypoints: Map<number, PayloadWaypoint> = new Map();

    private constructor() {}

    public static getInstance(): PayloadState {
        if (!PayloadState.instance) {
            PayloadState.instance = new PayloadState();
        }
        return PayloadState.instance;
    }
}
```

### 2. The Config (Static Class)
**`PayloadConfig`** will be a **Static Class**. 
Since config data is mostly read-only definition data defined at compile time, there is no real benefit to making it an instantiable Singleton. Static classes are perfectly suited here and result in cleaner accessor code.

```typescript
export class PayloadConfig {
    public static readonly gameModeTime: number = 3600;
    public static payloadSpatials: SpatialConfig[] = [];
}

// Access is simple:
const time = PayloadConfig.gameModeTime;
```

### 3. The Controllers (Static Classes)
**`PayloadCore`, `PayloadUI`, `PayloadScoring`, `PayloadSounds`, `PayloadWeather`, `PayloadPlayerUI`** will be **Static Classes**.
Since these files act as pure function controllers manipulating the `PayloadState`, they do not need instantiation. They will simply group functions together neatly under a namespace.

```typescript
export class PayloadScoring {
    public static initScoreboard(): void {
        const state = PayloadState.getInstance();
        // logic
    }
}
```

## Proposed Changes

### Core Game Mode Logic

#### [MODIFY] `index.ts`
- The `index.ts` file will be stripped of game logic and will only contain the Portal engine event handlers (e.g., `OnGameModeStarted`, `OnPlayerJoinGame`).
- It will route these events cleanly:
```typescript
export function OnGameModeStarted(): void {
    PayloadCore.onGameModeStarted();
}
```

#### [NEW] `src/PayloadCore.ts`
- We will extract all the initialization (`initPayloadTrack`, `applyCheckpointFx`), loop logic (`executeEverySecond`), and mathematical **Spline Logic** (`catmullRom`, `getSplineTangent`) into `export class PayloadCore`. 

### Configuration and State

#### [NEW] `src/PayloadConfig.ts`
- Convert `config.ts` into a Static class to hold `gameModeTime`, `payloadVehicleType`, etc.

#### [NEW] `src/PayloadState.ts`
- Convert `state.ts` into a Singleton class to hold mutable state variables like `ticks`, `progress`, and `payloadPosition`.
- **CRITICAL FIX**: Move `overtime` and `gameOngoing` from `config.ts` into this `PayloadState` Singleton, as they are runtime variables modified during the match rather than strict read-only configuration.
- **CRITICAL FIX**: Move `payloadSpatials: SpatialConfig[]` from Config to State since it is populated dynamically at runtime based on engine discovery. Config will only hold standard defaults.

### Managers

All helper scripts will be encapsulated inside Static Classes.

#### [NEW] `src/PayloadScoring.ts`
- Wrap scoring functions into `export class PayloadScoring`.

#### [NEW] `src/PayloadPlayerUI.ts`
- Wrap logic into `export class PayloadPlayerUI`.

#### [NEW] `src/PayloadUI.ts`
- Wrap global UI logic into `export class PayloadUI`.

#### [NEW] `src/PayloadSounds.ts`
- Wrap sound and VO logic into `export class PayloadSounds`.

#### [NEW] `src/PayloadWeather.ts`
- Wrap weather toggles into `export class PayloadWeather`.

#### Cleanup
- Delete the old files (`state.ts`, `config.ts`, `ui.ts`, etc.) once logic is ported to the new `Payload...` prefixed files.
