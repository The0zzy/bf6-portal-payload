import type { SpatialConfig } from './PayloadConfig.ts';

export enum PayloadMovementState {
    IDLE,
    CONTESTED,
    ADVANCING,
    LOCKED,
    PUSHING_BACK
}

export interface PayloadWaypoint {
    position: mod.Vector;
    isCheckpoint: boolean;
    rotation: mod.Vector;
    distance: number;
}

export interface PlayerScoring {
    kills: number;
    assists: number;
    deaths: number;
    objective: number;
    revives: number;
    hasDeployed: boolean;
}

export interface PlayerUIData {
    containerName: string;
    containerWidget: mod.UIWidget | null;
    playArea: number;
    outOfBounds: boolean;
    oobTimer: number;
}

export interface PlayerData extends PlayerScoring, PlayerUIData {
    isReady: boolean;
}

export class PayloadPlayerData implements PlayerData {
    public kills = 0;
    public assists = 0;
    public deaths = 0;
    public objective = 0;
    public revives = 0;
    public hasDeployed = false;
    public containerName = '';
    public containerWidget: mod.UIWidget | null = null;
    public playArea = 0;
    public outOfBounds = false;
    public oobTimer = 0;
    public isReady = false;

    constructor() { }
}

export class PayloadState {
    public static readonly instance: PayloadState = new PayloadState();

    public ticks = 0;
    public tickrate = 30;
    public pastTickRates: number[] = [30, 30, 30, 30, 30];
    /** Array containing the indexes of waypoints that are checkpoints */
    public checkpointIndexes: number[] = [];
    public lastElapsedSeconds = 0;
    public progress = 0;
    public payloadState = PayloadMovementState.IDLE;
    public payloadPosition = mod.CreateVector(0, 0, 0);
    public waypoints: PayloadWaypoint[] = [];
    public reachedWaypointIndex = 0;
    public isOvertime = false;
    public payloadSpatials: Map<number, mod.Object> = new Map<number, mod.Object>();
    public payloadObjectives: Map<number, mod.Object> = new Map<number, mod.Object>();
    public payloadVfx: Map<number, mod.VFX> = new Map<number, mod.VFX>();
    public totalDistanceInMeters = 0;
    /** Stores the current index for checkpointIndexes to identify the last reached waypoint that was a checkpoint */
    public reachedCheckpointIndex = 0;
    public checkpointStartTime = 0;
    public progressInMeters = 0;
    public progressInPercent = 0;
    public playerData: Map<number, PlayerData> = new Map<number, PlayerData>();
    public playersInPushProximity: Map<number, mod.Player[]> = new Map<number, mod.Player[]>();
    public payloadRotation = mod.CreateVector(0, 0, 0);
    public segmentDistance = 0;
    public checkpointSpatials: Map<string, mod.Object> = new Map<string, mod.Object>();
    public checkpointObjectives: Map<string, mod.CapturePoint> = new Map<string, mod.CapturePoint>();
    public checkpointVfx: Map<string, mod.VFX> = new Map<string, mod.VFX>();
    public overtime = false;
    public gameOngoing = false;
    public isPreRound = false;
    public payloadSpatialsConfig: SpatialConfig[] = [];
    public progressBarFlashAlpha = 1;
    public weatherReset: boolean = false;

    private constructor() { }

    public static getPlayerData(player: mod.Player | number): PlayerData {
        const playerId = typeof player === 'number' ? player : mod.GetObjId(player);
        if (!PayloadState.instance.playerData.has(playerId)) {
            PayloadState.instance.playerData.set(playerId, new PayloadPlayerData());
        }
        return PayloadState.instance.playerData.get(playerId)!;
    }
}

