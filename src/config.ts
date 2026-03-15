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
    payloadSpatialIdentifiers: number[];
    gameModeTime: number;
    defaultCheckpointTime: number;
    enablePayloadSound: boolean;
    pushProximityRadius: number;
    waypointProximityRadius: number;
    speedAdditionPerPushingPlayer: number;
    payloadSpeedT1: number;
    payloadSpeedT2: number;
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
    payloadSpatialIdentifiers: [5000, 5001],
    gameModeTime: 60 * 60, // 60 minutes
    defaultCheckpointTime: 450, // 7.5 minutes
    enablePayloadSound: true,
    pushProximityRadius: 7.5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.15,
    payloadSpeedT1: 1.05, //6
    payloadSpeedT2: 0.45, //6
    objectiveScorePerSecond: 5,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
    enableVehicleSpawner: false,
    payloadVehicleType: mod.VehicleList.M2Bradley,
    payloadSpatials: [],
    payloadObjectives: [
        { prefab: mod.RuntimeSpawn_Common.MCOM, relativeOffset: mod.CreateVector(0, 0.9, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ],
    payloadVfx: [
        { prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1.5, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 1), color2: mod.CreateVector(1, 1, 1), speed: 1 },
    ],
    checkpointSpatials: [],
    checkpointObjectives: [
        { prefab: mod.RuntimeSpawn_Common.CapturePoint, relativeOffset: mod.CreateVector(0, -5, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ],
    checkpointVfx: [
        { prefab: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 0), color2: mod.CreateVector(0, 1, 0), speed: 1 },
    ],
    spatialRespawnInterval: 5
};
