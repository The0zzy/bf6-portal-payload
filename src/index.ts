import { updateCheckpointTimer, uiSetup, updateProgressUI, updateCheckpointUI, ui_onPlayerJoinGame, updateStatusUI, progressFlash, nukeUI, updateDebugUI } from './ui.ts';
import { initSounds, playCheckpointReachedSound, VOPushing, VOPushingBack, playNearEndMusic, playLowTimeVO, playNearEndVO, playPayloadReversingSound, playPayloadProgressingSound, endGameMusic, playPayloadIdleSound, stopPayloadSound, updateSoundPositions } from './sounds.ts';
import { CONFIG } from './config.ts';
import { STATE, PayloadState, type PayloadWaypoint } from './state.ts';
import { scoring_initScoreboard, scoring_onPlayerDied, scoring_onPlayerEarnedAssist, scoring_awardObjectivePoints, scoring_onPlayerLeave, scoring_onPlayerRevived, scoring_refreshScoreboard, scoring_getOrCreatePlayerScore } from './scoring.ts';
import { initWeather } from './weather.ts';

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
        if (!(mod.XComponentOf(objPos) == 0 || mod.YComponentOf(objPos) == 0 || mod.ZComponentOf(objPos) == 0)) {
            let isCheckpoint = false;
            const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 1000));
            if (!(mod.XComponentOf(checkpointPos) == 0 || mod.YComponentOf(checkpointPos) == 0 || mod.ZComponentOf(checkpointPos) == 0)) {
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

    // If the first waypoint is not a checkpoint, make it one to ensure a first checkpoint
    const firstWaypoint = STATE.waypoints.get(0);
    if (firstWaypoint && !firstWaypoint.isCheckpoint) {
        firstWaypoint.isCheckpoint = true;
        STATE.maxCheckpoints++;
    }

    // If the last waypoint is not a checkpoint, make it one to ensure a final checkpoint
    const lastWaypoint = STATE.waypoints.get(STATE.waypoints.size - 1);
    if (lastWaypoint && !lastWaypoint.isCheckpoint) {
        lastWaypoint.isCheckpoint = true;
        STATE.maxCheckpoints++;
    }

    STATE.totalDistanceInMeters = distance;
    STATE.reachedWaypointIndex = 0;
    STATE.reachedCheckpointIndex = 0;
    STATE.checkpointIndexes = [];
    for (let i = 0; i < STATE.waypoints.size; i++) {
        const waypoint = STATE.waypoints.get(i)!;
        if (waypoint.isCheckpoint) {
            STATE.checkpointIndexes.push(i);
        }
    }
    STATE.currentCheckpoint = 1;
    STATE.payloadPosition = STATE.waypoints.get(0)!.position;
}

function applyCheckpointFx(): void {
    for (let i = 0; i < STATE.waypoints.size; i++) {
        const waypoint = STATE.waypoints.get(i)!;
        if (!waypoint.isCheckpoint) continue;

        // Spawn Spatials
        for (let s = 0; s < CONFIG.checkpointSpatials.length; s++) {
            const key = `${i}-${s}`;
            if (STATE.checkpointSpatials.has(key)) {
                mod.UnspawnObject(STATE.checkpointSpatials.get(key)!);
                STATE.checkpointSpatials.delete(key);
            }
            const spatialConfig = CONFIG.checkpointSpatials[s];
            const spawnPos = mod.Add(waypoint.position, spatialConfig.relativeOffset);
            const spawnRot = mod.Add(waypoint.rotation, spatialConfig.rotation);
            const obj = mod.SpawnObject(
                spatialConfig.prefab,
                spawnPos,
                spawnRot,
                spatialConfig.scale
            );
            STATE.checkpointSpatials.set(key, obj);
        }

        // Spawn Objectives
        // limit to the next checkpoint to be reached only
        for (let o = 0; o < CONFIG.checkpointObjectives.length; o++) {
            const key = `${i}-${o}`;
            if (STATE.checkpointObjectives.has(key)) {
                mod.UnspawnObject(STATE.checkpointObjectives.get(key)!);
                STATE.checkpointObjectives.delete(key);
            }
            if (STATE.currentCheckpoint < STATE.checkpointIndexes.length && STATE.checkpointIndexes[STATE.currentCheckpoint] === i) {
                const objectiveConfig = CONFIG.checkpointObjectives[o];
                const spawnPos = mod.Add(waypoint.position, objectiveConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, objectiveConfig.rotation);
                const obj = mod.SpawnObject(
                    objectiveConfig.prefab,
                    spawnPos,
                    spawnRot,
                    objectiveConfig.scale
                );
                STATE.checkpointObjectives.set(key, obj);
            }
        }

        for (let v = 0; v < CONFIG.checkpointVfx.length; v++) {
            const key = `${i}-${v}`;
            if (STATE.checkpointVfx.has(key)) {
                mod.UnspawnObject(STATE.checkpointVfx.get(key)!);
                STATE.checkpointVfx.delete(key);
            }
            const vfxConfig = CONFIG.checkpointVfx[v];
            const color = STATE.reachedCheckpointIndex < i ? vfxConfig.color1 : vfxConfig.color2;
            const spawnPos = mod.Add(waypoint.position, vfxConfig.relativeOffset);
            const spawnRot = mod.Add(waypoint.rotation, vfxConfig.rotation);
            const vfx = mod.SpawnObject(
                vfxConfig.prefab,
                spawnPos,
                spawnRot,
                mod.CreateVector(1, 1, 1)
            ) as mod.VFX;
            STATE.checkpointVfx.set(key, vfx);
            mod.EnableVFX(vfx, true);
            mod.SetVFXScale(vfx, vfxConfig.scale);
            mod.SetVFXColor(vfx, color);
            mod.SetVFXSpeed(vfx, vfxConfig.speed);
        }
    }
}

function applyPayloadVfx(): void {
    CONFIG.payloadVfx.forEach((vfxConfig, i) => {
        const wp = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
        const spawnPos = mod.Add(wp.position, vfxConfig.relativeOffset);
        const spawnRot = mod.Add(wp.rotation, vfxConfig.rotation);
        if (STATE.payloadVfx.has(i)) {
            mod.UnspawnObject(STATE.payloadVfx.get(i)!);
            STATE.payloadVfx.delete(i);
        }
        const vfx = mod.SpawnObject(
            vfxConfig.prefab,
            spawnPos,
            spawnRot,
            mod.CreateVector(1, 1, 1)
        ) as mod.VFX;
        STATE.payloadVfx.set(i, vfx);
        mod.EnableVFX(vfx, true);
        mod.SetVFXColor(vfx, vfxConfig.color1);
        mod.SetVFXSpeed(vfx, vfxConfig.speed);
        mod.SetVFXScale(vfx, 10);
    });
}


function initPayloadRotation(): void {
    const wpCount = STATE.waypoints.size;
    for (let i = 0; i < wpCount; i++) {
        const prevIndex = Math.max(i - 1, 0);
        const nextIndex = Math.min(i + 1, wpCount - 1);
        const nextNextIndex = Math.min(i + 2, wpCount - 1);

        const p0 = STATE.waypoints.get(prevIndex)!.position;
        const p1 = STATE.waypoints.get(i)!.position;
        const p2 = STATE.waypoints.get(nextIndex)!.position;
        const p3 = STATE.waypoints.get(nextNextIndex)!.position;

        const tangent = getSplineTangent(p0, p1, p2, p3, 0);
        const rotation = getRotationFromTangent(tangent, false);

        STATE.waypoints.get(i)!.rotation = rotation;

        if (i === 0) {
            STATE.payloadRotation = rotation;
        }
    }
}

function initPayloadObjective(): void {
    const start = STATE.waypoints.get(STATE.reachedWaypointIndex)!;

    // Spawn VFX
    applyPayloadVfx();

    // Spawn Spatials if vehicle spawner is disabled
    if (!CONFIG.enableVehicleSpawner) {
        for (const payloadSpatialId of CONFIG.payloadSpatialIdentifiers) {
            const payloadIdentifierObject = mod.GetSpatialObject(payloadSpatialId);
            const payloadIdentifierPos = mod.GetObjectPosition(payloadIdentifierObject);
            let payloadDetected = false;
            if (!(mod.XComponentOf(payloadIdentifierPos) == 0 || mod.YComponentOf(payloadIdentifierPos) == 0 || mod.ZComponentOf(payloadIdentifierPos) == 0)) {
                payloadDetected = true;
            }
            else {
                payloadDetected = false;
            }
            if (payloadDetected && payloadSpatialId === 5000) {
                CONFIG.payloadSpatials.push(
                    {
                        prefab: mod.RuntimeSpawn_Abbasid.GM1083CargoTruck_01_Canopy,
                        relativeOffset: mod.CreateVector(0, -0.1, 0),
                        scale: mod.CreateVector(1, 1, 1),
                        rotation: mod.CreateVector(0, 0, 0)
                    }
                );
            }
            if (payloadDetected && payloadSpatialId === 5001) {
                CONFIG.payloadSpatials.push(
                    {
                        prefab: mod.RuntimeSpawn_Tungsten.GM1083CargoTruck_01_Canopy_Cargo01,
                        relativeOffset: mod.CreateVector(0, -0.1, 0),
                        scale: mod.CreateVector(1, 1, 1),
                        rotation: mod.CreateVector(0, 0, 0)
                    }
                );
            }
        }

        for (let i = 0; i < CONFIG.payloadSpatials.length; i++) {
            const spatialConfig = CONFIG.payloadSpatials[i];
            const spawnPos = mod.Add(start.position, spatialConfig.relativeOffset);
            const spawnRot = mod.Add(start.rotation, spatialConfig.rotation);
            const obj = mod.SpawnObject(
                spatialConfig.prefab,
                spawnPos,
                spawnRot,
                spatialConfig.scale
            );
            STATE.payloadSpatials.set(i, obj);
        }
    }

    // Always Spawn Objectives
    for (let i = 0; i < CONFIG.payloadObjectives.length; i++) {
        const objectiveConfig = CONFIG.payloadObjectives[i];
        const spawnPos = mod.Add(start.position, objectiveConfig.relativeOffset);
        const spawnRot = mod.Add(start.rotation, objectiveConfig.rotation);
        const obj = mod.SpawnObject(
            objectiveConfig.prefab,
            spawnPos,
            spawnRot,
            objectiveConfig.scale
        );
        STATE.payloadObjectives.set(i, obj);
    }

    if (CONFIG.enableVehicleSpawner) {
        const vehicleSpawner = mod.SpawnObject(
            mod.RuntimeSpawn_Common.VehicleSpawner,
            start.position,
            start.rotation,
            mod.CreateVector(1, 1, 1)
        ) as mod.VehicleSpawner;
        mod.SetVehicleSpawnerVehicleType(vehicleSpawner, CONFIG.payloadVehicleType); //Marauder - This is bugged so spawning another vehicle instead
        mod.ForceVehicleSpawnerSpawn(vehicleSpawner);
    }
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
    if (!CONFIG.enableVehicleSpawner) return;
    const vehiclePosition = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    if (mod.DistanceBetween(STATE.waypoints.get(0)!.position, vehiclePosition) < 5) {
        STATE.payloadVehicle = eventVehicle;
        mod.SetVehicleMaxHealthMultiplier(eventVehicle, 5);
    }
}

export function OngoingVehicle(eventVehicle: mod.Vehicle): void {
    if (!CONFIG.enableVehicleSpawner) return;
    if (STATE.payloadVehicle && mod.GetObjId(eventVehicle) == mod.GetObjId(STATE.payloadVehicle)) {
        mod.Heal(eventVehicle, 100);
    }
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

function getAlivePlayersInProximity(position: mod.Vector, radius: number): { t1: mod.Player[]; t2: mod.Player[] } {
    const players = mod.AllPlayers();
    let t1: mod.Player[] = [];
    let t2: mod.Player[] = [];
    const team1 = mod.GetTeam(1);
    const team2 = mod.GetTeam(2);
    const playerCount = mod.CountOf(players);

    for (let i = 0; i < playerCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            if (mod.DistanceBetween(position, playerPos) <= radius) {
                const team = mod.GetTeam(player);
                if (mod.Equals(team, team1)) {
                    t1.push(player);
                } else if (mod.Equals(team, team2)) {
                    t2.push(player);
                }
            }
        }
    }
    return { t1, t2 };
}






// --------------------------
// Catmull-Rom spline
// --------------------------
function catmullRom(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, t: number): mod.Vector {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (
        (2 * mod.XComponentOf(p1)) +
        (-mod.XComponentOf(p0) + mod.XComponentOf(p2)) * t +
        (2 * mod.XComponentOf(p0) - 5 * mod.XComponentOf(p1) + 4 * mod.XComponentOf(p2) - mod.XComponentOf(p3)) * t2 +
        (-mod.XComponentOf(p0) + 3 * mod.XComponentOf(p1) - 3 * mod.XComponentOf(p2) + mod.XComponentOf(p3)) * t3
    );

    const y = 0.5 * (
        (2 * mod.YComponentOf(p1)) +
        (-mod.YComponentOf(p0) + mod.YComponentOf(p2)) * t +
        (2 * mod.YComponentOf(p0) - 5 * mod.YComponentOf(p1) + 4 * mod.YComponentOf(p2) - mod.YComponentOf(p3)) * t2 +
        (-mod.YComponentOf(p0) + 3 * mod.YComponentOf(p1) - 3 * mod.YComponentOf(p2) + mod.YComponentOf(p3)) * t3
    );

    const z = 0.5 * (
        (2 * mod.ZComponentOf(p1)) +
        (-mod.ZComponentOf(p0) + mod.ZComponentOf(p2)) * t +
        (2 * mod.ZComponentOf(p0) - 5 * mod.ZComponentOf(p1) + 4 * mod.ZComponentOf(p2) - mod.ZComponentOf(p3)) * t2 +
        (-mod.ZComponentOf(p0) + 3 * mod.ZComponentOf(p1) - 3 * mod.ZComponentOf(p2) + mod.ZComponentOf(p3)) * t3
    );

    return mod.CreateVector(x, y, z);
}

// --------------------------
// Get t for a given distance along spline
// --------------------------
function getTForDistanceDynamic(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, distance: number, samples: number = 30) {
    let lastPos = catmullRom(p0, p1, p2, p3, 0);
    let accumulated = 0;

    if (distance <= 0) return 0;

    for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const pos = catmullRom(p0, p1, p2, p3, t);
        const segment = mod.DistanceBetween(lastPos, pos);
        accumulated += segment;
        if (accumulated >= distance) {
            const overshoot = accumulated - distance;
            const alpha = 1 - overshoot / segment;
            const tPrev = (i - 1) / samples;
            return tPrev + alpha * (t - tPrev);
        }
        lastPos = pos;
    }

    return 1;
}

// --------------------------
// Approximate tangent
// --------------------------
function getSplineTangent(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, t: number): mod.Vector {
    const t2 = t * t;

    const dx = 0.5 * (
        (-mod.XComponentOf(p0) + mod.XComponentOf(p2)) +
        2 * (2 * mod.XComponentOf(p0) - 5 * mod.XComponentOf(p1) + 4 * mod.XComponentOf(p2) - mod.XComponentOf(p3)) * t +
        3 * (-mod.XComponentOf(p0) + 3 * mod.XComponentOf(p1) - 3 * mod.XComponentOf(p2) + mod.XComponentOf(p3)) * t2
    );

    const dy = 0.5 * (
        (-mod.YComponentOf(p0) + mod.YComponentOf(p2)) +
        2 * (2 * mod.YComponentOf(p0) - 5 * mod.YComponentOf(p1) + 4 * mod.YComponentOf(p2) - mod.YComponentOf(p3)) * t +
        3 * (-mod.YComponentOf(p0) + 3 * mod.YComponentOf(p1) - 3 * mod.YComponentOf(p2) + mod.YComponentOf(p3)) * t2
    );

    const dz = 0.5 * (
        (-mod.ZComponentOf(p0) + mod.ZComponentOf(p2)) +
        2 * (2 * mod.ZComponentOf(p0) - 5 * mod.ZComponentOf(p1) + 4 * mod.ZComponentOf(p2) - mod.ZComponentOf(p3)) * t +
        3 * (-mod.ZComponentOf(p0) + 3 * mod.ZComponentOf(p1) - 3 * mod.ZComponentOf(p2) + mod.ZComponentOf(p3)) * t2
    );

    return mod.CreateVector(dx, dy, dz);
}

// --------------------------
// Convert tangent to Y-rotation (signed, stable)
// --------------------------
function getRotationFromTangent(tangent: mod.Vector, useSmoothing: boolean = true): mod.Vector {

    const x = mod.XComponentOf(tangent);
    const y = mod.YComponentOf(tangent);
    const z = mod.ZComponentOf(tangent);

    // Prevent zero-length issues
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length < 0.0001) {
        return STATE.payloadRotation ?? mod.CreateVector(0, 0, 0);
    }

    // Normalize manually (safer)
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;

    // Yaw (turn left/right)
    const yaw = Math.atan2(nx, nz);

    // Pitch (tilt up/down)
    const pitch = -Math.asin(ny);

    // Roll (keep zero for tank)
    const roll = 0;

    // Optional smoothing
    if (useSmoothing && STATE.payloadRotation) {

        const prevPitch = mod.XComponentOf(STATE.payloadRotation);
        const prevYaw = mod.YComponentOf(STATE.payloadRotation);

        const smoothFactor = 0.1;

        const diff = (yaw - prevYaw + Math.PI) % (2 * Math.PI);
        const wrappedDiff = (diff < 0 ? diff + (2 * Math.PI) : diff) - Math.PI;
        const smoothYaw = prevYaw + wrappedDiff * smoothFactor;

        const pitchDiff = (pitch - prevPitch + Math.PI) % (2 * Math.PI);
        const wrappedPitchDiff = (pitchDiff < 0 ? pitchDiff + (2 * Math.PI) : pitchDiff) - Math.PI;
        const smoothPitch = prevPitch + wrappedPitchDiff * smoothFactor;

        return mod.CreateVector(smoothPitch, smoothYaw, roll);
    }

    return mod.CreateVector(pitch, yaw, roll);
}


// --------------------------
// Move along spline with constant speed
// --------------------------
function moveAlongSpline(forward: boolean, speed: number) {
    let wpIndex = STATE.reachedWaypointIndex;
    const wpCount = STATE.waypoints.size;

    if (wpIndex >= wpCount - 1 && forward) {
        return;
    }

    STATE.segmentDistance = STATE.segmentDistance || 0;
    STATE.segmentDistance += forward ? speed : -speed;

    // Clamp segmentDistance and switch waypoints
    while (true) {
        const prevIndex = Math.max(wpIndex - 1, 0);
        const nextIndex = Math.min(wpIndex + 1, wpCount - 1);
        const nextNextIndex = Math.min(nextIndex + 1, wpCount - 1);

        const prevWp = STATE.waypoints.get(prevIndex);
        const currWp = STATE.waypoints.get(wpIndex);
        const nextWp = STATE.waypoints.get(nextIndex);
        const nextNextWp = STATE.waypoints.get(nextNextIndex);
        if (!prevWp || !currWp || !nextWp || !nextNextWp) break;

        const p0 = prevWp.position;
        const p1 = currWp.position;
        const p2 = nextWp.position;
        const p3 = nextNextWp.position;

        const segmentLength = mod.DistanceBetween(p1, p2);

        if (wpIndex >= wpCount - 1) {
            STATE.segmentDistance = 0;
            STATE.payloadPosition = p1;
            break;
        }

        if (STATE.segmentDistance >= segmentLength && forward && wpIndex < wpCount - 1) {
            STATE.segmentDistance -= segmentLength;
            wpIndex = nextIndex;
            STATE.reachedWaypointIndex = wpIndex;

            if (nextWp.isCheckpoint && STATE.reachedCheckpointIndex < nextIndex) {
                STATE.reachedCheckpointIndex = nextIndex;
                STATE.currentCheckpoint++;
                onCheckpointReached();
            }
            continue;
        }

        if (STATE.segmentDistance <= 0 && !forward && wpIndex > 0) {
            wpIndex = wpIndex - 1;
            STATE.reachedWaypointIndex = wpIndex;

            const prevWpPos = STATE.waypoints.get(wpIndex)?.position!;
            const currWpPos = STATE.waypoints.get(wpIndex + 1)?.position!;
            STATE.segmentDistance += mod.DistanceBetween(prevWpPos, currWpPos);
            continue;
        }

        // Compute t along current segment
        const t = getTForDistanceDynamic(p0, p1, p2, p3, STATE.segmentDistance);

        STATE.payloadPosition = catmullRom(p0, p1, p2, p3, t);
        const tangent = getSplineTangent(p0, p1, p2, p3, t);
        STATE.payloadRotation = getRotationFromTangent(tangent);
        break;
    }
}








function onCheckpointReached(): void {
    if (STATE.payloadState !== PayloadState.ADVANCING) return;

    playCheckpointReachedSound();

    if (STATE.reachedWaypointIndex == STATE.waypoints.size - 1) {
        onFinalCheckpointReached();
    } else {
        mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 300), false);
        mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 400), false);

        updateCheckpointUI();
        applyCheckpointFx();
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.checkpoint_reached, STATE.currentCheckpoint - 1, STATE.maxCheckpoints - 1));
        STATE.checkpointStartTime = mod.GetMatchTimeElapsed();

        mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 300), true);
        mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 400), true);
        mod.EnableGameModeObjective(mod.GetSector(STATE.currentCheckpoint + 101), true);
    }
}

function setPayloadState(state: PayloadState): void {
    if (STATE.payloadState !== state) {
        STATE.payloadState = state;
        onPayloadStateChanged();
    }
}

function onPayloadStateChanged(): void {
    updateStatusUI();
}

function pushForward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    if (STATE.reachedWaypointIndex >= STATE.waypoints.size - 1) {
        setPayloadState(PayloadState.LOCKED);
        playPayloadIdleSound();
        return;
    }
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t1.length - counts.t2.length);
    const speed = (CONFIG.payloadSpeedT1 + speedAddtion) / STATE.tickrate;
    setPayloadState(PayloadState.ADVANCING);
    moveAlongSpline(true, speed);
    VOPushing();
}

function pushBackward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    if (STATE.reachedWaypointIndex <= (STATE.reachedCheckpointIndex - 1) || (STATE.reachedWaypointIndex == 0 && (STATE.segmentDistance || 0) <= 0)) {
        if (STATE.reachedWaypointIndex == 0 && (STATE.segmentDistance || 0) < 0) {
            STATE.segmentDistance = 0;
        }
        setPayloadState(PayloadState.LOCKED);
        return;
    }
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t2.length - counts.t1.length);
    const speed = (CONFIG.payloadSpeedT2 + speedAddtion) / STATE.tickrate;
    setPayloadState(PayloadState.PUSHING_BACK);
    moveAlongSpline(false, speed);
    VOPushingBack();
}


function updatePayloadObject() {
    const waypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
    //const rotation = waypoint.rotation;
    const rotation = STATE.payloadRotation;

    // Update VFX
    STATE.payloadVfx.forEach((vfx, index) => {
        const config = CONFIG.payloadVfx[index];
        const worldPos = mod.Add(STATE.payloadPosition, config.relativeOffset);
        const worldRot = mod.Add(rotation, config.rotation);
        mod.MoveVFX(vfx, worldPos, worldRot);
    });

    // Update Spatials
    STATE.payloadSpatials.forEach((obj, index) => {
        const config = CONFIG.payloadSpatials[index];
        const worldPos = mod.Add(STATE.payloadPosition, config.relativeOffset);
        const worldRot = mod.Add(rotation, config.rotation);
        mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
    });

    // Update Objectives
    STATE.payloadObjectives.forEach((obj, index) => {
        const config = CONFIG.payloadObjectives[index];
        const worldPos = mod.Add(STATE.payloadPosition, config.relativeOffset);
        const worldRot = mod.Add(rotation, config.rotation);
        mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
    });

    if (STATE.payloadVehicle) {
        mod.Teleport(STATE.payloadVehicle, STATE.payloadPosition, mod.YComponentOf(rotation));
    }
}

function onPayloadMoved() {
    calculatePayloadProgress();
    updatePayloadObject();
    updateProgressUI();
    if (STATE.progressInPercent > 90) {
        playNearEndMusic();
        playNearEndVO();
    }
}

function executeEverySecond() {
    if (STATE.lastElapsedSeconds >= CONFIG.gameModeTime) {
        onRunningOutOfTime();
        return;
    }

    // Unspawn and respawn spatial objects to force update/refresh
    if (STATE.lastElapsedSeconds % CONFIG.spatialRespawnInterval === 0) {
        if (STATE.progressInPercent < 100) {
            respawnPayloadSpatials();
        }
    }

    // Update Checkpoint Timer
    const elapsedSinceCheckpoint = STATE.lastElapsedSeconds - STATE.checkpointStartTime;
    const remainingTime = CONFIG.defaultCheckpointTime - elapsedSinceCheckpoint;
    if (STATE.progressInPercent < 100) {
        updateCheckpointTimer(remainingTime);
    }
    if (remainingTime <= 0) {
        onRunningOutOfTime();
        return;
    }
    if (remainingTime <= 60) {
        playNearEndMusic();
        playLowTimeVO();
    }
    if (STATE.payloadState == PayloadState.ADVANCING) {
        playPayloadProgressingSound(STATE.payloadPosition);
    }
    if (STATE.payloadState == PayloadState.PUSHING_BACK) {
        playPayloadReversingSound(STATE.payloadPosition);
    }
    progressFlash();
}

function respawnPayloadSpatials() {
    const waypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
    const rotation = STATE.payloadRotation;

    STATE.payloadSpatials.forEach((obj, index) => {
        mod.UnspawnObject(obj);

        const config = CONFIG.payloadSpatials[index];
        const worldPos = mod.Add(STATE.payloadPosition, config.relativeOffset);
        const worldRot = mod.Add(rotation, config.rotation);

        const newObj = mod.SpawnObject(
            config.prefab,
            worldPos,
            worldRot,
            config.scale
        );
        STATE.payloadSpatials.set(index, newObj);
    });
}

async function onFinalCheckpointReached() {
    mod.PauseGameModeTime(true);
    playPayloadIdleSound();
    endGameMusic(1);
    if (STATE.payloadVehicle) {
        mod.Kill(STATE.payloadVehicle as mod.Vehicle);
    } else {
        STATE.payloadObjectives.forEach((obj) => {
            mod.UnspawnObject(obj);
        });
        STATE.payloadVfx.forEach((vfx) => {
            mod.UnspawnObject(vfx);
        });
    }
    nukeUI();
    await mod.Wait(8);
    mod.EndGameMode(mod.GetTeam(1));
}

function onRunningOutOfTime() {
    endGameMusic(2);
    mod.EndGameMode(mod.GetTeam(2));
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(3600);
    mod.SetGameModeTargetScore(1000);
    mod.Wait(3);
    initSectors();
    initPayloadTrack();
    applyCheckpointFx();
    initPayloadRotation();
    initPayloadObjective();
    initSounds();
    scoring_initScoreboard();

    STATE.checkpointStartTime = mod.GetMatchTimeElapsed();

    uiSetup();
    initWeather();
}

export function OnPlayerDied(victim: mod.Player, killer: mod.Player): void {
    scoring_onPlayerDied(victim, killer);
}

export function OnPlayerEarnedKillAssist(player: mod.Player, assistOn: mod.Player): void {
    scoring_onPlayerEarnedAssist(player);
}

export function OnPlayerLeaveGame(playerId: number): void {
    scoring_onPlayerLeave(playerId);
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    scoring_getOrCreatePlayerScore(eventPlayer);
    ui_onPlayerJoinGame();
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const score = scoring_getOrCreatePlayerScore(eventPlayer);
    if (!score.hasDeployed) {
        score.hasDeployed = true;
        scoring_refreshScoreboard();
        applyCheckpointFx();
        applyPayloadVfx();
    }
}

export function OnRevived(victim: mod.Player, reviver: mod.Player): void {
    scoring_onPlayerRevived(victim, reviver);
}

export function OngoingGlobal(): void {
    const elapsedSeconds = mod.GetMatchTimeElapsed();
    const counts = getAlivePlayersInProximity(STATE.payloadPosition, CONFIG.pushProximityRadius);

    if (counts.t1.length > counts.t2.length) {
        pushForward(counts);
        onPayloadMoved();
    } else if (counts.t2.length > counts.t1.length) {
        pushBackward(counts);
        onPayloadMoved();
    } else if (counts.t1.length > 0 && counts.t2.length > 0) {
        setPayloadState(PayloadState.CONTESTED);
        playPayloadIdleSound();
    } else {
        setPayloadState(PayloadState.IDLE);
        playPayloadIdleSound();
    }

    updateSoundPositions();

    if (STATE.lastElapsedSeconds != Math.floor(elapsedSeconds)) {
        STATE.lastElapsedSeconds = Math.floor(elapsedSeconds);
        // Award objective points to all players in proximity of the payload
        for (const p of counts.t1) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }
        for (const p of counts.t2) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }

        // update tickrate
        STATE.pastTickRates.shift();
        STATE.pastTickRates.push(STATE.ticks);
        // smooth out (avg)
        const newTickrate = STATE.pastTickRates.reduce((a, b) => a + b) / STATE.pastTickRates.length;
        // only apply if the change is significant
        if (newTickrate != STATE.tickrate && Math.abs(newTickrate - STATE.tickrate) > 5) {
            STATE.tickrate = newTickrate;
        }
        STATE.ticks = 0;
        executeEverySecond();
    }
    STATE.ticks++;
    if (CONFIG.enableDebug) {
        updateDebugUI();
    }
}

//Force remove players from payload vehicle
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    if (mod.CompareVehicleName(eventVehicle, mod.VehicleList.M2Bradley)) { //Direct comparison not working: eventVehicle == STATE.payloadVehicle as mod.Vehicle
        mod.ForcePlayerExitVehicle(mod.GetVehicleFromPlayer(eventPlayer));
        mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.payload.objective.exit_message), eventPlayer);
    }
}

// Team Switcher for testing
export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) return;
    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsCrouching)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
    ) {
        mod.SetTeam(eventPlayer, mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(2)) ? mod.GetTeam(1) : mod.GetTeam(2));
    }
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInVehicle)) {
        if (mod.CompareVehicleName(mod.GetVehicleFromPlayer(eventPlayer), mod.VehicleList.M2Bradley)) { //Direct comparison not working: eventVehicle == STATE.payloadVehicle as mod.Vehicle
            mod.ForcePlayerExitVehicle(mod.GetVehicleFromPlayer(eventPlayer));
            mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.payload.objective.exit_message), eventPlayer);
        }
    }
}




