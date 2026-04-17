import { PayloadConfig } from './PayloadConfig.ts';
import { PayloadState, PayloadMovementState } from './PayloadState.ts';
import { PayloadScoring } from './PayloadScoring.ts';
import { PayloadSounds } from './PayloadSounds.ts';
import { PayloadUI } from './PayloadUI.ts';
import { PayloadWeather } from './PayloadWeather.ts';

/**
 * Manages the core gameplay logic for the Payload game mode.
 * 
 * Handles initialization and updates for:
 * - Payload track waypoints and checkpoint system
 * - Payload movement along spline curves
 * - Visual effects and spatial objects positioning
 * - Game state management (advancing, idle, contested, etc.)
 * - Player proximity detection for payload pushing mechanics
 * - Objective scoring and time management
 * 
 * @class PayloadCore
 * @static
 */
export class PayloadCore {

    public static init(): void {
        mod.SetGameModeTimeLimit(PayloadConfig.maxGameModeTime);
        mod.SetGameModeTargetScore(PayloadConfig.gameModeTargetScore);
        PayloadCore.initSectors();
        PayloadCore.initPayloadTrack();
        PayloadCore.initPayloadRotation();
        PayloadCore.initPayloadObjects();
        PayloadSounds.init();
        PayloadScoring.initScoreboard();

        PayloadUI.setup();
        PayloadWeather.init();
        PayloadCore.applyCheckpointFx();

        PayloadState.instance.checkpointStartTime = mod.GetMatchTimeElapsed();
        PayloadState.instance.gameOngoing = true;
    }

    private static initSectors(): void {
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

    private static initPayloadTrack(): void {
        let waypointIndex = 0;
        let distance = 0;
        for (
            let waypointSpatialId = 1000;
            waypointSpatialId < 1999;
            waypointSpatialId++
        ) {
            if (PayloadCore.isSpatialValid(waypointSpatialId)) {
                const isCheckpoint = PayloadCore.isSpatialValid(waypointSpatialId + 1000);
                const waypointPosition = mod.GetObjectPosition(
                    mod.GetSpatialObject(waypointSpatialId)
                );
                if (waypointIndex > 0) {
                    distance += mod.DistanceBetween(
                        PayloadState.instance.waypoints[waypointIndex - 1].position,
                        waypointPosition
                    );
                }
                PayloadState.instance.waypoints.push({
                    position: waypointPosition,
                    isCheckpoint,
                    rotation: mod.CreateVector(0, 0, 0),
                    distance
                });
                waypointIndex++;
            }
        }

        // Ensure first and last waypoints are checkpoints
        const firstWaypoint = PayloadState.instance.waypoints[0];
        if (firstWaypoint && !firstWaypoint.isCheckpoint) {
            firstWaypoint.isCheckpoint = true;
        }

        const lastWaypoint = PayloadState.instance.waypoints[PayloadState.instance.waypoints.length - 1];
        if (lastWaypoint && !lastWaypoint.isCheckpoint) {
            lastWaypoint.isCheckpoint = true;
        }

        PayloadState.instance.totalDistanceInMeters = distance;
        PayloadState.instance.reachedWaypointIndex = 0;
        PayloadState.instance.reachedCheckpointIndex = 0;
        PayloadState.instance.checkpointIndexes = [];
        for (let i = 0; i < PayloadState.instance.waypoints.length; i++) {
            const waypoint = PayloadState.instance.waypoints[i];
            if (waypoint.isCheckpoint) {
                PayloadState.instance.checkpointIndexes.push(i);
            }
        }
        PayloadState.instance.payloadPosition = PayloadState.instance.waypoints[0].position;
    }

    private static initPayloadRotation(): void {
        const wpCount = PayloadState.instance.waypoints.length;
        for (let i = 0; i < wpCount; i++) {
            const prevIndex = Math.max(i - 1, 0);
            const nextIndex = Math.min(i + 1, wpCount - 1);
            const nextNextIndex = Math.min(i + 2, wpCount - 1);

            const p0 = PayloadState.instance.waypoints[prevIndex].position;
            const p1 = PayloadState.instance.waypoints[i].position;
            const p2 = PayloadState.instance.waypoints[nextIndex].position;
            const p3 = PayloadState.instance.waypoints[nextNextIndex].position;

            const tangent = PayloadCore.getSplineTangent(p0, p1, p2, p3, 0);
            const rotation = PayloadCore.getRotationFromTangent(tangent, false);

            PayloadState.instance.waypoints[i].rotation = rotation;

            if (i === 0) {
                PayloadState.instance.payloadRotation = rotation;
            }
        }
    }

    private static initPayloadObjects(): void {
        PayloadCore.initPayloadSpatials();
        PayloadCore.updatePayloadObjects(true);
    }

    private static initPayloadSpatials(): void {
        PayloadState.instance.payloadSpatialsConfig = [];
        for (const payloadSpatialId of PayloadConfig.payloadSpatialIdentifiers) {
            if (PayloadCore.isSpatialValid(payloadSpatialId) && payloadSpatialId === 5000) {
                PayloadState.instance.payloadSpatialsConfig.push(
                    {
                        prefab: mod.RuntimeSpawn_Abbasid.GM1083CargoTruck_01_Canopy,
                        relativeOffset: mod.CreateVector(0, -0.1, 0),
                        scale: mod.CreateVector(1, 1, 1),
                        rotation: mod.CreateVector(0, 0, 0)
                    }
                );
            }
            if (PayloadCore.isSpatialValid(payloadSpatialId) && payloadSpatialId === 5001) {
                PayloadState.instance.payloadSpatialsConfig.push(
                    {
                        prefab: mod.RuntimeSpawn_Tungsten.GM1083CargoTruck_01_Canopy_Cargo01,
                        relativeOffset: mod.CreateVector(0, -0.1, 0),
                        scale: mod.CreateVector(1, 1, 1),
                        rotation: mod.CreateVector(0, 0, 0)
                    }
                );
            }
        }
    }

    private static updatePayloadSpatials(respawn: boolean): void {
        PayloadState.instance.payloadSpatialsConfig.forEach((config, i) => {
            const spawnPos = mod.Add(PayloadState.instance.payloadPosition, config.relativeOffset);
            const spawnRot = mod.Add(PayloadState.instance.payloadRotation, config.rotation);
            let obj = PayloadState.instance.payloadSpatials.get(i);
            if (respawn) {
                if (obj) {
                    mod.UnspawnObject(obj);
                }
                obj = mod.SpawnObject(
                    config.prefab,
                    spawnPos,
                    spawnRot,
                    config.scale
                ) as mod.Object;
                PayloadState.instance.payloadSpatials.set(i, obj);
            }
            if (obj) {
                mod.SetObjectTransform(obj, mod.CreateTransform(spawnPos, spawnRot));
            }
        });
    }

    private static updatePayloadObjectives(respawn: boolean): void {
        PayloadConfig.payloadObjectives.forEach((objectiveConfig, i) => {
            const spawnPos = mod.Add(PayloadState.instance.payloadPosition, objectiveConfig.relativeOffset);
            const spawnRot = mod.Add(PayloadState.instance.payloadRotation, objectiveConfig.rotation);
            let obj = PayloadState.instance.payloadObjectives.get(i);
            if (respawn) {
                if (obj) {
                    mod.UnspawnObject(obj);
                }
                obj = mod.SpawnObject(
                    objectiveConfig.prefab,
                    spawnPos,
                    spawnRot,
                    objectiveConfig.scale
                );
                mod.SetMCOMOwner(obj as mod.MCOM, mod.GetTeam(1));
                PayloadState.instance.payloadObjectives.set(i, obj as mod.Object);
            }
            if (obj) {
                mod.SetObjectTransform(obj, mod.CreateTransform(spawnPos, spawnRot));
            }
        });
    }

    public static updatePayloadVfx(respawn: boolean): void {
        PayloadConfig.payloadVfx.forEach((vfxConfig, i) => {
            const spawnPos = mod.Add(PayloadState.instance.payloadPosition, vfxConfig.relativeOffset);
            const spawnRot = mod.Add(PayloadState.instance.payloadRotation, vfxConfig.rotation);
            let vfx = PayloadState.instance.payloadVfx.get(i);
            if (respawn) {
                if (vfx) {
                    mod.UnspawnObject(vfx);
                }
                vfx = mod.SpawnObject(
                    vfxConfig.prefab,
                    spawnPos,
                    spawnRot,
                    mod.CreateVector(vfxConfig.scale, vfxConfig.scale, vfxConfig.scale)
                ) as mod.VFX;
                mod.EnableVFX(vfx, true);
                mod.SetVFXColor(vfx, vfxConfig.color1);
                mod.SetVFXSpeed(vfx, vfxConfig.speed);
                mod.SetVFXScale(vfx, vfxConfig.scale);
                PayloadState.instance.payloadVfx.set(i, vfx);
            }
            if (vfx) {
                mod.MoveVFX(vfx, spawnPos, spawnRot);
            }
        });
    }

    public static executeEveryTick(): void {
        if (!PayloadState.instance.gameOngoing) return;

        PayloadState.instance.ticks++;

        PayloadCore.getAlivePlayersInProximity();

        const playersTeam1 = PayloadState.instance.playersInPushProximity.get(1)!;
        const playersTeam2 = PayloadState.instance.playersInPushProximity.get(2)!;

        if (playersTeam1.length > playersTeam2.length) {
            PayloadCore.pushPayload(1, 2, true);
            PayloadCore.onPayloadMoved();
            PayloadState.instance.overtime = true;
        } else if (playersTeam2.length > playersTeam1.length) {
            PayloadCore.pushPayload(2, 1, false);
            PayloadCore.onPayloadMoved();
            PayloadState.instance.overtime = false;
        } else if (playersTeam1.length > 0 && playersTeam2.length > 0) {
            PayloadCore.setPayloadState(PayloadMovementState.CONTESTED);
            PayloadSounds.playPayloadIdleSound();
            PayloadState.instance.overtime = true;
        } else {
            PayloadCore.setPayloadState(PayloadMovementState.IDLE);
            PayloadSounds.playPayloadIdleSound();
            PayloadState.instance.overtime = false;
        }

        const elapsedSeconds = Math.floor(mod.GetMatchTimeElapsed());
        if (PayloadState.instance.lastElapsedSeconds != elapsedSeconds) {
            PayloadState.instance.lastElapsedSeconds = elapsedSeconds;
            PayloadCore.updateTickrate();
            PayloadCore.executeEverySecond();
        }

        PayloadUI.updatePlayerCountUI();
        PayloadUI.updateDebugUI();
        PayloadUI.animateProgressFlash();
    }

    private static executeEverySecond(): void {
        if (PayloadState.instance.lastElapsedSeconds >= PayloadConfig.maxGameModeTime && !PayloadState.instance.overtime) {
            PayloadCore.onRunningOutOfTime();
            return;
        }

        if (PayloadState.instance.lastElapsedSeconds % PayloadConfig.spatialRespawnInterval === 0 &&
            PayloadState.instance.gameOngoing
        ) {
            PayloadCore.updatePayloadSpatials(true);
        }

        const remainingTime = (
            PayloadConfig.defaultCheckpointTime -
            (
                PayloadState.instance.lastElapsedSeconds -
                PayloadState.instance.checkpointStartTime
            )
        );
        if (PayloadState.instance.progressInPercent < 100) {
            PayloadUI.updateCheckpointTimer(remainingTime);
        }
        if (remainingTime <= 0 && !PayloadState.instance.overtime) {
            PayloadCore.onRunningOutOfTime();
            return;
        }
        if (remainingTime <= 60) {
            PayloadSounds.playNearEndMusic();
            PayloadSounds.playLowTimeVO();
        }

        const playersTeam1 = PayloadState.instance.playersInPushProximity.get(1)!;
        const playersTeam2 = PayloadState.instance.playersInPushProximity.get(2)!;

        for (const p of playersTeam1) {
            if (PayloadState.instance.payloadState == PayloadMovementState.ADVANCING) {
                PayloadSounds.playPayloadProgressingSound(p);
                PayloadScoring.awardObjectivePoints(p, PayloadConfig.objectiveScorePerSecond);
            } else if (PayloadState.instance.payloadState == PayloadMovementState.PUSHING_BACK) {
                PayloadSounds.playPayloadReversingSound(p);
            }
        }
        for (const p of playersTeam2) {
            if (PayloadState.instance.payloadState == PayloadMovementState.PUSHING_BACK) {
                PayloadSounds.playPayloadProgressingSound(p);
                PayloadScoring.awardObjectivePoints(p, PayloadConfig.objectiveScorePerSecond);
            } else if (PayloadState.instance.payloadState == PayloadMovementState.ADVANCING) {
                PayloadSounds.playPayloadReversingSound(p);
            }
        }

        PayloadUI.triggerProgressFlash();
    }

    private static updateTickrate(): void {
        PayloadState.instance.pastTickRates.shift();
        PayloadState.instance.pastTickRates.push(PayloadState.instance.ticks);
        const newTickrate = PayloadState.instance.pastTickRates.reduce((a, b) => a + b) / PayloadState.instance.pastTickRates.length;
        if (newTickrate != PayloadState.instance.tickrate && Math.abs(newTickrate - PayloadState.instance.tickrate) > 5) {
            PayloadState.instance.tickrate = newTickrate;
        }
        PayloadState.instance.ticks = 0;
    }

    public static isSpatialValid(spatial: number | mod.SpatialObject): boolean {
        const obj = typeof spatial === 'number' ? mod.GetSpatialObject(spatial) : spatial;
        if (!obj) return false;
        const pos = mod.GetObjectPosition(obj);
        return !(
            Math.abs(mod.XComponentOf(pos)) < 1 &&
            Math.abs(mod.YComponentOf(pos)) < 1 &&
            Math.abs(mod.ZComponentOf(pos)) < 1
        );
    }

    private static calculatePayloadProgress(): void {
        let traveledDistance = 0;
        traveledDistance = PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex].distance;
        traveledDistance += mod.DistanceBetween(PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex].position, PayloadState.instance.payloadPosition);
        PayloadState.instance.progressInMeters = traveledDistance;
        PayloadState.instance.progressInPercent = (traveledDistance / PayloadState.instance.totalDistanceInMeters) * 100;
    }

    public static applyCheckpointFx(): void {
        const reachedCheckpointWpIndex = PayloadState.instance.checkpointIndexes[
            PayloadState.instance.reachedCheckpointIndex
        ];
        for (const checkpointWpIndex of PayloadState.instance.checkpointIndexes) {
            const waypoint = PayloadState.instance.waypoints[checkpointWpIndex];
            for (let s = 0; s < PayloadConfig.checkpointSpatials.length; s++) {
                const key = `${checkpointWpIndex}-${s}`;
                if (PayloadState.instance.checkpointSpatials.has(key)) {
                    mod.UnspawnObject(PayloadState.instance.checkpointSpatials.get(key)!);
                    PayloadState.instance.checkpointSpatials.delete(key);
                }
                const spatialConfig = PayloadConfig.checkpointSpatials[s];
                const spawnPos = mod.Add(waypoint.position, spatialConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, spatialConfig.rotation);
                const obj = mod.SpawnObject(
                    spatialConfig.prefab,
                    spawnPos,
                    spawnRot,
                    spatialConfig.scale
                );
                PayloadState.instance.checkpointSpatials.set(key, obj);
            }

            for (let o = 0; o < PayloadConfig.checkpointObjectives.length; o++) {
                const key = `${checkpointWpIndex}-${o}`;
                if (PayloadState.instance.checkpointObjectives.has(key)) {
                    mod.UnspawnObject(PayloadState.instance.checkpointObjectives.get(key)!);
                    PayloadState.instance.checkpointObjectives.delete(key);
                }

                const objectiveConfig = PayloadConfig.checkpointObjectives[o];
                const spawnPos = mod.Add(waypoint.position, objectiveConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, objectiveConfig.rotation);
                const obj = mod.SpawnObject(
                    objectiveConfig.prefab,
                    spawnPos,
                    spawnRot,
                    objectiveConfig.scale
                ) as mod.CapturePoint;
                const owner: mod.Team = checkpointWpIndex <= reachedCheckpointWpIndex ? mod.GetTeam(1) : mod.GetTeam(2);
                mod.SetCapturePointOwner(obj, owner);
                PayloadState.instance.checkpointObjectives.set(key, obj);
            }

            for (let v = 0; v < PayloadConfig.checkpointVfx.length; v++) {
                const key = `${checkpointWpIndex}-${v}`;
                if (PayloadState.instance.checkpointVfx.has(key)) {
                    mod.UnspawnObject(PayloadState.instance.checkpointVfx.get(key)!);
                    PayloadState.instance.checkpointVfx.delete(key);
                }
                const vfxConfig = PayloadConfig.checkpointVfx[v];
                const color = checkpointWpIndex > reachedCheckpointWpIndex ? vfxConfig.color1 : vfxConfig.color2;
                const spawnPos = mod.Add(waypoint.position, vfxConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, vfxConfig.rotation);
                const vfx = mod.SpawnObject(
                    vfxConfig.prefab,
                    spawnPos,
                    spawnRot,
                    mod.CreateVector(vfxConfig.scale, vfxConfig.scale, vfxConfig.scale)
                ) as mod.VFX;
                PayloadState.instance.checkpointVfx.set(key, vfx);
                mod.EnableVFX(vfx, true);
                mod.SetVFXScale(vfx, vfxConfig.scale);
                mod.SetVFXColor(vfx, color);
                mod.SetVFXSpeed(vfx, vfxConfig.speed);
            }
        }
    }

    private static getAlivePlayersInProximity(): void {
        PayloadState.instance.playersInPushProximity.clear();
        // reset proximity lists for both default teams
        PayloadState.instance.playersInPushProximity.set(1, []);
        PayloadState.instance.playersInPushProximity.set(2, []);
        const players = mod.AllPlayers();
        const playerCount = mod.CountOf(players);

        for (let i = 0; i < playerCount; i++) {
            const player = mod.ValueInArray(players, i) as mod.Player;
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                if (mod.DistanceBetween(PayloadState.instance.payloadPosition, playerPos) <= PayloadConfig.pushProximityRadius) {
                    const teamId = mod.GetObjId(mod.GetTeam(player));
                    // in case there are more than 2 teams, add them to the map as well
                    if (!PayloadState.instance.playersInPushProximity.has(teamId)) {
                        PayloadState.instance.playersInPushProximity.set(teamId, []);
                    }
                    PayloadState.instance.playersInPushProximity.get(teamId)!.push(player);
                }
            }
        }
    }

    private static catmullRom(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, t: number): mod.Vector {
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

    private static getTForDistanceDynamic(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, distance: number, samples: number = 30): number {
        let lastPos = PayloadCore.catmullRom(p0, p1, p2, p3, 0);
        let accumulated = 0;

        if (distance <= 0) return 0;

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const pos = PayloadCore.catmullRom(p0, p1, p2, p3, t);
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

    private static getSplineTangent(p0: mod.Vector, p1: mod.Vector, p2: mod.Vector, p3: mod.Vector, t: number): mod.Vector {
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

    private static getRotationFromTangent(tangent: mod.Vector, useSmoothing: boolean = true): mod.Vector {
        const x = mod.XComponentOf(tangent);
        const y = mod.YComponentOf(tangent);
        const z = mod.ZComponentOf(tangent);

        const length = Math.sqrt(x * x + y * y + z * z);
        if (length < 0.0001) {
            return PayloadState.instance.payloadRotation ?? mod.CreateVector(0, 0, 0);
        }

        const nx = x / length;
        const ny = y / length;
        const nz = z / length;

        const yaw = Math.atan2(nx, nz);
        const pitch = -Math.asin(ny);
        const roll = 0;

        if (useSmoothing && PayloadState.instance.payloadRotation) {
            const prevPitch = mod.XComponentOf(PayloadState.instance.payloadRotation);
            const prevYaw = mod.YComponentOf(PayloadState.instance.payloadRotation);

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

    private static moveAlongSpline(forward: boolean, speed: number): void {
        let wpIndex = PayloadState.instance.reachedWaypointIndex;
        const wpCount = PayloadState.instance.waypoints.length;

        if (wpIndex >= wpCount - 1 && forward) {
            return;
        }

        PayloadState.instance.segmentDistance = PayloadState.instance.segmentDistance || 0;
        PayloadState.instance.segmentDistance += forward ? speed : -speed;

        while (true) {
            const prevIndex = Math.max(wpIndex - 1, 0);
            const nextIndex = Math.min(wpIndex + 1, wpCount - 1);
            const nextNextIndex = Math.min(nextIndex + 1, wpCount - 1);

            const prevWp = PayloadState.instance.waypoints[prevIndex];
            const currWp = PayloadState.instance.waypoints[wpIndex];
            const nextWp = PayloadState.instance.waypoints[nextIndex];
            const nextNextWp = PayloadState.instance.waypoints[nextNextIndex];
            if (!prevWp || !currWp || !nextWp || !nextNextWp) break;

            const p0 = prevWp.position;
            const p1 = currWp.position;
            const p2 = nextWp.position;
            const p3 = nextNextWp.position;

            const segmentLength = mod.DistanceBetween(p1, p2);

            if (wpIndex >= wpCount - 1) {
                PayloadState.instance.segmentDistance = 0;
                PayloadState.instance.payloadPosition = p1;
                break;
            }

            if (PayloadState.instance.segmentDistance >= segmentLength && forward && wpIndex < wpCount - 1) {
                PayloadState.instance.segmentDistance -= segmentLength;
                wpIndex = nextIndex;
                PayloadState.instance.reachedWaypointIndex = wpIndex;

                if (nextWp.isCheckpoint &&
                    PayloadState.instance.checkpointIndexes[PayloadState.instance.reachedCheckpointIndex] < nextIndex
                ) {
                    PayloadState.instance.reachedCheckpointIndex += 1;
                    PayloadCore.onCheckpointReached();
                }
                continue;
            }

            if (PayloadState.instance.segmentDistance <= 0 && !forward && wpIndex > 0) {
                wpIndex = wpIndex - 1;
                PayloadState.instance.reachedWaypointIndex = wpIndex;

                const prevWaypoint = PayloadState.instance.waypoints[wpIndex];
                const currentWaypoint = PayloadState.instance.waypoints[wpIndex + 1];
                if (!prevWaypoint || !currentWaypoint) {
                    break;
                }
                const prevWpPos = prevWaypoint.position;
                const currWpPos = currentWaypoint.position;
                PayloadState.instance.segmentDistance += mod.DistanceBetween(prevWpPos, currWpPos);
                continue;
            }

            const t = PayloadCore.getTForDistanceDynamic(p0, p1, p2, p3, PayloadState.instance.segmentDistance);

            PayloadState.instance.payloadPosition = PayloadCore.catmullRom(p0, p1, p2, p3, t);
            const tangent = PayloadCore.getSplineTangent(p0, p1, p2, p3, t);
            PayloadState.instance.payloadRotation = PayloadCore.getRotationFromTangent(tangent);
            break;
        }
    }

    private static onCheckpointReached(): void {
        if (PayloadState.instance.payloadState !== PayloadMovementState.ADVANCING) return;

        PayloadSounds.playCheckpointReachedSound();

        if (PayloadState.instance.reachedCheckpointIndex == PayloadState.instance.checkpointIndexes.length - 1) {
            PayloadCore.onFinalCheckpointReached();
        } else {
            mod.EnableHQ(mod.GetHQ((PayloadState.instance.reachedCheckpointIndex) + 300), false);
            mod.EnableHQ(mod.GetHQ((PayloadState.instance.reachedCheckpointIndex) + 400), false);

            PayloadUI.updateCheckpointUI();
            PayloadCore.applyCheckpointFx();
            mod.DisplayHighlightedWorldLogMessage(
                mod.Message(
                    mod.stringkeys.payload.state.checkpoint_reached,
                    PayloadState.instance.reachedCheckpointIndex + 1,
                    PayloadState.instance.checkpointIndexes.length
                )
            );
            PayloadState.instance.checkpointStartTime = mod.GetMatchTimeElapsed();

            const nextCheckpointIndex = PayloadState.instance.reachedCheckpointIndex + 1;
            mod.EnableHQ(mod.GetHQ(nextCheckpointIndex + 300), true);
            mod.EnableHQ(mod.GetHQ(nextCheckpointIndex + 400), true);
            mod.EnableGameModeObjective(mod.GetSector(nextCheckpointIndex + 101), true);
            mod.EnableGameModeObjective(mod.GetSector(nextCheckpointIndex + 98), false);
        }
    }

    private static setPayloadState(state: PayloadMovementState): void {
        if (PayloadState.instance.payloadState !== state) {
            PayloadState.instance.payloadState = state;
            PayloadUI.updateStatusUI();
        }
    }

    private static pushPayload(pushingTeamId: number, opposingTeamId: number, forward: boolean): void {
        if (forward && PayloadState.instance.reachedWaypointIndex >= PayloadState.instance.waypoints.length - 1) {
            PayloadCore.setPayloadState(PayloadMovementState.LOCKED);
            PayloadSounds.playPayloadIdleSound();
            return;
        }
        if (!forward) {
            if (PayloadState.instance.reachedWaypointIndex <= (PayloadState.instance.reachedCheckpointIndex - 1)
                || (PayloadState.instance.reachedWaypointIndex == 0 && (PayloadState.instance.segmentDistance || 0) <= 0)) {
                if (PayloadState.instance.reachedWaypointIndex == 0 && (PayloadState.instance.segmentDistance || 0) < 0) {
                    PayloadState.instance.segmentDistance = 0;
                }
                PayloadCore.setPayloadState(PayloadMovementState.LOCKED);
                return;
            }
        }

        const pushingPlayers = PayloadState.instance.playersInPushProximity.get(pushingTeamId)!;
        const opposingPlayers = PayloadState.instance.playersInPushProximity.get(opposingTeamId)!;
        const speedConfig = PayloadConfig.payloadSpeed.get(pushingTeamId)!;

        const advantage = pushingPlayers.length - opposingPlayers.length;
        const speed = (speedConfig.meterPerSecond + speedConfig.meterPerSecondPerPlayer * advantage) / PayloadState.instance.tickrate;

        PayloadCore.setPayloadState(forward ? PayloadMovementState.ADVANCING : PayloadMovementState.PUSHING_BACK);
        PayloadCore.moveAlongSpline(forward, speed);
        if (forward) {
            PayloadSounds.VOPushing();
        } else {
            PayloadSounds.VOPushingBack();
        }
    }

    private static updatePayloadObjects(respawn: boolean): void {
        PayloadCore.updatePayloadSpatials(respawn);
        PayloadCore.updatePayloadVfx(respawn);
        PayloadCore.updatePayloadObjectives(respawn);
    }

    private static onPayloadMoved(): void {
        PayloadCore.calculatePayloadProgress();
        PayloadCore.updatePayloadObjects(false);
        PayloadUI.updateProgressUI();
        PayloadSounds.updateSoundPositions();
        if (PayloadState.instance.progressInPercent > 90) {
            PayloadSounds.playNearEndMusic();
            PayloadSounds.playNearEndVO();
        }
    }

    private static async onFinalCheckpointReached(): Promise<void> {
        if (!PayloadState.instance.gameOngoing) return;
        PayloadState.instance.gameOngoing = false;
        mod.PauseGameModeTime(true);
        PayloadSounds.playPayloadIdleSound();
        PayloadSounds.endGameMusic(1);
        PayloadState.instance.payloadObjectives.forEach((obj) => {
            mod.UnspawnObject(obj);
        });
        PayloadState.instance.payloadVfx.forEach((vfx) => {
            mod.UnspawnObject(vfx);
        });
        await PayloadUI.nukeUI();
        mod.EndGameMode(mod.GetTeam(1));
    }

    private static onRunningOutOfTime(): void {
        if (!PayloadState.instance.gameOngoing) return;
        PayloadState.instance.gameOngoing = false;
        PayloadSounds.endGameMusic(2);
        mod.PauseGameModeTime(true);
        mod.EndGameMode(mod.GetTeam(2));
    }

    /**
     * Checks for team switch conditions and switches the player's team if conditions are met.
     * @method checkTeamSwitchConditions
     * @param {mod.Player} eventPlayer - The player to check for team switch conditions
    */
    public static checkTeamSwitchConditions(eventPlayer: mod.Player): void {
        if (!PayloadConfig.enableTeamSwitch) return;
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) return;
        if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
            && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsCrouching)
            && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
        ) {
            mod.SetTeam(eventPlayer, mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(2)) ? mod.GetTeam(1) : mod.GetTeam(2));
        }
    }

    /**
     * Makes a player immortal during the end screen phase of the game.
     * @param eventPlayer - The player who should be made immortal
     */
    public static playerEndState(eventPlayer: mod.Player): void {
        if (!PayloadState.instance.gameOngoing) {
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) {
                mod.SetPlayerMaxHealth(eventPlayer, 500);
                mod.Heal(eventPlayer, 500);
            } else if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsManDown)) {
                mod.ForceRevive(eventPlayer);
            }
        }
    }
}
