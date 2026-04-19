export interface SpatialConfig {
    prefab: mod.RuntimeSpawn_Common | mod.RuntimeSpawn_Abbasid | mod.RuntimeSpawn_Tungsten | mod.RuntimeSpawn_Subsurface;
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

export interface UIConfig {
    readonly friendlyColour: mod.Vector;
    readonly enemyColour: mod.Vector;
    readonly friendlyBgColour: mod.Vector;
    readonly enemyBgColour: mod.Vector;
    readonly goldColour: mod.Vector;
    readonly goldBgColour: mod.Vector;
    readonly whiteColour: mod.Vector;
    readonly progressBarWidth: number;
    readonly progressBarMultiplier: number;
    readonly progressBarLeftOffset: number;
    readonly progressBarRightOffset: number;
    readonly statusFontSize: number;
    readonly lockedFontSize: number;
}

export class PayloadConfig {
    /** Whether team switching is enabled */
    public static readonly enableTeamSwitch = true;

    /** Identifiers for payload spatial objects (IDs determine the type of payload object spawned) */
    public static readonly payloadSpatialIdentifiers: number[] = [5000, 5001, 5002];

    /** Maximum duration of the game mode in seconds 
     * Note: The game should end when the payload reaches the end of the track, 
     * but this serves as a safety net to prevent excessively long games in case of issues
    */
    public static readonly maxGameModeTime = 60 * 60;

    /** Random game score to prevent default game ending behavior */
    public static readonly gameModeTargetScore = 1000;

    /** Default time for each sector to reach next checkpoint in seconds 
     * Default: 450 (7.5 minutes in seconds), can be adjusted based on the length of the track and desired pacing
    */
    public static readonly defaultCheckpointTime = 450;

    /** Whether the payload should emit sound effects when moving or pushing */
    public static readonly enablePayloadSound = true;

    /** Radius within which players can push the payload */
    public static readonly pushProximityRadius = 7.5;

    /** The speed of the payload mapped to the team ID */
    public static readonly payloadSpeed: Map<number, PayloadSpeedConfig> = new Map([
        [1, { meterPerSecond: 1.05, meterPerSecondPerPlayer: 0.25 }],
        [2, { meterPerSecond: 0.45, meterPerSecondPerPlayer: 0.0 }]
    ]);

    /** Score awarded per second of pushing the payload */
    public static readonly objectiveScorePerSecond = 5;

    /** Duration of overtime in seconds */
    public static readonly overtimeDuration = 60;

    /** Whether overtime is enabled */
    public static readonly enableOvertime = true;

    /** Whether debug mode is enabled */
    public static readonly enableDebug = true;

    /** Interval for spatial respawn in seconds (to prevent destruction of objects) */
    public static readonly spatialRespawnInterval = 5;

    /** Grace period for out-of-bounds players in seconds */
    public static readonly oobGracePeriod = 5;

    /** Configuration for objectives that should be spawned at around the payload position */
    public static readonly payloadObjectives: ObjectiveConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.MCOM,
            relativeOffset: mod.CreateVector(0, 0.7, 0),
            scale: mod.CreateVector(1, 1, 1),
            rotation: mod.CreateVector(0, 0, 0)
        },
    ];

    /** Configuration for VFX that should be spawned at around the payload position */
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

    /** Configuration for checkpoint spatials to be spawned at around the checkpoint position */
    public static readonly checkpointSpatials: SpatialConfig[] = [];

    /** Configuration for checkpoint objectives to be spawned at around the checkpoint position */
    public static readonly checkpointObjectives: ObjectiveConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.CapturePoint,
            relativeOffset: mod.CreateVector(0, -5.8, 0),
            scale: mod.CreateVector(1, 1, 1),
            rotation: mod.CreateVector(0, 0, 0)
        },
    ];

    /** Configuration for checkpoint VFX to be spawned at around the checkpoint position */
    public static readonly checkpointVfx: VfxConfig[] = [
        {
            prefab: mod.RuntimeSpawn_Common.FX_Smoke_Marker_Custom,
            relativeOffset: mod.CreateVector(0, 0, 0),
            scale: 1,
            rotation: mod.CreateVector(0, 0, 0),
            color1: mod.CreateVector(1, 1, 0), // yellow for upcoming checkpoints
            color2: mod.CreateVector(0, 1, 0), // green for reached checkpoints
            speed: 1
        },
    ];

    /** UI theme and layout constants */
    public static readonly uiConfig: UIConfig = {
        friendlyColour: mod.CreateVector(0, 0.7, 1),
        enemyColour: mod.CreateVector(1, 0.2, 0.2),
        friendlyBgColour: mod.CreateVector(0, 0.15, 0.3),
        enemyBgColour: mod.CreateVector(0.4, 0, 0),
        goldColour: mod.CreateVector(1, 0.8, 0),
        goldBgColour: mod.CreateVector(0.5, 0.4, 0),
        whiteColour: mod.CreateVector(1, 1, 1),
        progressBarWidth: 600,
        progressBarMultiplier: 6,
        progressBarLeftOffset: 150,
        progressBarRightOffset: 152,
        statusFontSize: 38,
        lockedFontSize: 28,
    };
}