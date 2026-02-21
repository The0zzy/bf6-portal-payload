import { updateCheckpointTimer, uiSetup, updateProgressUI, updateCheckpointUI, ui_onPlayerJoinGame, updateStatusUI, progressFlash, nukeUI } from './ui.ts';
import { initSounds, playCheckpointReachedSound, VOPushing, VOPushingBack, playNearEndMusic, playLowTimeVO, playNearEndVO, playPayloadReversingSound, playPayloadProgressingSound, endGameMusic } from './sounds.ts';
import { CONFIG } from './config.ts';
import { STATE, PayloadState, type PayloadWaypoint } from './state.ts';
import { scoring_initScoreboard, scoring_onPlayerDied, scoring_onPlayerEarnedAssist, scoring_awardObjectivePoints, scoring_onPlayerLeave, scoring_onPlayerRevived, scoring_refreshScoreboard, scoring_getOrCreatePlayerScore } from './scoring.ts';


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
        for (let o = 0; o < CONFIG.checkpointObjectives.length; o++) {
            const key = `${i}-${o}`;
            if (STATE.checkpointObjectives.has(key)) {
                mod.UnspawnObject(STATE.checkpointObjectives.get(key)!);
                STATE.checkpointObjectives.delete(key);
            }
            const objectiveConfig = CONFIG.checkpointObjectives[o];
            const spawnPos = mod.Add(waypoint.position, objectiveConfig.relativeOffset);
            const spawnRot = mod.Add(waypoint.rotation, objectiveConfig.rotation);
            const obj = mod.SpawnObject(
                objectiveConfig.prefab,
                spawnPos,
                spawnRot,
                objectiveConfig.scale
            ) as mod.CapturePoint;
            STATE.checkpointObjectives.set(key, obj);
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
        mod.SetVFXScale(vfx, vfxConfig.scale);
    });
}


function initPayloadRotation(): void {
    const defaultFacingDirection = mod.CreateVector(0, 0, 1);
    for (let i = 0; i < STATE.waypoints.size - 1; i++) {
        const currentPos = STATE.waypoints.get(i)!.position;
        const nextPos = STATE.waypoints.get(i + 1)!.position;
        const direction = mod.DirectionTowards(currentPos, nextPos);

        // Yaw: rotation around y-axis to face the next waypoint (horizontal plane)
        const directionXZ = mod.CreateVector(mod.XComponentOf(direction), 0, mod.ZComponentOf(direction));
        const yawAngle = mod.AngleBetweenVectors(defaultFacingDirection, directionXZ);
        const yawRadians = mod.DegreesToRadians(yawAngle);

        // Pitch: rotation around x-axis for uphill/downhill slope
        const dy = mod.YComponentOf(nextPos) - mod.YComponentOf(currentPos);
        const dx = mod.XComponentOf(nextPos) - mod.XComponentOf(currentPos);
        const dz = mod.ZComponentOf(nextPos) - mod.ZComponentOf(currentPos);
        const horizontalDist = mod.SquareRoot(dx * dx + dz * dz);
        const pitchRadians = horizontalDist > 0 ? -mod.ArctangentInRadians(dy / horizontalDist) : 0;

        const rotation = mod.CreateVector(pitchRadians, yawRadians, 0);
        STATE.waypoints.get(i)!.rotation = rotation;
    }
}

function initPayloadObjective(): void {
    const start = STATE.waypoints.get(STATE.reachedWaypointIndex)!;

    // Spawn VFX
    applyPayloadVfx();

    // Spawn Spatials if vehicle spawner is disabled
    if (!CONFIG.enableVehicleSpawner) {
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
// Convert tangent to 3D rotation (Pitch/Yaw)
// --------------------------
function rotationFromTangent(tangent: mod.Vector): mod.Vector {
    const tx = mod.XComponentOf(tangent);
    const ty = mod.YComponentOf(tangent);
    const tz = mod.ZComponentOf(tangent);

    // Yaw: horizontal facing direction
    const yaw = Math.atan2(tx, tz);

    // Pitch: slope angle from the tangent's vertical component
    const horizontalDist = Math.sqrt(tx * tx + tz * tz);
    const pitch = horizontalDist > 0.0001 ? -Math.atan2(ty, horizontalDist) : 0;

    return mod.CreateVector(pitch, yaw, 0);
}

// --------------------------
// Pre-compute spline table for all segments
// --------------------------
function precomputeSplineTable(): void {
    const wpCount = STATE.waypoints.size;
    const samplesPerSegment = CONFIG.splineSamplesPerSegment;

    for (let wpIndex = 0; wpIndex < wpCount - 1; wpIndex++) {
        const p0 = STATE.waypoints.get(Math.max(wpIndex - 1, 0))!.position;
        const p1 = STATE.waypoints.get(wpIndex)!.position;
        const p2 = STATE.waypoints.get(Math.min(wpIndex + 1, wpCount - 1))!.position;
        const p3 = STATE.waypoints.get(Math.min(wpIndex + 2, wpCount - 1))!.position;

        const samples: any[] = [];
        let cumDist = 0;
        let prevPos = catmullRom(p0, p1, p2, p3, 0);

        for (let i = 0; i <= samplesPerSegment; i++) {
            const t = i / samplesPerSegment;
            const pos = catmullRom(p0, p1, p2, p3, t);

            // Get rotation from tangent at this t
            const tNext = Math.min(t + 0.01, 1);
            const posNext = catmullRom(p0, p1, p2, p3, tNext);
            const tangent = mod.DirectionTowards(pos, posNext);
            const rotation = rotationFromTangent(tangent);

            if (i > 0) {
                cumDist += mod.DistanceBetween(prevPos, pos);
            }

            samples.push({
                position: pos,
                rotation: rotation,
                arcLength: cumDist
            });
            prevPos = pos;
        }
        STATE.splineTable.set(wpIndex, samples);
    }
}

// --------------------------
// Runtime spline lookup with lerp
// --------------------------
function lookupSplinePosition(wpIndex: number, distance: number): { position: mod.Vector; rotation: mod.Vector } {
    const samples = STATE.splineTable.get(wpIndex);
    if (!samples || samples.length === 0) {
        const wp = STATE.waypoints.get(wpIndex)!;
        return { position: wp.position, rotation: wp.rotation };
    }

    // Binary search for the two samples bracketing 'distance'
    let lo = 0, hi = samples.length - 1;
    if (distance <= 0) return { position: samples[0].position, rotation: samples[0].rotation };
    if (distance >= samples[hi].arcLength) return { position: samples[hi].position, rotation: samples[hi].rotation };

    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].arcLength <= distance) lo = mid;
        else hi = mid;
    }

    const a = samples[lo];
    const b = samples[hi];
    const segLen = b.arcLength - a.arcLength;
    const alpha = segLen > 0 ? (distance - a.arcLength) / segLen : 0;

    // Lerp position
    const position = mod.Add(
        mod.Multiply(a.position, 1 - alpha),
        mod.Multiply(b.position, alpha)
    );

    // Lerp rotation (handle yaw wrapping)
    const pitchA = mod.XComponentOf(a.rotation);
    const pitchB = mod.XComponentOf(b.rotation);
    const pitch = pitchA + (pitchB - pitchA) * alpha;

    const yawA = mod.YComponentOf(a.rotation);
    const yawB = mod.YComponentOf(b.rotation);
    const diff = ((yawB - yawA + Math.PI) % (2 * Math.PI)) - Math.PI;
    const yaw = yawA + diff * alpha;

    return { position, rotation: mod.CreateVector(pitch, yaw, 0) };
}

// --------------------------
// Move along spline with constant speed
// --------------------------
function moveAlongSpline(forward: boolean, speed: number) {
    let wpIndex = STATE.reachedWaypointIndex;
    const wpCount = STATE.waypoints.size;

    STATE.segmentDistance = STATE.segmentDistance || 0;
    STATE.segmentDistance += forward ? speed : -speed;

    // Clamp segmentDistance and switch waypoints
    while (true) {
        const samples = STATE.splineTable.get(wpIndex);
        if (!samples) break;

        const segmentLength = samples[samples.length - 1].arcLength;

        if (STATE.segmentDistance >= segmentLength && forward && wpIndex < wpCount - 1) {
            STATE.segmentDistance -= segmentLength;
            wpIndex++;
            STATE.reachedWaypointIndex = wpIndex;

            const wp = STATE.waypoints.get(wpIndex)!;
            if (wp.isCheckpoint) {
                STATE.reachedCheckpointIndex = wpIndex;
                STATE.currentCheckpoint++;
                onCheckpointReached();
            }
            continue;
        }

        if (STATE.segmentDistance <= 0 && !forward && wpIndex > 0) {
            wpIndex--;
            STATE.reachedWaypointIndex = wpIndex;

            const prevSamples = STATE.splineTable.get(wpIndex)!;
            STATE.segmentDistance += prevSamples[prevSamples.length - 1].arcLength;
            continue;
        }

        // Clamp to bounds
        if (wpIndex === wpCount - 1) STATE.segmentDistance = 0;
        if (wpIndex === 0 && STATE.segmentDistance < 0) STATE.segmentDistance = 0;

        const result = lookupSplinePosition(wpIndex, STATE.segmentDistance);
        STATE.payloadPosition = result.position;
        STATE.payloadRotation = result.rotation;
        break;
    }
}








function onCheckpointReached(): void {
    if (STATE.payloadState !== PayloadState.ADVANCING) return;

    mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 300), false);
    mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 400), false);

    playCheckpointReachedSound();
    updateCheckpointUI();
    applyCheckpointFx();
    mod.DisplayHighlightedWorldLogMessage(
        mod.Message(
            mod.stringkeys.payload.state.checkpoint_reached,
            STATE.currentCheckpoint,
            STATE.maxCheckpoints
        )
    );

    if (STATE.reachedWaypointIndex == STATE.waypoints.size - 1) {
        onFinalCheckpointReached();
    } else {
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

function checkWaypointReached(targetWaypointIndex: number) {
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    if (mod.DistanceBetween(STATE.payloadPosition, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
        STATE.reachedWaypointIndex = targetWaypointIndex;
        if (targetWaypoint.isCheckpoint) {
            STATE.reachedCheckpointIndex = targetWaypointIndex;
            STATE.currentCheckpoint++;
            onCheckpointReached();
        }
    }
}

function pushForward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t1.length - counts.t2.length);
    const speed = CONFIG.payloadSpeedMultiplierT1 + speedAddtion;
    moveAlongSpline(true, speed);
    setPayloadState(PayloadState.ADVANCING);
    VOPushing();
}

function pushBackward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    if (STATE.reachedWaypointIndex <= STATE.reachedCheckpointIndex) {
        setPayloadState(PayloadState.LOCKED);
        return;
    }
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t2.length - counts.t1.length);
    const speed = CONFIG.payloadSpeedMultiplierT2 + speedAddtion;
    moveAlongSpline(false, speed);
    setPayloadState(PayloadState.PUSHING_BACK);
    VOPushingBack();
}


function updatePayloadObject() {
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
        respawnPayloadSpatials();
    }

    // Update Checkpoint Timer
    const elapsedSinceCheckpoint = STATE.lastElapsedSeconds - STATE.checkpointStartTime;
    const remainingTime = CONFIG.defaultCheckpointTime - elapsedSinceCheckpoint;
    updateCheckpointTimer(remainingTime);
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
    const rotation = waypoint.rotation;

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
    endGameMusic(1);
    if (STATE.payloadVehicle) {
        mod.Kill(STATE.payloadVehicle as mod.Vehicle);
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
    precomputeSplineTable();
    applyCheckpointFx();
    initPayloadRotation();
    initPayloadObjective();
    initSounds();
    scoring_initScoreboard();

    STATE.checkpointStartTime = mod.GetMatchTimeElapsed();

    uiSetup();
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

    if (STATE.lastElapsedSeconds != Math.floor(elapsedSeconds)) {
        STATE.lastElapsedSeconds = Math.floor(elapsedSeconds);
        // Award objective points to all players in proximity of the payload
        for (const p of counts.t1) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }
        for (const p of counts.t2) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }
        executeEverySecond();
    }

    if (counts.t1.length > counts.t2.length) {
        pushForward(counts);
        onPayloadMoved();
    } else if (counts.t2.length > counts.t1.length) {
        pushBackward(counts);
        onPayloadMoved();
    } else if (counts.t1.length > 0 && counts.t2.length > 0) {
        setPayloadState(PayloadState.CONTESTED);
    } else {
        setPayloadState(PayloadState.IDLE);
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




