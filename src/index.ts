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
}

let defaultCheckpointTime = 450;
let enablePayloadSound = true;
let pushProximityRadius = 5;
let waypointProximityRadius = 0.25;
let speedAdditionPerPushingPlayer = 0.005;
let payloadSpeedMultiplierT1 = 0.035;
let payloadSpeedMultiplierT2 = 0.015;
let speedAddition = 0;
let progress = 0;
let firstAttackerSpawned = false;
let payloadState = PayloadState.IDLE;
let payloadRotation = mod.EmptyArray();
let waypoints = new Map<number, PayloadWaypoint>();
let reachedWaypointIndex = 0;
let isOvertime: boolean = false;
let payloadObject = mod.GetSpatialObject(1);
let totalDistance = 0;
let lastWaypointDistance = 0;

function getOpponentTeam(team: mod.Team): mod.Team {
    const teamId = mod.GetObjId(team);
    return teamId === 1 ? mod.GetTeam(2) : mod.GetTeam(1);
}

function initProgressTracking(): void {
    for (let i = 0; i < waypoints.size - 1; i++) {
        totalDistance += mod.DistanceBetween(waypoints.get(i)!.position, waypoints.get(i + 1)!.position);
    }
}

function calculatePayloadProgress(): void {
    let traveledDistance = 0;

    for (let i = 0; i < reachedWaypointIndex; i++) {
        traveledDistance += mod.DistanceBetween(waypoints.get(i)!.position, waypoints.get(i + 1)!.position);
    }
    traveledDistance += mod.DistanceBetween(waypoints.get(reachedWaypointIndex)!.position, mod.GetObjectPosition(payloadObject));

    progress = traveledDistance / totalDistance;
}

export function OngoingGlobal(): void {

}
