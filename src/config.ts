export interface PayloadObjectConfig {
    prefab: any;
    relativeOffset: mod.Vector;
    initialSize: mod.Vector;
}

export interface Config {
    gameModeTime: number;
    defaultCheckpointTime: number;
    enablePayloadSound: boolean;
    pushProximityRadius: number;
    waypointProximityRadius: number;
    speedAdditionPerPushingPlayer: number;
    payloadSpeedMultiplierT1: number;
    payloadSpeedMultiplierT2: number;
    objectiveScorePerSecond: number;
    overtimeDuration: number;
    overtimeEnabled: boolean;
    enableDebug: boolean;
    payloadObjects: PayloadObjectConfig[];
    checkpointFx: mod.RuntimeSpawn_Common;
    checkpointNeutralColor: mod.Vector;
    checkpointCapturedColor: mod.Vector;
    enableVehicleSpawner: boolean;
}

export const CONFIG: Config = {
    gameModeTime: 60 * 60, // 60 minutes
    defaultCheckpointTime: 450, // 7.5 minutes
    enablePayloadSound: true,
    pushProximityRadius: 7.5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.035, //0.035 0.250
    payloadSpeedMultiplierT2: 0.015,
    objectiveScorePerSecond: 5,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
    enableVehicleSpawner: false,
    payloadObjects: [
        { prefab: mod.RuntimeSpawn_Common.MCOM, relativeOffset: mod.CreateVector(0, 1.5, 0), initialSize: mod.CreateVector(1, 1, 1) },
        { prefab: mod.RuntimeSpawn_Common.CrateAmmo_01_StackA, relativeOffset: mod.CreateVector(0, 1.5, 0), initialSize: mod.CreateVector(1, 1, 1) },
        { prefab: mod.RuntimeSpawn_Abbasid.GM1083CargoTruck_01_Canopy, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(1, 1, 1) },
        { prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(2.5, 1, 2.5) },
    ],
    checkpointFx: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom,
    checkpointNeutralColor: mod.CreateVector(1, 1, 1),
    checkpointCapturedColor: mod.CreateVector(0, 1, 0)
};
