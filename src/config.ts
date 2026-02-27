export interface SpatialConfig {
    prefab: any;
    relativeOffset: mod.Vector;
    scale: mod.Vector;
    rotation: mod.Vector;
}

export interface ObjectiveConfig {
    prefab: any;
    relativeOffset: mod.Vector;
    scale: mod.Vector;
    rotation: mod.Vector;
}

export interface VfxConfig {
    prefab: any;
    relativeOffset: mod.Vector;
    scale: number;
    rotation: mod.Vector;
    color1: mod.Vector;
    color2: mod.Vector;
    speed: number;
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
    payloadSpatials: SpatialConfig[];
    payloadObjectives: ObjectiveConfig[];
    payloadVfx: VfxConfig[];
    checkpointSpatials: SpatialConfig[];
    checkpointObjectives: ObjectiveConfig[];
    checkpointVfx: VfxConfig[];
    enableVehicleSpawner: boolean;
    payloadVehicleType: mod.VehicleList;
    spatialRespawnInterval: number;
}

export const CONFIG: Config = {
    gameModeTime: 60 * 60, // 60 minutes
    defaultCheckpointTime: 450, // 7.5 minutes
    enablePayloadSound: true,
    pushProximityRadius: 7.5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.035, //0.035 0.220
    payloadSpeedMultiplierT2: 0.015, //0.015 0.220
    objectiveScorePerSecond: 5,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
    enableVehicleSpawner: false,
    payloadVehicleType: mod.VehicleList.M2Bradley,
    payloadSpatials: [
        //{ prefab: mod.RuntimeSpawn_Common.CrateAmmo_01_StackA, relativeOffset: mod.CreateVector(0, 1.1, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
        { prefab: mod.RuntimeSpawn_Abbasid.GM1083CargoTruck_01_Canopy, relativeOffset: mod.CreateVector(0, -0.1, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ],
    payloadObjectives: [
        { prefab: mod.RuntimeSpawn_Common.MCOM, relativeOffset: mod.CreateVector(0, 1.1, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ],
    payloadVfx: [
        { prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1.5, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 1), color2: mod.CreateVector(1, 1, 1), speed: 1 },
    ],
    checkpointSpatials: [],
    checkpointObjectives: [
        // { prefab: mod.RuntimeSpawn_Common.CapturePoint, relativeOffset: mod.CreateVector(0, -2, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ],
    checkpointVfx: [
        { prefab: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 0), color2: mod.CreateVector(0, 1, 0), speed: 1 },
    ],
    spatialRespawnInterval: 5
};
