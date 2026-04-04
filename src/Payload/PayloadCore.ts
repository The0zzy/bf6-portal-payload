import { PayloadConfig, PayloadPlayerVars, type SpatialConfig } from './PayloadConfig.ts';
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

    public static isSpatialValid(spatial: number | mod.SpatialObject): boolean {
        const obj = typeof spatial === 'number' ? mod.GetSpatialObject(spatial) : spatial;
        if (!obj) return false;
        const pos = mod.GetObjectPosition(obj);
        return !(
            mod.XComponentOf(pos) === 0 ||
            mod.YComponentOf(pos) === 0 ||
            mod.ZComponentOf(pos) === 0
        );
    }

    private static calculatePayloadProgress(): void {
        let traveledDistance = 0;
        traveledDistance = PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex].distance;
        traveledDistance += mod.DistanceBetween(PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex].position, PayloadState.instance.payloadPosition);
        PayloadState.instance.progressInMeters = traveledDistance;
        PayloadState.instance.progressInPercent = (traveledDistance / PayloadState.instance.totalDistanceInMeters) * 100;
    }

    private static initPayloadTrack(): void {
        let waypointIndex = 0;
        let distance = 0;
        for (let waypointSpatialId = 1000; waypointSpatialId < 1999; waypointSpatialId++) {
            if (PayloadCore.isSpatialValid(waypointSpatialId)) {
                let isCheckpoint = false;
                let checkPointSpatialId = waypointSpatialId + 1000;
                if (PayloadCore.isSpatialValid(checkPointSpatialId)) {
                    isCheckpoint = true;
                    PayloadState.instance.maxCheckpoints++;
                }
                const waypointPosition = mod.GetObjectPosition(mod.GetSpatialObject(waypointSpatialId));
                if (waypointIndex > 0) {
                    distance += mod.DistanceBetween(PayloadState.instance.waypoints[waypointIndex - 1].position, waypointPosition);
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
            PayloadState.instance.maxCheckpoints++;
        }

        const lastWaypoint = PayloadState.instance.waypoints[PayloadState.instance.waypoints.length - 1];
        if (lastWaypoint && !lastWaypoint.isCheckpoint) {
            lastWaypoint.isCheckpoint = true;
            PayloadState.instance.maxCheckpoints++;
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
        PayloadState.instance.currentCheckpoint = 1;
        PayloadState.instance.payloadPosition = PayloadState.instance.waypoints[0].position;
    }

    private static applyCheckpointFx(): void {
        for (let i = 0; i < PayloadState.instance.waypoints.length; i++) {
            const waypoint = PayloadState.instance.waypoints[i];
            if (!waypoint.isCheckpoint) continue;

            for (let s = 0; s < PayloadConfig.checkpointSpatials.length; s++) {
                const key = `${i}-${s}`;
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
                const key = `${i}-${o}`;
                if (PayloadState.instance.checkpointObjectives.has(key)) {
                    mod.UnspawnObject(PayloadState.instance.checkpointObjectives.get(key)!);
                    PayloadState.instance.checkpointObjectives.delete(key);
                }
                if (PayloadState.instance.currentCheckpoint < PayloadState.instance.checkpointIndexes.length && PayloadState.instance.checkpointIndexes[PayloadState.instance.currentCheckpoint] === i) {
                    const objectiveConfig = PayloadConfig.checkpointObjectives[o];
                    const spawnPos = mod.Add(waypoint.position, objectiveConfig.relativeOffset);
                    const spawnRot = mod.Add(waypoint.rotation, objectiveConfig.rotation);
                    const obj = mod.SpawnObject(
                        objectiveConfig.prefab,
                        spawnPos,
                        spawnRot,
                        objectiveConfig.scale
                    );
                    PayloadState.instance.checkpointObjectives.set(key, obj as mod.CapturePoint);
                }
            }

            for (let v = 0; v < PayloadConfig.checkpointVfx.length; v++) {
                const key = `${i}-${v}`;
                if (PayloadState.instance.checkpointVfx.has(key)) {
                    mod.UnspawnObject(PayloadState.instance.checkpointVfx.get(key)!);
                    PayloadState.instance.checkpointVfx.delete(key);
                }
                const vfxConfig = PayloadConfig.checkpointVfx[v];
                const color = PayloadState.instance.reachedCheckpointIndex < i ? vfxConfig.color1 : vfxConfig.color2;
                const spawnPos = mod.Add(waypoint.position, vfxConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, vfxConfig.rotation);
                const vfx = mod.SpawnObject(
                    vfxConfig.prefab,
                    spawnPos,
                    spawnRot,
                    mod.CreateVector(1, 1, 1)
                ) as mod.VFX;
                PayloadState.instance.checkpointVfx.set(key, vfx);
                mod.EnableVFX(vfx, true);
                mod.SetVFXScale(vfx, vfxConfig.scale);
                mod.SetVFXColor(vfx, color);
                mod.SetVFXSpeed(vfx, vfxConfig.speed);
            }
        }
    }

    private static applyPayloadVfx(): void {
        PayloadConfig.payloadVfx.forEach((vfxConfig, i) => {
            const wp = PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex];
            const spawnPos = mod.Add(wp.position, vfxConfig.relativeOffset);
            const spawnRot = mod.Add(wp.rotation, vfxConfig.rotation);
            if (PayloadState.instance.payloadVfx.has(i)) {
                mod.UnspawnObject(PayloadState.instance.payloadVfx.get(i)!);
                PayloadState.instance.payloadVfx.delete(i);
            }
            const vfx = mod.SpawnObject(
                vfxConfig.prefab,
                spawnPos,
                spawnRot,
                mod.CreateVector(1, 1, 1)
            ) as mod.VFX;
            PayloadState.instance.payloadVfx.set(i, vfx);
            mod.EnableVFX(vfx, true);
            mod.SetVFXColor(vfx, vfxConfig.color1);
            mod.SetVFXSpeed(vfx, vfxConfig.speed);
            mod.SetVFXScale(vfx, 10);
        });
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

    private static initPayloadObjective(): void {
        const start = PayloadState.instance.waypoints[PayloadState.instance.reachedWaypointIndex];
        PayloadCore.applyPayloadVfx();

        PayloadState.instance.payloadSpatialsConfig = [];
        for (const payloadSpatialId of PayloadConfig.payloadSpatialIdentifiers) {
            if(PayloadCore.isSpatialValid(payloadSpatialId) && payloadSpatialId === 5000) {
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

        for (let i = 0; i < PayloadState.instance.payloadSpatialsConfig.length; i++) {
            const spatialConfig = PayloadState.instance.payloadSpatialsConfig[i];
            const spawnPos = mod.Add(start.position, spatialConfig.relativeOffset);
            const spawnRot = mod.Add(start.rotation, spatialConfig.rotation);
            const obj = mod.SpawnObject(
                spatialConfig.prefab,
                spawnPos,
                spawnRot,
                spatialConfig.scale
            );
            PayloadState.instance.payloadSpatials.set(i, obj);
        }

        for (let i = 0; i < PayloadConfig.payloadObjectives.length; i++) {
            const objectiveConfig = PayloadConfig.payloadObjectives[i];
            const spawnPos = mod.Add(start.position, objectiveConfig.relativeOffset);
            const spawnRot = mod.Add(start.rotation, objectiveConfig.rotation);
            const obj = mod.SpawnObject(
                objectiveConfig.prefab,
                spawnPos,
                spawnRot,
                objectiveConfig.scale
            );
            PayloadState.instance.payloadObjectives.set(i, obj);
        }
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

    private static getAlivePlayersInProximity(): void {
        PayloadState.instance.playersInPushProximity.clear();
        const players = mod.AllPlayers();
        const playerCount = mod.CountOf(players);

        for (let i = 0; i < playerCount; i++) {
            const player = mod.ValueInArray(players, i) as mod.Player;
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
                const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
                if (mod.DistanceBetween(PayloadState.instance.payloadPosition, playerPos) <= PayloadConfig.pushProximityRadius) {
                    const teamId = mod.GetObjId(mod.GetTeam(player));
                    if(!PayloadState.instance.playersInPushProximity.has(teamId)) {
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

                if (nextWp.isCheckpoint && PayloadState.instance.reachedCheckpointIndex < nextIndex) {
                    PayloadState.instance.reachedCheckpointIndex = nextIndex;
                    PayloadState.instance.currentCheckpoint++;
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

        if (PayloadState.instance.reachedWaypointIndex == PayloadState.instance.waypoints.length - 1) {
            void PayloadCore.onFinalCheckpointReached();
        } else {
            mod.EnableHQ(mod.GetHQ((PayloadState.instance.currentCheckpoint - 1) + 300), false);
            mod.EnableHQ(mod.GetHQ((PayloadState.instance.currentCheckpoint - 1) + 400), false);

            void PayloadUI.updateCheckpointUI();
            PayloadCore.applyCheckpointFx();
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.checkpoint_reached, PayloadState.instance.currentCheckpoint - 1, PayloadState.instance.maxCheckpoints - 1));
            PayloadState.instance.checkpointStartTime = mod.GetMatchTimeElapsed();

            mod.EnableHQ(mod.GetHQ(PayloadState.instance.currentCheckpoint + 300), true);
            mod.EnableHQ(mod.GetHQ(PayloadState.instance.currentCheckpoint + 400), true);
            mod.EnableGameModeObjective(mod.GetSector(PayloadState.instance.currentCheckpoint + 101), true);
            mod.EnableGameModeObjective(mod.GetSector(PayloadState.instance.currentCheckpoint + 98), false);
        }
    }

    private static setPayloadState(state: PayloadMovementState): void {
        if (PayloadState.instance.payloadState !== state) {
            PayloadState.instance.payloadState = state;
            PayloadUI.updateStatusUI();
        }
    }

    private static pushForward(): void {
        if (PayloadState.instance.reachedWaypointIndex >= PayloadState.instance.waypoints.length - 1) {
            PayloadCore.setPayloadState(PayloadMovementState.LOCKED);
            PayloadSounds.playPayloadIdleSound();
            return;
        }
        const playersInAdvantage = (
            PayloadState.instance.playersInPushProximity.get(1)!.length - 
            PayloadState.instance.playersInPushProximity.get(2)!.length
        );
        const speedAddtion = (
            PayloadConfig.payloadSpeed.get(1)!.meterPerSecondPerPlayer * 
            playersInAdvantage
        );
        const speed = (
            (
                PayloadConfig.payloadSpeed.get(1)!.meterPerSecond + 
                speedAddtion
            ) / 
            PayloadState.instance.tickrate
        );
        PayloadCore.setPayloadState(PayloadMovementState.ADVANCING);
        PayloadCore.moveAlongSpline(true, speed);
        PayloadSounds.VOPushing();
    }

    private static pushBackward(): void {
        if (PayloadState.instance.reachedWaypointIndex <= (PayloadState.instance.reachedCheckpointIndex - 1) || (PayloadState.instance.reachedWaypointIndex == 0 && (PayloadState.instance.segmentDistance || 0) <= 0)) {
            if (PayloadState.instance.reachedWaypointIndex == 0 && (PayloadState.instance.segmentDistance || 0) < 0) {
                PayloadState.instance.segmentDistance = 0;
            }
            PayloadCore.setPayloadState(PayloadMovementState.LOCKED);
            return;
        }
        const playersInAdvantage = (
            PayloadState.instance.playersInPushProximity.get(2)!.length - 
            PayloadState.instance.playersInPushProximity.get(1)!.length
        );
        const speedAddtion = (
            PayloadConfig.payloadSpeed.get(2)!.meterPerSecondPerPlayer * 
            playersInAdvantage
        );
        const speed = (
            (
                PayloadConfig.payloadSpeed.get(2)!.meterPerSecond + 
                speedAddtion
            ) / 
            PayloadState.instance.tickrate
        );
        PayloadCore.setPayloadState(PayloadMovementState.PUSHING_BACK);
        PayloadCore.moveAlongSpline(false, speed);
        PayloadSounds.VOPushingBack();
    }

    private static getPayloadSpatialConfig(index: number): SpatialConfig | undefined {
        return PayloadState.instance.payloadSpatialsConfig[index];
    }

    private static updatePayloadObject(): void {
        const rotation = PayloadState.instance.payloadRotation;

        PayloadState.instance.payloadVfx.forEach((vfx, index) => {
            const config = PayloadConfig.payloadVfx[index];
            const worldPos = mod.Add(PayloadState.instance.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.MoveVFX(vfx, worldPos, worldRot);
        });

        PayloadState.instance.payloadSpatials.forEach((obj, index) => {
            const config = PayloadCore.getPayloadSpatialConfig(index);
            if (!config) return;
            const worldPos = mod.Add(PayloadState.instance.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
        });

        PayloadState.instance.payloadObjectives.forEach((obj, index) => {
            const config = PayloadConfig.payloadObjectives[index];
            const worldPos = mod.Add(PayloadState.instance.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
        });
    }

    private static onPayloadMoved(): void {
        PayloadCore.calculatePayloadProgress();
        PayloadCore.updatePayloadObject();
        PayloadUI.updateProgressUI();
        if (PayloadState.instance.progressInPercent > 90) {
            PayloadSounds.playNearEndMusic();
            PayloadSounds.playNearEndVO();
        }
    }

    private static executeEverySecond(): void {
        if (PayloadState.instance.lastElapsedSeconds >= PayloadConfig.maxGameModeTime && !PayloadState.instance.overtime) {
            PayloadCore.onRunningOutOfTime();
            return;
        }

        if (PayloadState.instance.lastElapsedSeconds % PayloadConfig.spatialRespawnInterval === 0) {
            if (PayloadState.instance.progressInPercent < 100) {
                PayloadCore.respawnPayloadSpatials();
            }
        }

        const elapsedSinceCheckpoint = PayloadState.instance.lastElapsedSeconds - PayloadState.instance.checkpointStartTime;
        const remainingTime = PayloadConfig.defaultCheckpointTime - elapsedSinceCheckpoint;
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
        void PayloadUI.progressFlash();
    }

    private static respawnPayloadSpatials(): void {
        const rotation = PayloadState.instance.payloadRotation;

        PayloadState.instance.payloadSpatials.forEach((obj, index) => {
            mod.UnspawnObject(obj);

            const config = PayloadCore.getPayloadSpatialConfig(index);
            if (!config) return;
            const worldPos = mod.Add(PayloadState.instance.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);

            const newObj = mod.SpawnObject(
                config.prefab,
                worldPos,
                worldRot,
                config.scale
            );
            PayloadState.instance.payloadSpatials.set(index, newObj);
        });
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

    public static OnGameModeStarted(): void {
        mod.SetGameModeTimeLimit(PayloadConfig.maxGameModeTime);
        mod.SetGameModeTargetScore(PayloadConfig.gameModeTargetScore);
        mod.Wait(3);
        PayloadCore.initSectors();
        PayloadCore.initPayloadTrack();
        PayloadCore.applyCheckpointFx();
        PayloadCore.initPayloadRotation();
        PayloadCore.initPayloadObjective();
        PayloadSounds.init();
        PayloadScoring.initScoreboard();

        PayloadState.instance.checkpointStartTime = mod.GetMatchTimeElapsed();

        PayloadUI.setup();
        PayloadWeather.init();
    }

    public static OnPlayerDied(victim: mod.Player, killer: mod.Player): void {
        PayloadScoring.onPlayerDied(victim, killer);
    }

    public static OnPlayerEarnedKillAssist(player: mod.Player, assistOn: mod.Player): void {
        PayloadScoring.onPlayerEarnedAssist(player);
    }

    public static OnPlayerLeaveGame(playerId: number): void {
        PayloadScoring.onPlayerLeave(playerId);
        PayloadUI.clearPlayerUI(playerId);
    }

    public static OnPlayerJoinGame(eventPlayer: mod.Player): void {
        PayloadScoring.getOrCreatePlayerScore(eventPlayer);
        void PayloadUI.onPlayerJoinGameGlobalUIRefresh();
        void PayloadWeather.resetWeatherVFX();
        PayloadUI.onPlayerJoinGame(eventPlayer);
    }

    public static OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
        mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.PlayArea), mod.GetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.PlayArea)) + 1);
        if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
            if (mod.GetObjId(eventAreaTrigger) > (PayloadState.instance.currentCheckpoint + 600)) {
                void PayloadUI.outOfBoundsUI(eventPlayer);
            } else {
                mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
            }
        } else {
            if (mod.GetObjId(eventAreaTrigger) < (PayloadState.instance.currentCheckpoint + 600)) {
                void PayloadUI.outOfBoundsUI(eventPlayer);
            } else {
                mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
            }
        }
    }

    public static async OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): Promise<void> {
        mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.PlayArea), mod.GetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.PlayArea)) - 1);
        await mod.Wait(0.066);
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) {
            if ((mod.GetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.PlayArea)) as number) <= 0) {
                void PayloadUI.outOfBoundsUI(eventPlayer);
            }
        }
    }

    public static OnPlayerDeployed(eventPlayer: mod.Player): void {
        const score = PayloadScoring.getOrCreatePlayerScore(eventPlayer);
        mod.SkipManDown(eventPlayer, false);
        if (!score.hasDeployed) {
            score.hasDeployed = true;
            PayloadScoring.refreshScoreboard();
            PayloadCore.applyCheckpointFx();
            PayloadCore.applyPayloadVfx();
        }
        mod.Wait(0.1);
        if (mod.GetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds)) as boolean) {
            mod.Wait(0.6);
            mod.UndeployPlayer(eventPlayer);
            mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
        }
    }

    public static OnRevived(victim: mod.Player, reviver: mod.Player): void {
        PayloadScoring.onPlayerRevived(victim, reviver);
    }

    public static OngoingGlobal(): void {
        if (!PayloadState.instance.gameOngoing) return;
        const elapsedSeconds = mod.GetMatchTimeElapsed();
        PayloadCore.getAlivePlayersInProximity();
        const playersTeam1 = PayloadState.instance.playersInPushProximity.get(1) || [];
        const playersTeam2 = PayloadState.instance.playersInPushProximity.get(2) || [];

        if (playersTeam1.length > playersTeam2.length) {
            PayloadCore.pushForward();
            PayloadCore.onPayloadMoved();
            PayloadState.instance.overtime = true;
        } else if (playersTeam2.length > playersTeam1.length) {
            PayloadCore.pushBackward();
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

        PayloadSounds.updateSoundPositions();
        PayloadUI.updatePlayerCountUI();

        if (PayloadState.instance.lastElapsedSeconds != Math.floor(elapsedSeconds)) {
            PayloadState.instance.lastElapsedSeconds = Math.floor(elapsedSeconds);
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

            PayloadState.instance.pastTickRates.shift();
            PayloadState.instance.pastTickRates.push(PayloadState.instance.ticks);
            const newTickrate = PayloadState.instance.pastTickRates.reduce((a, b) => a + b) / PayloadState.instance.pastTickRates.length;
            if (newTickrate != PayloadState.instance.tickrate && Math.abs(newTickrate - PayloadState.instance.tickrate) > 5) {
                PayloadState.instance.tickrate = newTickrate;
            }
            PayloadState.instance.ticks = 0;
            PayloadCore.executeEverySecond();
        }
        PayloadState.instance.ticks++;
        if (PayloadConfig.enableDebug) {
            PayloadUI.updateDebugUI();
        }
    }

    /**
     * Checks for team switch conditions and switches the player's team if conditions are met.
     * @method checkTeamSwitchConditions
     * @param {mod.Player} eventPlayer - The player to check for team switch conditions
    */
    public static async checkTeamSwitchConditions(eventPlayer: mod.Player): Promise<void> {
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) return;
        if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;
        if (!PayloadConfig.enableTeamSwitch) return;
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
    public static async playerEndState(eventPlayer: mod.Player): Promise<void> {
        if (!PayloadState.instance.gameOngoing) {
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) {
                mod.SetPlayerMaxHealth(eventPlayer, 500);
                mod.Heal(eventPlayer, 500);
            } else if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsManDown)) {
                mod.ForceRevive(eventPlayer);
            }
        }
    }

    public static OnPlayerUndeploy(eventPlayer: mod.Player): void {
        mod.SkipManDown(eventPlayer, false);
        mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
    }
}
