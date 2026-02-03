import { initCheckpointTimer, updateCheckpointTimer, uiSetup } from './ui.ts';
import { CONFIG } from './config.ts';
import { STATE, PayloadState, type PayloadWaypoint } from './state.ts';


function getOpponentTeam(team: mod.Team): mod.Team {
    const teamId = mod.GetObjId(team);
    return teamId === 1 ? mod.GetTeam(2) : mod.GetTeam(1);
}

function calculatePayloadProgress(): void {
    let traveledDistance = 0;
    traveledDistance = STATE.waypoints.get(STATE.reachedWaypointIndex)!.distance;
    traveledDistance += mod.DistanceBetween(STATE.waypoints.get(STATE.reachedWaypointIndex)!.position, STATE.payloadPosition);
    STATE.progressInMeters = traveledDistance;
    STATE.progressInPercent = (traveledDistance / STATE.totalDistanceInMeters) * 100;
}

function initPayloadTrack(): void {
    // Build track from spatial object ids 1000..1999
    let waypointIndex = 0;
    let distance = 0;
    for (let i = 1000; i < 1999; i++) {
        const objPos = mod.GetObjectPosition(mod.GetSpatialObject(i));
        if (!(mod.XComponentOf(objPos) == 0 && mod.YComponentOf(objPos) == 0)) {
            let isCheckpoint = false;
            const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 1000));
            if (!(mod.XComponentOf(checkpointPos) == 0 && mod.YComponentOf(checkpointPos) == 0) || waypointIndex == 0) {
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
    STATE.totalDistanceInMeters = distance;
    STATE.reachedWaypointIndex = 0;
    STATE.reachedCheckpointIndex = 0;
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

function initSectors(): void {
    for (let i = 103; i < 199; i++) {
        mod.EnableGameModeObjective(mod.GetSector(i), false);
    }
    for (let i = 302; i < 399; i++) {
        mod.EnableHQ(mod.GetHQ(i), false);
    }
    for (let i = 402; i < 499; i++) {
        mod.EnableHQ(mod.GetHQ(i), false);
    }
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
    const direction = mod.DirectionTowards(STATE.payloadPosition, targetPos);
    const moveDelta = mod.Multiply(direction, speed);
    const nextPos = mod.Add(STATE.payloadPosition, moveDelta);
    STATE.payloadPosition = nextPos;
}

function onCheckpointReached(checkpointIndex: number): void {
    if (STATE.payloadState !== PayloadState.ADVANCING) {
        STATE.payloadState = PayloadState.LOCKED;
        return;
    } else {
        mod.EnableHQ(mod.GetHQ(checkpointIndex + 300), false);
        mod.EnableHQ(mod.GetHQ(checkpointIndex + 400), false);
        STATE.reachedCheckpointIndex = checkpointIndex;
        STATE.currentCheckpoint++;
        STATE.checkpointStartTime = mod.GetMatchTimeElapsed();
        mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 300), true);
        mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 400), true);
        mod.EnableGameModeObjective(mod.GetSector(STATE.currentCheckpoint + 101), true);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.checkpoint_reached, STATE.currentCheckpoint, STATE.maxCheckpoints));
    }
}

function setPayloadState(state: PayloadState): void {
    if (STATE.payloadState !== state) {
        STATE.payloadState = state;
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state[state]));
    }
}

function checkWaypointReached(targetWaypointIndex: number) {
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    if (mod.DistanceBetween(STATE.payloadPosition, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
        STATE.reachedWaypointIndex = targetWaypointIndex;
        if (targetWaypoint.isCheckpoint) {
            onCheckpointReached(STATE.currentCheckpoint);
        }
    }
}

function pushForward(counts: { t1: number; t2: number }) {
    const targetWaypointIndex = STATE.reachedWaypointIndex + 1;
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    const speed = CONFIG.payloadSpeedMultiplierT1 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t1 - counts.t2));
    moveTowards(targetWaypoint.position, speed);
    setPayloadState(PayloadState.ADVANCING);
    checkWaypointReached(targetWaypointIndex);
}

function pushBackward(counts: { t1: number; t2: number }) {
    const targetWaypointIndex = STATE.reachedWaypointIndex - 1;
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    const speed = CONFIG.payloadSpeedMultiplierT2 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t2 - counts.t1));
    moveTowards(targetWaypoint.position, speed);
    setPayloadState(PayloadState.PUSHING_BACK);
    checkWaypointReached(targetWaypointIndex);
}

function updatePayloadObject() {
    // Also update rotation based on the current waypoint logic
    const rotation = STATE.waypoints.get(STATE.reachedWaypointIndex)!.rotation;

    // does not work (visual object gets catapulted a far distance - getObjectPosition returns the same value as before the move)
    // mod.MoveObject(STATE.payloadObject!, moveDelta, rotation);

    // does not work (no movement at all [at least for the minimal movement delta 0.03, 0, 0.001])
    // mod.MoveObject(STATE.payloadObject!, moveDelta);

    // works (rotates by given value)
    // mod.RotateObject(STATE.payloadObject!, rotation);

    // works!!!
    mod.SetObjectTransform(STATE.payloadObject!, mod.CreateTransform(STATE.payloadPosition, rotation))

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

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(3600);
    mod.SetGameModeTargetScore(1000);
    initSectors();
    initPayloadTrack();
    initPayloadRotation();
    initPayloadObjective();

    STATE.checkpointStartTime = mod.GetMatchTimeElapsed();

    initCheckpointTimer(CONFIG.defaultCheckpointTime);
    uiSetup();
}

function onPayloadMoved() {
    calculatePayloadProgress();
    updatePayloadObject();
}

export function OngoingGlobal(): void {
    if (mod.GetMatchTimeElapsed() >= CONFIG.gameModeTime) {
        mod.EndGameMode(mod.GetTeam(2));
        return;
    }
    if (!STATE.payloadObject) return;

    const counts = getAlivePlayersInProximity(STATE.payloadPosition, CONFIG.pushProximityRadius);

    if (counts.t1 > counts.t2) {
        pushForward(counts);
        onPayloadMoved();
    } else if (counts.t2 > counts.t1) {
        pushBackward(counts);
        onPayloadMoved();
    } else if (counts.t1 > 0 && counts.t2 > 0) {
        setPayloadState(PayloadState.CONTESTED);
    } else {
        setPayloadState(PayloadState.IDLE);
    }

    if (counts.t1 > counts.t2) {
        // Push forward
        const targetWaypointIndex = STATE.reachedWaypointIndex + 1;
        const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
        const speed = CONFIG.payloadSpeedMultiplierT1 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t1 - counts.t2));
        moveTowards(targetWaypoint.position, speed);
        setPayloadState(PayloadState.ADVANCING);

        if (mod.DistanceBetween(STATE.payloadPosition, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
            STATE.reachedWaypointIndex = targetWaypointIndex;
            if (targetWaypoint.isCheckpoint) {
                onCheckpointReached(STATE.currentCheckpoint);
            }
            if (targetWaypointIndex === STATE.waypoints.size - 1) {
                mod.EndGameMode(mod.GetTeam(1));
            }
        }

    } else if (counts.t2 > counts.t1) {
        // Push backward
        if (STATE.reachedWaypointIndex > STATE.reachedCheckpointIndex) {
            const currentWaypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
            const speed = CONFIG.payloadSpeedMultiplierT2 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t2 - counts.t1));
            moveTowards(currentWaypoint.position, speed);
            setPayloadState(PayloadState.PUSHING_BACK);

            if (mod.DistanceBetween(STATE.payloadPosition, currentWaypoint.position) <= CONFIG.waypointProximityRadius) {
                STATE.reachedWaypointIndex--;
            }
        } else {
            // Check if we are precisely at the checkpoint or still moving back to it
            const lastCheckpoint = STATE.waypoints.get(STATE.reachedCheckpointIndex)!;
            if (mod.DistanceBetween(STATE.payloadPosition, lastCheckpoint.position) > CONFIG.waypointProximityRadius) {
                const speed = CONFIG.payloadSpeedMultiplierT2 + (CONFIG.speedAdditionPerPushingPlayer * (counts.t2 - counts.t1));
                moveTowards(lastCheckpoint.position, speed);
                setPayloadState(PayloadState.PUSHING_BACK);
            } else {
                setPayloadState(PayloadState.LOCKED);
            }
        }
    }

    // Update Checkpoint Timer
    const elapsedSinceCheckpoint = mod.GetMatchTimeElapsed() - STATE.checkpointStartTime;
    const remainingTime = CONFIG.defaultCheckpointTime - elapsedSinceCheckpoint;

    if (remainingTime <= 0) {
        mod.EndGameMode(mod.GetTeam(2));
        return;
    }

    updateCheckpointTimer(remainingTime);
}

// bugged...
// export function OnTimeLimitReached(): void {
//     mod.EndGameMode(mod.GetTeam(2));
// }