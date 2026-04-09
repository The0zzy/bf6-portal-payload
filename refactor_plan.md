# Architectural Refactoring Plan

The purpose of this refactor is to solve module scoping issues and better organize the codebase by moving from explicit,
standalone imported/exported functions to cleanly encapsulated Game Mode Classes.

All classes belonging to this specific game mode will be prefixed with `Payload` (e.g., `PayloadCore`, `PayloadUI`,
`PayloadScoring`) to support a future multi-mode experience. This will allow the main `index.ts` file to act strictly as
a router that loads the relevant game mode classes during initialization.

## Proposed Strategy: Singleton vs. Static

Based on your feedback, here is the finalized split between Singletons and Static Classes:

### 1. The State (Singleton)

**`PayloadState`** will be a **Singleton**. Because state changes continuously during a match and needs to be completely
reset if you were to switch modes without restarting the server, encapsulating it in an instantiable object makes sense.

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

**`PayloadConfig`** will be a **Static Class**. Since config data is mostly read-only definition data defined at compile
time, there is no real benefit to making it an instantiable Singleton. Static classes are perfectly suited here and
result in cleaner accessor code.

```typescript
export class PayloadConfig {
    public static readonly gameModeTime: number = 3600;
    public static payloadSpatials: SpatialConfig[] = [];
}

// Access is simple:
const time = PayloadConfig.gameModeTime;
```

### 3. The Controllers (Static Classes)

**`PayloadCore`, `PayloadUI`, `PayloadScoring`, `PayloadSounds`, `PayloadWeather`, `PayloadPlayerUI`** will be **Static
Classes**. Since these files act as pure function controllers manipulating the `PayloadState`, they do not need
instantiation. They will simply group functions together neatly under a namespace.

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

- The `index.ts` file will be refactored to remove all direct game logic and instead route events to the relevant game
  mode classes (in future different game modes might be initialized based on some conditions).
- For event routing it will use the "events" module from `bf6-portal-utils` to keep it clean and organized.
- Example:

```typescript
import { Events } from 'bf6-portal-utils';
import { Payload } from './Payload.ts';

Events.OnGameModeStarted.subscribe(() => {
    Payload.init();
});
```

#### [NEW] `src/Payload.ts`

- This file will act as the main router and initializer for the Payload game mode. It will import all the `Payload...`
  classes and call their relevant initialization functions during the appropriate events.
- The central `Payload.init()` will take care of subscribing to the necessary Portal events and routing them to the
  correct handlers in the respective classes.

#### [NEW] `src/PayloadCore.ts`

- We will extract all the initialization (`initPayloadTrack`, `applyCheckpointFx`), loop logic (`executeEverySecond`),
  and mathematical **Spline Logic** (`catmullRom`, `getSplineTangent`) into `export class PayloadCore`.

### Configuration and State

#### [NEW] `src/PayloadConfig.ts`

- Convert `config.ts` into a Static class to hold `gameModeTime`, `payloadVehicleType`, etc.

#### [NEW] `src/PayloadState.ts`

- Convert `state.ts` into a Singleton class to hold mutable state variables like `ticks`, `progress`, and
  `payloadPosition`.
- **CRITICAL FIX**: Move `overtime` and `gameOngoing` from `config.ts` into this `PayloadState` Singleton, as they are
  runtime variables modified during the match rather than strict read-only configuration.
- **CRITICAL FIX**: Move `payloadSpatials: SpatialConfig[]` from Config to State since it is populated dynamically at
  runtime based on engine discovery. Config will only hold standard defaults.

### Managers

All helper scripts will be encapsulated inside Static Classes.

#### [NEW] `src/PayloadScoring.ts`

- Wrap scoring functions into `export class PayloadScoring`.

#### [NEW] `src/PayloadUI.ts`

- Wrap global UI logic into `export class PayloadUI`.
- **CRITICAL FIX**: Since player UI and global UI are often intertwined, we will merge `playerUI.ts` into `ui.ts` to
  avoid unnecessary fragmentation and cross-file dependencies. The new `PayloadUI` class will handle both global and
  per-player UI logic in a cohesive manner.
    - the current player UI logic uses `mod.ObjectVariable` and `mod.GetVariable` to store per-player UI references,
      which is discouraged due to `any` type. We will refactor this to use a Map inside the `PayloadState` class for
      better type safety and organization.
    - The map will be structured like the player map used for scoring, with player IDs as keys and their respective UI
      references as values. The map type could therefore be merged with the player map in scoring to a "PlayerData" type
      since they share the same keys.

#### [NEW] `src/PayloadSounds.ts`

- Wrap sound and VO logic into `export class PayloadSounds`.

#### [NEW] `src/PayloadWeather.ts`

- Wrap weather toggles into `export class PayloadWeather`.

## Architecture Migration Strategy

The new class based architecture shall be implemented in a subfolder `src/Payload/` to allow for a clean migration
without disrupting the existing codebase. The migration will be done as follows:

- Create the new class filesand move the existing code into them without changing any logic beside mentioned fixes. At
  maximum the function names can be changed to be more consistent with the class structure (e.g., `initPayloadTrack`
  could become `PayloadCore.initTrack`).
- move the current `index.ts` file to `old_index.ts` and create a new `index.ts` that imports the new `Payload` class
  and routes events to it.
- comment all code in `old_index.ts` in order for the bundler and lint to not complain about duplicate symbols. We will
  keep it around for reference during the migration and testing phase.
- Once the new architecture is fully implemented and tested, we can remove the old files.
- update AGENTS.md documentation to reflect the new architecture and guidelines for contributing to the codebase.

## Additional Refactoring Log

- make waypoints an array instead of map since we don't actually need the key value pair and it simplifies the code. We can just find the waypoint by its index in the array.
- remove the vehicle logic
- add helper function isSpatialValid()
- config for payload speed parameters per team instead of a single config, to allow for asymmetrical game mode design in the future
- move the game mode time limit and target score config to the config file and use them in the core logic instead of hardcoding them
- store players in proximity in state instead of passing to other functions as parameters, since they are needed in multiple places and it simplifies the function signatures
- review PayloadCore
  - re-order and rename functions
  - remove maxCheckPoints, currentCheckpoint variables as they are redundant since we can just use the checkpointIndexes array and the reachedCheckpointIndex variable to get the same information
  - fix spawning only one capture point for next cehckpoint
  - remove void prefixes for functions as they don't add any benefit beside silencing some linter warnings that actually don't matter in our case since we don't care about return values for these functions in general and it just adds unnecessary noise to the code
  - use global PayloadState.instance - might as well go for public static variables in the PayloadState class instead of using a singleton pattern with getInstance() since we don't actually need multiple instances of the state and it simplifies the code even further. This way we can just access PayloadState.progress instead of PayloadState.getInstance().progress which is unnecessarily verbose for no real benefit
- set gameOngoing to true after initialization and not immediately when loading the state class, to avoid potential issues with the state being loaded but the game mode not actually being initialized yet

## Additional Todos

- make VO for progress dynamic and not based on hard checkpoints

### Questions

- why do we explicitly disable man down state onplayerundeployed?
- why do we only force revive but not deploy a player in end screen?
- why do we wait 3 seconds after the game mode starts to initialize sectors and payload track? Can we do it immediately or at least reduce the delay?
- why are sector/HQ ids such odd numbers? 103 instead of 100?
- do we have an overview of spatial id ranges and their usage?
- why is there a generic wait after player deploy before we do anything? 
- are weapon and gadget restrictions correctly working (e.g. Spawn Beacon)?
- review playArea attribute of a player as it doesn't seem to be relevant for the oob logic?