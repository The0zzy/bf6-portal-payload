enum PayloadState {
    IDLE,
    CONTESTED,
    ADVANCING,
    LOCKED,
    PUSHING_BACK
}

interface PayloadWaypoint {
    position: mod.Vector;
    isCheckpoint: boolean;
    rotation: mod.Vector;
    distance: number;
}

interface Config {
    gameModeTime: number;
    defaultCheckpointTime: number;
    enablePayloadSound: boolean;
    pushProximityRadius: number;
    waypointProximityRadius: number;
    speedAdditionPerPushingPlayer: number;
    payloadSpeedMultiplierT1: number;
    payloadSpeedMultiplierT2: number;
    overtimeDuration: number;
    overtimeEnabled: boolean;
    enableDebug: boolean;
}

interface State {
    speedAddition: number;
    progress: number;
    firstAttackerSpawned: boolean;
    payloadState: PayloadState;
    waypoints: Map<number, PayloadWaypoint>;
    reachedWaypointIndex: number;
    isOvertime: boolean;
    payloadObject: mod.Object | undefined;
    totalDistance: number;
    lastWaypointDistance: number;
    lastReachedCheckpointIndex: number;
    maxCheckpoints: number;
    currentCheckpoint: number;
}

const CONFIG: Config = {
    gameModeTime: 20 * 60,
    defaultCheckpointTime: 450,
    enablePayloadSound: true,
    pushProximityRadius: 5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.035,
    payloadSpeedMultiplierT2: 0.015,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
}

const STATE: State = {
    speedAddition: 0,
    progress: 0,
    firstAttackerSpawned: false,
    payloadState: PayloadState.IDLE,
    waypoints: new Map<number, PayloadWaypoint>(),
    reachedWaypointIndex: 0,
    isOvertime: false,
    payloadObject: undefined,
    totalDistance: 0,
    lastWaypointDistance: 0,
    lastReachedCheckpointIndex: 0,
    maxCheckpoints: 0,
    currentCheckpoint: 0,
}

function getOpponentTeam(team: mod.Team): mod.Team {
    const teamId = mod.GetObjId(team);
    return teamId === 1 ? mod.GetTeam(2) : mod.GetTeam(1);
}

function initProgressTracking(): void {
    for (let i = 0; i < STATE.waypoints.size - 1; i++) {
        STATE.totalDistance += mod.DistanceBetween(STATE.waypoints.get(i)!.position, STATE.waypoints.get(i + 1)!.position);
    }
}

function calculatePayloadProgress(): void {
    let traveledDistance = 0;

    for (let i = 0; i < STATE.reachedWaypointIndex; i++) {
        traveledDistance += mod.DistanceBetween(STATE.waypoints.get(i)!.position, STATE.waypoints.get(i + 1)!.position);
    }
    traveledDistance += mod.DistanceBetween(STATE.waypoints.get(STATE.reachedWaypointIndex)!.position, mod.GetObjectPosition(STATE.payloadObject!));

    STATE.progress = traveledDistance / STATE.totalDistance;
}

function initPayloadTrack(): void {
    // Build track from spatial object ids 1000..1999
    let waypointIndex = 0;
    let distance = 0;
    for (let i = 1000; i < 1999; i++) {
        const objPos = mod.GetObjectPosition(mod.GetSpatialObject(i));
        if (!(mod.XComponentOf(objPos) == 0 && mod.YComponentOf(objPos) == 0)) {
            let isCheckpoint = false;
            const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 2000));
            if (!(mod.XComponentOf(checkpointPos) == 0 && mod.YComponentOf(checkpointPos) == 0)) {
                isCheckpoint = true;
                STATE.maxCheckpoints++;
            }
            if (waypointIndex > 0) {
                distance += mod.DistanceBetween(STATE.waypoints.get(waypointIndex - 1)!.position, objPos);
            }
            STATE.waypoints.set(waypointIndex, {
                position: objPos,
                isCheckpoint: isCheckpoint,
                rotation: mod.CreateVector(0, 0, 0),
                distance: distance
            });
            waypointIndex++;
        }
    }
    STATE.totalDistance = distance;
    STATE.reachedWaypointIndex = 0;
    STATE.lastReachedCheckpointIndex = 0;
    STATE.currentCheckpoint = 1;
}

function initPayloadRotation(): void {
    for (let i = 0; i < STATE.waypoints.size - 1; i++) {
        const currentPos = STATE.waypoints.get(i)!.position;
        const nextPos = STATE.waypoints.get(i + 1)!.position;
        const direction = mod.DirectionTowards(currentPos, nextPos);
        const angle = mod.AngleBetweenVectors(mod.ForwardVector(), direction);
        const rotation = mod.CreateVector(0, angle, 0);
        STATE.waypoints.get(i)!.rotation = rotation;
    }
}

function initPayloadObjective(): void {
    const start = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
    STATE.payloadObject = mod.SpawnObject(
        mod.RuntimeSpawn_Common.MCOM,
        start.position,
        start.rotation,
        mod.CreateVector(1, 1, 1)
    );
    mod.Wait(1);
    mod.AddUIIcon(
        STATE.payloadObject!,
        mod.WorldIconImages.BombArmed,
        3,
        mod.CreateVector(0.3, 0.3, 0.3),
        mod.Message(mod.stringkeys.payload.objective.title),
        mod.GetTeam(1)
    );
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(3600);
    mod.SetGameModeTargetScore(1000);
    initPayloadTrack();
    initProgressTracking();
    initPayloadRotation();
    initPayloadObjective();
}

function getAlivePlayersInProximity(position: mod.Vector, radius: number): { t1: number; t2: number } {
    const players = mod.AllPlayers();
    let t1 = 0;
    let t2 = 0;
    const team1 = mod.GetTeam(1);
    const team2 = mod.GetTeam(2);

    for (let i = 0; i < mod.CountOf(players); i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            if (mod.DistanceBetween(position, playerPos) <= radius) {
                const team = mod.GetTeam(player);
                if (mod.Equals(team, team1)) {
                    t1++;
                } else if (mod.Equals(team, team2)) {
                    t2++;
                }
            }
        }
    }
    return { t1, t2 };
}

function moveTowards(targetPos: mod.Vector, speed: number): void {
    const currentPos = mod.GetObjectPosition(STATE.payloadObject!);

    const direction = mod.DirectionTowards(currentPos, targetPos);
    const moveDelta = mod.Multiply(direction, speed);
    const nextPos = mod.Add(currentPos, moveDelta);

    // Also update rotation based on the current waypoint logic
    const rotation = STATE.waypoints.get(STATE.reachedWaypointIndex)!.rotation;

    // does not work (visual object gets catapulted a far distance - getObjectPosition returns the same value as before the move)
    // mod.MoveObject(STATE.payloadObject!, moveDelta, rotation);

    // does not work (no movement at all [at least for the minimal movement delta 0.03, 0, 0.001])
    // mod.MoveObject(STATE.payloadObject!, moveDelta);

    // works (rotates by given value)
    // mod.RotateObject(STATE.payloadObject!, rotation);

    // works!!!
    mod.SetObjectTransform(STATE.payloadObject!, mod.CreateTransform(nextPos, rotation))

    // works but spawns new object every frame
    // 
    // mod.UnspawnObject(STATE.payloadObject!);
    // STATE.payloadObject = mod.SpawnObject(
    //     mod.RuntimeSpawn_Common.MCOM,
    //     nextPos,
    //     rotation,
    //     mod.CreateVector(1, 1, 1)
    // );
}

export function OngoingGlobal(): void {
    if (mod.GetMatchTimeElapsed() >= CONFIG.gameModeTime) {
        mod.EndGameMode(mod.GetTeam(2));
        return;
    }
    if (!STATE.payloadObject) return;

    const currentPos = mod.GetObjectPosition(STATE.payloadObject!);
    const counts = getAlivePlayersInProximity(currentPos, CONFIG.pushProximityRadius);

    if (counts.t1 > counts.t2) {
        // Push forward
        const targetWaypointIndex = STATE.reachedWaypointIndex + 1;
        const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
        const speed = CONFIG.payloadSpeedMultiplierT1 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t1 - counts.t2));
        moveTowards(targetWaypoint.position, speed);
        setPayloadState(PayloadState.ADVANCING);

        if (mod.DistanceBetween(currentPos, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
            STATE.reachedWaypointIndex = targetWaypointIndex;
            if (targetWaypoint.isCheckpoint) {
                STATE.lastReachedCheckpointIndex = targetWaypointIndex;
                STATE.currentCheckpoint++;
                mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.checkpoint_reached, STATE.currentCheckpoint, STATE.maxCheckpoints));
            }
            if (targetWaypointIndex === STATE.waypoints.size - 1) {
                mod.EndGameMode(mod.GetTeam(1));
            }
        }

    } else if (counts.t2 > counts.t1) {
        // Push backward
        if (STATE.reachedWaypointIndex > STATE.lastReachedCheckpointIndex) {
            const currentWaypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
            const speed = CONFIG.payloadSpeedMultiplierT2 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t2 - counts.t1));
            moveTowards(currentWaypoint.position, speed);
            setPayloadState(PayloadState.PUSHING_BACK);

            if (mod.DistanceBetween(currentPos, currentWaypoint.position) <= CONFIG.waypointProximityRadius) {
                STATE.reachedWaypointIndex--;
            }
        } else {
            // Check if we are precisely at the checkpoint or still moving back to it
            const lastCheckpoint = STATE.waypoints.get(STATE.lastReachedCheckpointIndex)!;
            if (mod.DistanceBetween(currentPos, lastCheckpoint.position) > CONFIG.waypointProximityRadius) {
                const speed = CONFIG.payloadSpeedMultiplierT2 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t2 - counts.t1));
                moveTowards(lastCheckpoint.position, speed);
                setPayloadState(PayloadState.PUSHING_BACK);
            } else {
                setPayloadState(PayloadState.LOCKED);
            }
        }
    } else if (counts.t1 > 0 && counts.t2 > 0) {
        setPayloadState(PayloadState.CONTESTED);
    } else {
        setPayloadState(PayloadState.IDLE);
    }

    calculatePayloadProgress();
}

function setPayloadState(state: PayloadState): void {
    if (STATE.payloadState !== state) {
        STATE.payloadState = state;
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state[state]));
    }
}

// bugged...
// export function OnTimeLimitReached(): void {
//     mod.EndGameMode(mod.GetTeam(2));
// }