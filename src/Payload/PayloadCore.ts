import { PayloadConfig, PayloadPlayerVars, type SpatialConfig } from './PayloadConfig.ts';
import { PayloadState, PayloadStateType } from './PayloadState.ts';
import { PayloadScoring } from './PayloadScoring.ts';
import { PayloadSounds } from './PayloadSounds.ts';
import { PayloadUI } from './PayloadUI.ts';
import { PayloadWeather } from './PayloadWeather.ts';

export class PayloadCore {
    private static readonly state = PayloadState.getInstance();

    private static calculatePayloadProgress(): void {
        let traveledDistance = 0;
        traveledDistance = PayloadCore.state.waypoints.get(PayloadCore.state.reachedWaypointIndex)!.distance;
        traveledDistance += mod.DistanceBetween(PayloadCore.state.waypoints.get(PayloadCore.state.reachedWaypointIndex)!.position, PayloadCore.state.payloadPosition);
        PayloadCore.state.progressInMeters = traveledDistance;
        PayloadCore.state.progressInPercent = (traveledDistance / PayloadCore.state.totalDistanceInMeters) * 100;
    }

    private static initPayloadTrack(): void {
        let waypointIndex = 0;
        let distance = 0;
        for (let i = 1000; i < 1999; i++) {
            const objPos = mod.GetObjectPosition(mod.GetSpatialObject(i));
            if (!(mod.XComponentOf(objPos) == 0 || mod.YComponentOf(objPos) == 0 || mod.ZComponentOf(objPos) == 0)) {
                let isCheckpoint = false;
                const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 1000));
                if (!(mod.XComponentOf(checkpointPos) == 0 || mod.YComponentOf(checkpointPos) == 0 || mod.ZComponentOf(checkpointPos) == 0)) {
                    isCheckpoint = true;
                    PayloadCore.state.maxCheckpoints++;
                }
                if (waypointIndex > 0) {
                    distance += mod.DistanceBetween(PayloadCore.state.waypoints.get(waypointIndex - 1)!.position, objPos);
                }
                PayloadCore.state.waypoints.set(waypointIndex, {
                    position: objPos,
                    isCheckpoint,
                    rotation: mod.CreateVector(0, 0, 0),
                    distance
                });
                waypointIndex++;
            }
        }

        const firstWaypoint = PayloadCore.state.waypoints.get(0);
        if (firstWaypoint && !firstWaypoint.isCheckpoint) {
            firstWaypoint.isCheckpoint = true;
            PayloadCore.state.maxCheckpoints++;
        }

        const lastWaypoint = PayloadCore.state.waypoints.get(PayloadCore.state.waypoints.size - 1);
        if (lastWaypoint && !lastWaypoint.isCheckpoint) {
            lastWaypoint.isCheckpoint = true;
            PayloadCore.state.maxCheckpoints++;
        }

        PayloadCore.state.totalDistanceInMeters = distance;
        PayloadCore.state.reachedWaypointIndex = 0;
        PayloadCore.state.reachedCheckpointIndex = 0;
        PayloadCore.state.checkpointIndexes = [];
        for (let i = 0; i < PayloadCore.state.waypoints.size; i++) {
            const waypoint = PayloadCore.state.waypoints.get(i)!;
            if (waypoint.isCheckpoint) {
                PayloadCore.state.checkpointIndexes.push(i);
            }
        }
        PayloadCore.state.currentCheckpoint = 1;
        PayloadCore.state.payloadPosition = PayloadCore.state.waypoints.get(0)!.position;
    }

    private static applyCheckpointFx(): void {
        for (let i = 0; i < PayloadCore.state.waypoints.size; i++) {
            const waypoint = PayloadCore.state.waypoints.get(i)!;
            if (!waypoint.isCheckpoint) continue;

            for (let s = 0; s < PayloadConfig.checkpointSpatials.length; s++) {
                const key = `${i}-${s}`;
                if (PayloadCore.state.checkpointSpatials.has(key)) {
                    mod.UnspawnObject(PayloadCore.state.checkpointSpatials.get(key)!);
                    PayloadCore.state.checkpointSpatials.delete(key);
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
                PayloadCore.state.checkpointSpatials.set(key, obj);
            }

            for (let o = 0; o < PayloadConfig.checkpointObjectives.length; o++) {
                const key = `${i}-${o}`;
                if (PayloadCore.state.checkpointObjectives.has(key)) {
                    mod.UnspawnObject(PayloadCore.state.checkpointObjectives.get(key)!);
                    PayloadCore.state.checkpointObjectives.delete(key);
                }
                if (PayloadCore.state.currentCheckpoint < PayloadCore.state.checkpointIndexes.length && PayloadCore.state.checkpointIndexes[PayloadCore.state.currentCheckpoint] === i) {
                    const objectiveConfig = PayloadConfig.checkpointObjectives[o];
                    const spawnPos = mod.Add(waypoint.position, objectiveConfig.relativeOffset);
                    const spawnRot = mod.Add(waypoint.rotation, objectiveConfig.rotation);
                    const obj = mod.SpawnObject(
                        objectiveConfig.prefab,
                        spawnPos,
                        spawnRot,
                        objectiveConfig.scale
                    );
                    PayloadCore.state.checkpointObjectives.set(key, obj as mod.CapturePoint);
                }
            }

            for (let v = 0; v < PayloadConfig.checkpointVfx.length; v++) {
                const key = `${i}-${v}`;
                if (PayloadCore.state.checkpointVfx.has(key)) {
                    mod.UnspawnObject(PayloadCore.state.checkpointVfx.get(key)!);
                    PayloadCore.state.checkpointVfx.delete(key);
                }
                const vfxConfig = PayloadConfig.checkpointVfx[v];
                const color = PayloadCore.state.reachedCheckpointIndex < i ? vfxConfig.color1 : vfxConfig.color2;
                const spawnPos = mod.Add(waypoint.position, vfxConfig.relativeOffset);
                const spawnRot = mod.Add(waypoint.rotation, vfxConfig.rotation);
                const vfx = mod.SpawnObject(
                    vfxConfig.prefab,
                    spawnPos,
                    spawnRot,
                    mod.CreateVector(1, 1, 1)
                ) as mod.VFX;
                PayloadCore.state.checkpointVfx.set(key, vfx);
                mod.EnableVFX(vfx, true);
                mod.SetVFXScale(vfx, vfxConfig.scale);
                mod.SetVFXColor(vfx, color);
                mod.SetVFXSpeed(vfx, vfxConfig.speed);
            }
        }
    }

    private static applyPayloadVfx(): void {
        PayloadConfig.payloadVfx.forEach((vfxConfig, i) => {
            const wp = PayloadCore.state.waypoints.get(PayloadCore.state.reachedWaypointIndex)!;
            const spawnPos = mod.Add(wp.position, vfxConfig.relativeOffset);
            const spawnRot = mod.Add(wp.rotation, vfxConfig.rotation);
            if (PayloadCore.state.payloadVfx.has(i)) {
                mod.UnspawnObject(PayloadCore.state.payloadVfx.get(i)!);
                PayloadCore.state.payloadVfx.delete(i);
            }
            const vfx = mod.SpawnObject(
                vfxConfig.prefab,
                spawnPos,
                spawnRot,
                mod.CreateVector(1, 1, 1)
            ) as mod.VFX;
            PayloadCore.state.payloadVfx.set(i, vfx);
            mod.EnableVFX(vfx, true);
            mod.SetVFXColor(vfx, vfxConfig.color1);
            mod.SetVFXSpeed(vfx, vfxConfig.speed);
            mod.SetVFXScale(vfx, 10);
        });
    }

    private static initPayloadRotation(): void {
        const wpCount = PayloadCore.state.waypoints.size;
        for (let i = 0; i < wpCount; i++) {
            const prevIndex = Math.max(i - 1, 0);
            const nextIndex = Math.min(i + 1, wpCount - 1);
            const nextNextIndex = Math.min(i + 2, wpCount - 1);

            const p0 = PayloadCore.state.waypoints.get(prevIndex)!.position;
            const p1 = PayloadCore.state.waypoints.get(i)!.position;
            const p2 = PayloadCore.state.waypoints.get(nextIndex)!.position;
            const p3 = PayloadCore.state.waypoints.get(nextNextIndex)!.position;

            const tangent = PayloadCore.getSplineTangent(p0, p1, p2, p3, 0);
            const rotation = PayloadCore.getRotationFromTangent(tangent, false);

            PayloadCore.state.waypoints.get(i)!.rotation = rotation;

            if (i === 0) {
                PayloadCore.state.payloadRotation = rotation;
            }
        }
    }

    private static initPayloadObjective(): void {
        const start = PayloadCore.state.waypoints.get(PayloadCore.state.reachedWaypointIndex)!;

        PayloadCore.applyPayloadVfx();

        if (!PayloadConfig.enableVehicleSpawner) {
            PayloadCore.state.payloadSpatialsConfig = [];
            for (const payloadSpatialId of PayloadConfig.payloadSpatialIdentifiers) {
                const payloadIdentifierObject = mod.GetSpatialObject(payloadSpatialId);
                const payloadIdentifierPos = mod.GetObjectPosition(payloadIdentifierObject);
                let payloadDetected = false;
                if (!(mod.XComponentOf(payloadIdentifierPos) == 0 || mod.YComponentOf(payloadIdentifierPos) == 0 || mod.ZComponentOf(payloadIdentifierPos) == 0)) {
                    payloadDetected = true;
                }
                if (payloadDetected && payloadSpatialId === 5000) {
                    PayloadCore.state.payloadSpatialsConfig.push(
                        {
                            prefab: mod.RuntimeSpawn_Abbasid.GM1083CargoTruck_01_Canopy,
                            relativeOffset: mod.CreateVector(0, -0.1, 0),
                            scale: mod.CreateVector(1, 1, 1),
                            rotation: mod.CreateVector(0, 0, 0)
                        }
                    );
                }
                if (payloadDetected && payloadSpatialId === 5001) {
                    PayloadCore.state.payloadSpatialsConfig.push(
                        {
                            prefab: mod.RuntimeSpawn_Tungsten.GM1083CargoTruck_01_Canopy_Cargo01,
                            relativeOffset: mod.CreateVector(0, -0.1, 0),
                            scale: mod.CreateVector(1, 1, 1),
                            rotation: mod.CreateVector(0, 0, 0)
                        }
                    );
                }
            }

            for (let i = 0; i < PayloadCore.state.payloadSpatialsConfig.length; i++) {
                const spatialConfig = PayloadCore.state.payloadSpatialsConfig[i];
                const spawnPos = mod.Add(start.position, spatialConfig.relativeOffset);
                const spawnRot = mod.Add(start.rotation, spatialConfig.rotation);
                const obj = mod.SpawnObject(
                    spatialConfig.prefab,
                    spawnPos,
                    spawnRot,
                    spatialConfig.scale
                );
                PayloadCore.state.payloadSpatials.set(i, obj);
            }
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
            PayloadCore.state.payloadObjectives.set(i, obj);
        }

        if (PayloadConfig.enableVehicleSpawner) {
            const vehicleSpawner = mod.SpawnObject(
                mod.RuntimeSpawn_Common.VehicleSpawner,
                start.position,
                start.rotation,
                mod.CreateVector(1, 1, 1)
            ) as mod.VehicleSpawner;
            mod.SetVehicleSpawnerVehicleType(vehicleSpawner, PayloadConfig.payloadVehicleType);
            mod.ForceVehicleSpawnerSpawn(vehicleSpawner);
        }
    }

    public static OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
        if (!PayloadCore.state.gameOngoing) {
            mod.Kill(eventVehicle);
            return;
        }
        if (!PayloadConfig.enableVehicleSpawner) return;
        const vehiclePosition = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
        if (mod.DistanceBetween(PayloadCore.state.waypoints.get(0)!.position, vehiclePosition) < 5) {
            PayloadCore.state.payloadVehicle = eventVehicle;
            mod.SetVehicleMaxHealthMultiplier(eventVehicle, 5);
        }
    }

    public static OngoingVehicle(eventVehicle: mod.Vehicle): void {
        if (!PayloadConfig.enableVehicleSpawner) return;
        if (PayloadCore.state.payloadVehicle && mod.GetObjId(eventVehicle) == mod.GetObjId(PayloadCore.state.payloadVehicle)) {
            mod.Heal(eventVehicle, 100);
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

    private static getAlivePlayersInProximity(position: mod.Vector, radius: number): { t1: mod.Player[]; t2: mod.Player[] } {
        const players = mod.AllPlayers();
        const t1: mod.Player[] = [];
        const t2: mod.Player[] = [];
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
            return PayloadCore.state.payloadRotation ?? mod.CreateVector(0, 0, 0);
        }

        const nx = x / length;
        const ny = y / length;
        const nz = z / length;

        const yaw = Math.atan2(nx, nz);
        const pitch = -Math.asin(ny);
        const roll = 0;

        if (useSmoothing && PayloadCore.state.payloadRotation) {
            const prevPitch = mod.XComponentOf(PayloadCore.state.payloadRotation);
            const prevYaw = mod.YComponentOf(PayloadCore.state.payloadRotation);

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
        let wpIndex = PayloadCore.state.reachedWaypointIndex;
        const wpCount = PayloadCore.state.waypoints.size;

        if (wpIndex >= wpCount - 1 && forward) {
            return;
        }

        PayloadCore.state.segmentDistance = PayloadCore.state.segmentDistance || 0;
        PayloadCore.state.segmentDistance += forward ? speed : -speed;

        while (true) {
            const prevIndex = Math.max(wpIndex - 1, 0);
            const nextIndex = Math.min(wpIndex + 1, wpCount - 1);
            const nextNextIndex = Math.min(nextIndex + 1, wpCount - 1);

            const prevWp = PayloadCore.state.waypoints.get(prevIndex);
            const currWp = PayloadCore.state.waypoints.get(wpIndex);
            const nextWp = PayloadCore.state.waypoints.get(nextIndex);
            const nextNextWp = PayloadCore.state.waypoints.get(nextNextIndex);
            if (!prevWp || !currWp || !nextWp || !nextNextWp) break;

            const p0 = prevWp.position;
            const p1 = currWp.position;
            const p2 = nextWp.position;
            const p3 = nextNextWp.position;

            const segmentLength = mod.DistanceBetween(p1, p2);

            if (wpIndex >= wpCount - 1) {
                PayloadCore.state.segmentDistance = 0;
                PayloadCore.state.payloadPosition = p1;
                break;
            }

            if (PayloadCore.state.segmentDistance >= segmentLength && forward && wpIndex < wpCount - 1) {
                PayloadCore.state.segmentDistance -= segmentLength;
                wpIndex = nextIndex;
                PayloadCore.state.reachedWaypointIndex = wpIndex;

                if (nextWp.isCheckpoint && PayloadCore.state.reachedCheckpointIndex < nextIndex) {
                    PayloadCore.state.reachedCheckpointIndex = nextIndex;
                    PayloadCore.state.currentCheckpoint++;
                    PayloadCore.onCheckpointReached();
                }
                continue;
            }

            if (PayloadCore.state.segmentDistance <= 0 && !forward && wpIndex > 0) {
                wpIndex = wpIndex - 1;
                PayloadCore.state.reachedWaypointIndex = wpIndex;

                const prevWaypoint = PayloadCore.state.waypoints.get(wpIndex);
                const currentWaypoint = PayloadCore.state.waypoints.get(wpIndex + 1);
                if (!prevWaypoint || !currentWaypoint) {
                    break;
                }
                const prevWpPos = prevWaypoint.position;
                const currWpPos = currentWaypoint.position;
                PayloadCore.state.segmentDistance += mod.DistanceBetween(prevWpPos, currWpPos);
                continue;
            }

            const t = PayloadCore.getTForDistanceDynamic(p0, p1, p2, p3, PayloadCore.state.segmentDistance);

            PayloadCore.state.payloadPosition = PayloadCore.catmullRom(p0, p1, p2, p3, t);
            const tangent = PayloadCore.getSplineTangent(p0, p1, p2, p3, t);
            PayloadCore.state.payloadRotation = PayloadCore.getRotationFromTangent(tangent);
            break;
        }
    }

    private static onCheckpointReached(): void {
        if (PayloadCore.state.payloadState !== PayloadStateType.ADVANCING) return;

        PayloadSounds.playCheckpointReachedSound();

        if (PayloadCore.state.reachedWaypointIndex == PayloadCore.state.waypoints.size - 1) {
            void PayloadCore.onFinalCheckpointReached();
        } else {
            mod.EnableHQ(mod.GetHQ((PayloadCore.state.currentCheckpoint - 1) + 300), false);
            mod.EnableHQ(mod.GetHQ((PayloadCore.state.currentCheckpoint - 1) + 400), false);

            void PayloadUI.updateCheckpointUI();
            PayloadCore.applyCheckpointFx();
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.checkpoint_reached, PayloadCore.state.currentCheckpoint - 1, PayloadCore.state.maxCheckpoints - 1));
            PayloadCore.state.checkpointStartTime = mod.GetMatchTimeElapsed();

            mod.EnableHQ(mod.GetHQ(PayloadCore.state.currentCheckpoint + 300), true);
            mod.EnableHQ(mod.GetHQ(PayloadCore.state.currentCheckpoint + 400), true);
            mod.EnableGameModeObjective(mod.GetSector(PayloadCore.state.currentCheckpoint + 101), true);
            mod.EnableGameModeObjective(mod.GetSector(PayloadCore.state.currentCheckpoint + 98), false);
        }
    }

    private static setPayloadState(state: PayloadStateType): void {
        if (PayloadCore.state.payloadState !== state) {
            PayloadCore.state.payloadState = state;
            PayloadUI.updateStatusUI();
        }
    }

    private static pushForward(counts: { t1: mod.Player[]; t2: mod.Player[] }): void {
        if (PayloadCore.state.reachedWaypointIndex >= PayloadCore.state.waypoints.size - 1) {
            PayloadCore.setPayloadState(PayloadStateType.LOCKED);
            PayloadSounds.playPayloadIdleSound();
            return;
        }
        const speedAddtion = PayloadConfig.speedAdditionPerPushingPlayer * (counts.t1.length - counts.t2.length);
        const speed = (PayloadConfig.payloadSpeedT1 + speedAddtion) / PayloadCore.state.tickrate;
        PayloadCore.setPayloadState(PayloadStateType.ADVANCING);
        PayloadCore.moveAlongSpline(true, speed);
        PayloadSounds.VOPushing();
    }

    private static pushBackward(counts: { t1: mod.Player[]; t2: mod.Player[] }): void {
        if (PayloadCore.state.reachedWaypointIndex <= (PayloadCore.state.reachedCheckpointIndex - 1) || (PayloadCore.state.reachedWaypointIndex == 0 && (PayloadCore.state.segmentDistance || 0) <= 0)) {
            if (PayloadCore.state.reachedWaypointIndex == 0 && (PayloadCore.state.segmentDistance || 0) < 0) {
                PayloadCore.state.segmentDistance = 0;
            }
            PayloadCore.setPayloadState(PayloadStateType.LOCKED);
            return;
        }
        const speed = (PayloadConfig.payloadSpeedT2) / PayloadCore.state.tickrate;
        PayloadCore.setPayloadState(PayloadStateType.PUSHING_BACK);
        PayloadCore.moveAlongSpline(false, speed);
        PayloadSounds.VOPushingBack();
    }

    private static getPayloadSpatialConfig(index: number): SpatialConfig | undefined {
        return PayloadCore.state.payloadSpatialsConfig[index];
    }

    private static updatePayloadObject(): void {
        const rotation = PayloadCore.state.payloadRotation;

        PayloadCore.state.payloadVfx.forEach((vfx, index) => {
            const config = PayloadConfig.payloadVfx[index];
            const worldPos = mod.Add(PayloadCore.state.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.MoveVFX(vfx, worldPos, worldRot);
        });

        PayloadCore.state.payloadSpatials.forEach((obj, index) => {
            const config = PayloadCore.getPayloadSpatialConfig(index);
            if (!config) return;
            const worldPos = mod.Add(PayloadCore.state.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
        });

        PayloadCore.state.payloadObjectives.forEach((obj, index) => {
            const config = PayloadConfig.payloadObjectives[index];
            const worldPos = mod.Add(PayloadCore.state.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);
            mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, worldRot));
        });

        if (PayloadCore.state.payloadVehicle) {
            mod.Teleport(PayloadCore.state.payloadVehicle, PayloadCore.state.payloadPosition, mod.YComponentOf(rotation));
        }
    }

    private static onPayloadMoved(): void {
        PayloadCore.calculatePayloadProgress();
        PayloadCore.updatePayloadObject();
        PayloadUI.updateProgressUI();
        if (PayloadCore.state.progressInPercent > 90) {
            PayloadSounds.playNearEndMusic();
            PayloadSounds.playNearEndVO();
        }
    }

    private static executeEverySecond(): void {
        if (PayloadCore.state.lastElapsedSeconds >= PayloadConfig.gameModeTime && !PayloadCore.state.overtime) {
            PayloadCore.onRunningOutOfTime();
            return;
        }

        if (PayloadCore.state.lastElapsedSeconds % PayloadConfig.spatialRespawnInterval === 0) {
            if (PayloadCore.state.progressInPercent < 100) {
                PayloadCore.respawnPayloadSpatials();
            }
        }

        const elapsedSinceCheckpoint = PayloadCore.state.lastElapsedSeconds - PayloadCore.state.checkpointStartTime;
        const remainingTime = PayloadConfig.defaultCheckpointTime - elapsedSinceCheckpoint;
        if (PayloadCore.state.progressInPercent < 100) {
            PayloadUI.updateCheckpointTimer(remainingTime);
        }
        if (remainingTime <= 0 && !PayloadCore.state.overtime) {
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
        const rotation = PayloadCore.state.payloadRotation;

        PayloadCore.state.payloadSpatials.forEach((obj, index) => {
            mod.UnspawnObject(obj);

            const config = PayloadCore.getPayloadSpatialConfig(index);
            if (!config) return;
            const worldPos = mod.Add(PayloadCore.state.payloadPosition, config.relativeOffset);
            const worldRot = mod.Add(rotation, config.rotation);

            const newObj = mod.SpawnObject(
                config.prefab,
                worldPos,
                worldRot,
                config.scale
            );
            PayloadCore.state.payloadSpatials.set(index, newObj);
        });
    }

    private static async onFinalCheckpointReached(): Promise<void> {
        if (!PayloadCore.state.gameOngoing) return;
        PayloadCore.state.gameOngoing = false;
        mod.PauseGameModeTime(true);
        PayloadSounds.playPayloadIdleSound();
        PayloadSounds.endGameMusic(1);
        if (PayloadCore.state.payloadVehicle) {
            mod.Kill(PayloadCore.state.payloadVehicle as mod.Vehicle);
        } else {
            PayloadCore.state.payloadObjectives.forEach((obj) => {
                mod.UnspawnObject(obj);
            });
            PayloadCore.state.payloadVfx.forEach((vfx) => {
                mod.UnspawnObject(vfx);
            });
        }
        void PayloadUI.nukeUI();
        await mod.Wait(8.5);
        mod.EndGameMode(mod.GetTeam(1));
    }

    private static onRunningOutOfTime(): void {
        if (!PayloadCore.state.gameOngoing) return;
        PayloadCore.state.gameOngoing = false;
        PayloadSounds.endGameMusic(2);
        mod.PauseGameModeTime(true);
        mod.EndGameMode(mod.GetTeam(2));
    }

    public static OnGameModeStarted(): void {
        mod.SetGameModeTimeLimit(3600);
        mod.SetGameModeTargetScore(1000);
        mod.Wait(3);
        PayloadCore.initSectors();
        PayloadCore.initPayloadTrack();
        PayloadCore.applyCheckpointFx();
        PayloadCore.initPayloadRotation();
        PayloadCore.initPayloadObjective();
        PayloadSounds.init();
        PayloadScoring.initScoreboard();

        PayloadCore.state.checkpointStartTime = mod.GetMatchTimeElapsed();

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
            if (mod.GetObjId(eventAreaTrigger) > (PayloadCore.state.currentCheckpoint + 600)) {
                void PayloadUI.outOfBoundsUI(eventPlayer);
            } else {
                mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
            }
        } else {
            if (mod.GetObjId(eventAreaTrigger) < (PayloadCore.state.currentCheckpoint + 600)) {
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
        if (!PayloadCore.state.gameOngoing) return;
        const elapsedSeconds = mod.GetMatchTimeElapsed();
        const counts = PayloadCore.getAlivePlayersInProximity(PayloadCore.state.payloadPosition, PayloadConfig.pushProximityRadius);

        if (counts.t1.length > counts.t2.length) {
            PayloadCore.pushForward(counts);
            PayloadCore.onPayloadMoved();
            PayloadCore.state.overtime = true;
        } else if (counts.t2.length > counts.t1.length) {
            PayloadCore.pushBackward(counts);
            PayloadCore.onPayloadMoved();
            PayloadCore.state.overtime = false;
        } else if (counts.t1.length > 0 && counts.t2.length > 0) {
            PayloadCore.setPayloadState(PayloadStateType.CONTESTED);
            PayloadSounds.playPayloadIdleSound();
            PayloadCore.state.overtime = true;
        } else {
            PayloadCore.setPayloadState(PayloadStateType.IDLE);
            PayloadSounds.playPayloadIdleSound();
            PayloadCore.state.overtime = false;
        }

        PayloadSounds.updateSoundPositions();
        PayloadUI.updatePlayerCountUI(counts.t1.length, counts.t2.length);

        if (PayloadCore.state.lastElapsedSeconds != Math.floor(elapsedSeconds)) {
            PayloadCore.state.lastElapsedSeconds = Math.floor(elapsedSeconds);
            for (const p of counts.t1) {
                if (PayloadCore.state.payloadState == PayloadStateType.ADVANCING) {
                    PayloadSounds.playPayloadProgressingSound(p);
                    PayloadScoring.awardObjectivePoints(p, PayloadConfig.objectiveScorePerSecond);
                } else if (PayloadCore.state.payloadState == PayloadStateType.PUSHING_BACK) {
                    PayloadSounds.playPayloadReversingSound(p);
                }
            }
            for (const p of counts.t2) {
                if (PayloadCore.state.payloadState == PayloadStateType.PUSHING_BACK) {
                    PayloadSounds.playPayloadProgressingSound(p);
                    PayloadScoring.awardObjectivePoints(p, PayloadConfig.objectiveScorePerSecond);
                } else if (PayloadCore.state.payloadState == PayloadStateType.ADVANCING) {
                    PayloadSounds.playPayloadReversingSound(p);
                }
            }

            PayloadCore.state.pastTickRates.shift();
            PayloadCore.state.pastTickRates.push(PayloadCore.state.ticks);
            const newTickrate = PayloadCore.state.pastTickRates.reduce((a, b) => a + b) / PayloadCore.state.pastTickRates.length;
            if (newTickrate != PayloadCore.state.tickrate && Math.abs(newTickrate - PayloadCore.state.tickrate) > 5) {
                PayloadCore.state.tickrate = newTickrate;
            }
            PayloadCore.state.ticks = 0;
            PayloadCore.executeEverySecond();
        }
        PayloadCore.state.ticks++;
        if (PayloadConfig.enableDebug) {
            PayloadUI.updateDebugUI();
        }
    }

    public static OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
        if (mod.CompareVehicleName(eventVehicle, mod.VehicleList.M2Bradley)) {
            mod.ForcePlayerExitVehicle(mod.GetVehicleFromPlayer(eventPlayer));
            mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.payload.objective.exit_message), eventPlayer);
        }
    }

    public static OngoingPlayer(eventPlayer: mod.Player): void {
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) return;
        if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
            && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsCrouching)
            && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
        ) {
            mod.SetTeam(eventPlayer, mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(2)) ? mod.GetTeam(1) : mod.GetTeam(2));
        }
        if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInVehicle)) {
            if (mod.CompareVehicleName(mod.GetVehicleFromPlayer(eventPlayer), mod.VehicleList.M2Bradley)) {
                mod.ForcePlayerExitVehicle(mod.GetVehicleFromPlayer(eventPlayer));
                mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.payload.objective.exit_message), eventPlayer);
            }
        }
        PayloadCore.playerEndState(eventPlayer);
    }

    public static playerEndState(eventPlayer: mod.Player): void {
        if (!PayloadCore.state.gameOngoing && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) {
            mod.SetPlayerMaxHealth(eventPlayer, 500);
            mod.Heal(eventPlayer, 500);
        } else if (!PayloadCore.state.gameOngoing && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsManDown)) {
            mod.ForceRevive(eventPlayer);
        }
    }

    public static OnPlayerUndeploy(eventPlayer: mod.Player): void {
        mod.SkipManDown(eventPlayer, false);
        mod.SetVariable(mod.ObjectVariable(eventPlayer, PayloadPlayerVars.OutofBounds), false);
    }
}
