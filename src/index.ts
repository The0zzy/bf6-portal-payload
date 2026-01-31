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
}

const CONFIG = {
    defaultCheckpointTime: 450,
    enablePayloadSound: true,
    pushProximityRadius: 5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.035,
    payloadSpeedMultiplierT2: 0.015,
    overtimeDuration: 60,
    overtimeEnabled: true,
}

const STATE = {
    speedAddition: 0,
    progress: 0,
    firstAttackerSpawned: false,
    payloadState: PayloadState.IDLE,
    payloadRotation: mod.EmptyArray(),
    waypoints: new Map<number, PayloadWaypoint>(),
    reachedWaypointIndex: 0,
    isOvertime: false,
    payloadObject: mod.GetSpatialObject(123456),
    totalDistance: 0,
    lastWaypointDistance: 0,
    lastReachedCheckpointIndex: 0,
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
    traveledDistance += mod.DistanceBetween(STATE.waypoints.get(STATE.reachedWaypointIndex)!.position, mod.GetObjectPosition(STATE.payloadObject));

    STATE.progress = traveledDistance / STATE.totalDistance;
}

function initPayloadTrack(): void {
    // Build track from spatial object ids 1000..1999
    let waypointIndex = 0;
    for (let i = 1000; i < 1999; i++) {
        const objPos = mod.GetObjectPosition(mod.GetSpatialObject(i));
        if (!(mod.XComponentOf(objPos) == 0 && mod.YComponentOf(objPos) == 0)) {
            let isCheckpoint = false;
            const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 2000));
            if (!(mod.XComponentOf(checkpointPos) == 0 && mod.YComponentOf(checkpointPos) == 0)) {
                isCheckpoint = true;
            }
            STATE.waypoints.set(waypointIndex, {
                position: objPos,
                isCheckpoint: isCheckpoint,
                rotation: mod.CreateVector(0, 0, 0)
            });
            waypointIndex++;
        }
    }
    STATE.reachedWaypointIndex = 0;
    STATE.lastReachedCheckpointIndex = 0;
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
    // Spawn payload object (door) at origin, identity rotation and scale
    STATE.payloadObject = mod.SpawnObject(
        mod.RuntimeSpawn_Common.MCOM,
        start.position,
        start.rotation,
        mod.CreateVector(1, 1, 1)
    ) as mod.SpatialObject;
    mod.AddUIIcon(
        STATE.payloadObject,
        mod.WorldIconImages.BombArmed,
        3,
        mod.CreateVector(0.3, 0.3, 0.3),
        mod.Message(mod.stringkeys.payload.objective.title)
    );
}

export async function OnGameModeStarted(): Promise<void> {
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
    const currentPos = mod.GetObjectPosition(STATE.payloadObject);
    const direction = mod.DirectionTowards(currentPos, targetPos);
    const moveDelta = mod.Multiply(direction, speed);
    const nextPos = mod.Add(currentPos, moveDelta);

    // Also update rotation based on the current waypoint logic
    const rotation = STATE.waypoints.get(STATE.reachedWaypointIndex)!.rotation;

    mod.MoveObject(STATE.payloadObject, nextPos, rotation);
}

export function OngoingGlobal(): void {
    if (!STATE.payloadObject) return;

    const currentPos = mod.GetObjectPosition(STATE.payloadObject);
    const counts = getAlivePlayersInProximity(currentPos, CONFIG.pushProximityRadius);

    if (counts.t1 > counts.t2) {
        // Push forward
        const targetWaypointIndex = STATE.reachedWaypointIndex + 1;
        const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
        const speed = CONFIG.payloadSpeedMultiplierT1 + (STATE.speedAddition * (counts.t1 - counts.t2));
        moveTowards(targetWaypoint.position, speed);
        STATE.payloadState = PayloadState.ADVANCING;

        if (mod.DistanceBetween(currentPos, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
            STATE.reachedWaypointIndex = targetWaypointIndex;
            if (targetWaypoint.isCheckpoint) {
                STATE.lastReachedCheckpointIndex = targetWaypointIndex;
            }
            if (targetWaypointIndex === STATE.waypoints.size - 1) {
                mod.EndGameMode(mod.GetTeam(1));
            }
        }

    } else if (counts.t2 > counts.t1) {
        // Push backward
        if (STATE.reachedWaypointIndex > STATE.lastReachedCheckpointIndex) {
            const currentWaypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
            const speed = CONFIG.payloadSpeedMultiplierT2 + (STATE.speedAddition * (counts.t2 - counts.t1));
            moveTowards(currentWaypoint.position, speed);
            STATE.payloadState = PayloadState.PUSHING_BACK;

            if (mod.DistanceBetween(currentPos, currentWaypoint.position) <= CONFIG.waypointProximityRadius) {
                STATE.reachedWaypointIndex--;
            }
        } else {
            // Check if we are precisely at the checkpoint or still moving back to it
            const lastCheckpoint = STATE.waypoints.get(STATE.lastReachedCheckpointIndex)!;
            if (mod.DistanceBetween(currentPos, lastCheckpoint.position) > CONFIG.waypointProximityRadius) {
                const speed = CONFIG.payloadSpeedMultiplierT2 + (STATE.speedAddition * (counts.t2 - counts.t1));
                moveTowards(lastCheckpoint.position, speed);
                STATE.payloadState = PayloadState.PUSHING_BACK;
            } else {
                STATE.payloadState = PayloadState.LOCKED;
            }
        }
    } else if (counts.t1 > 0 && counts.t2 > 0) {
        STATE.payloadState = PayloadState.CONTESTED;
    } else {
        STATE.payloadState = PayloadState.IDLE;
    }

    calculatePayloadProgress();
}

export function OnTimeLimitReached(): void {
    mod.EndGameMode(mod.GetTeam(2));
}