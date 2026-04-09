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
    /** Whether team switching is enabled */
    public static readonly enableTeamSwitch = true;
    public static readonly payloadSpatialIdentifiers: number[] = [5000, 5001];
    public static readonly maxGameModeTime = 60 * 60; // 60 minutes as a safety net, but the game should end when the payload reaches the end of the track
    public static readonly gameModeTargetScore = 1000;
    public static readonly defaultCheckpointTime = 450; // 7.5 minutes in seconds, can be adjusted based on the length of the track and desired pacing
    public static readonly sectorTimePerMeter = 0.75; // time in seconds that it takes to travel 1 meter, used for dynamic checkpoint time calculation based on the distance between checkpoints

    public static readonly enablePayloadSound = true;
    public static readonly pushProximityRadius = 7.5;
    /**
     * The speed of the payload mapped to the team ID 
     */
    public static readonly payloadSpeed: Map<number, PayloadSpeedConfig> = new Map([
        [1, { meterPerSecond: 6.05, meterPerSecondPerPlayer: 0.25 }],
        [2, { meterPerSecond: 0.45, meterPerSecondPerPlayer: 0.0 }]
    ]);
    public static readonly objectiveScorePerSecond = 5;
    public static readonly overtimeDuration = 60;
    public static readonly enableOvertime = true;
    public static readonly enableDebug = false;
    public static readonly spatialRespawnInterval = 5;
    /** Grace period for out-of-bounds players in seconds */
    public static readonly oobGracePeriod = 5;

    public static readonly payloadObjectives: ObjectiveConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.MCOM,
            relativeOffset: mod.CreateVector(0, 0.7, 0),
            scale: mod.CreateVector(1, 1, 1),
            rotation: mod.CreateVector(0, 0, 0)
        },
    ];

    public static readonly payloadVfx: VfxConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area,
            relativeOffset: mod.CreateVector(0, 0, 0),
            scale: 1.5,
            rotation: mod.CreateVector(0, 0, 0),
            color1: mod.CreateVector(1, 1, 1),
            color2: mod.CreateVector(1, 1, 1),
            speed: 1
        },
    ];

    public static readonly checkpointSpatials: SpatialConfig[] = [];

    public static readonly checkpointObjectives: ObjectiveConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.CapturePoint,
            relativeOffset: mod.CreateVector(0, -5.8, 0),
            scale: mod.CreateVector(1, 1, 1),
            rotation: mod.CreateVector(0, 0, 0)
        },
    ];

    public static readonly checkpointVfx: VfxConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom,
            relativeOffset: mod.CreateVector(0, 0, 0),
            scale: 1,
            rotation: mod.CreateVector(0, 0, 0),
            color1: mod.CreateVector(1, 1, 0),
            color2: mod.CreateVector(0, 1, 0),
            speed: 1
        },
    ];
}