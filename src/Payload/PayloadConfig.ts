export interface SpatialConfig {
    prefab: mod.RuntimeSpawn_Common | mod.RuntimeSpawn_Abbasid | mod.RuntimeSpawn_Tungsten;
    relativeOffset: mod.Vector;
    scale: mod.Vector;
    rotation: mod.Vector;
}

export interface ObjectiveConfig {
    prefab: mod.RuntimeSpawn_Common;
    relativeOffset: mod.Vector;
    scale: mod.Vector;
    rotation: mod.Vector;
}

export interface VfxConfig {
    prefab: mod.RuntimeSpawn_Common;
    relativeOffset: mod.Vector;
    scale: number;
    rotation: mod.Vector;
    color1: mod.Vector;
    color2: mod.Vector;
    speed: number;
}

export interface PayloadSpeedConfig {
    meterPerSecond: number;
    meterPerSecondPerPlayer: number;
}

export class PayloadConfig {
    public static readonly enableTeamSwitch = true;
    public static readonly payloadSpatialIdentifiers: number[] = [5000, 5001];
    public static readonly gameModeTime = 60 * 60;
    public static readonly defaultCheckpointTime = 450;
    public static readonly enablePayloadSound = true;
    public static readonly pushProximityRadius = 7.5;
    public static readonly payloadSpeedT1: PayloadSpeedConfig = { meterPerSecond: 6.05, meterPerSecondPerPlayer: 0.25 };
    public static readonly payloadSpeedT2: PayloadSpeedConfig = { meterPerSecond: 0.45, meterPerSecondPerPlayer: 0.0 };
    public static readonly objectiveScorePerSecond = 5;
    public static readonly overtimeDuration = 60;
    public static readonly enableOvertime = true;
    public static readonly enableDebug = false;
    public static readonly spatialRespawnInterval = 5;

    public static readonly payloadObjectives: ObjectiveConfig[] = [
        { prefab: mod.RuntimeSpawn_Common.MCOM, relativeOffset: mod.CreateVector(0, 0.7, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ];

    public static readonly payloadVfx: VfxConfig[] = [
        { prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1.5, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 1), color2: mod.CreateVector(1, 1, 1), speed: 1 },
    ];

    public static readonly checkpointSpatials: SpatialConfig[] = [];

    public static readonly checkpointObjectives: ObjectiveConfig[] = [
        { prefab: mod.RuntimeSpawn_Common.CapturePoint, relativeOffset: mod.CreateVector(0, -5.8, 0), scale: mod.CreateVector(1, 1, 1), rotation: mod.CreateVector(0, 0, 0) },
    ];

    public static readonly checkpointVfx: VfxConfig[] = [
        { prefab: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom, relativeOffset: mod.CreateVector(0, 0, 0), scale: 1, rotation: mod.CreateVector(0, 0, 0), color1: mod.CreateVector(1, 1, 0), color2: mod.CreateVector(0, 1, 0), speed: 1 },
    ];
}

export class PayloadPlayerVars {
    public static readonly UniquePlayerID = 0;
    public static readonly PlayArea = 1;
    public static readonly OutofBounds = 2;
    public static readonly OOBTimer = 3;
}
