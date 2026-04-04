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
    containerWidget: mod.UIWidget;
}

export interface PlayerData extends PlayerScoring, PlayerUIData {}

export class PayloadState {
    public static readonly instance: PayloadState = new PayloadState();

    public ticks = 0;
    public tickrate = 30;
    public pastTickRates: number[] = [30, 30, 30, 30, 30];
    public checkpointIndexes: number[] = [];
    public lastElapsedSeconds = 0;
    public progress = 0;
    public firstAttackerSpawned = false;
    public payloadState = PayloadMovementState.IDLE;
    public payloadPosition = mod.CreateVector(0, 0, 0);
    public waypoints: PayloadWaypoint[] = [];
    public reachedWaypointIndex = 0;
    public isOvertime = false;
    public payloadSpatials: Map<number, mod.Object> = new Map<number, mod.Object>();
    public payloadObjectives: Map<number, mod.Object> = new Map<number, mod.Object>();
    public payloadVfx: Map<number, mod.VFX> = new Map<number, mod.VFX>();
    public totalDistanceInMeters = 0;
    public reachedCheckpointIndex = 0;
    public maxCheckpoints = 0;
    public currentCheckpoint = 0;
    public checkpointStartTime = 0;
    public progressInMeters = 0;
    public progressInPercent = 0;
    public playerData: Map<number, PlayerData> = new Map<number, PlayerData>();
    public playersInPushProximity: Map<number, mod.Player[]> = new Map<number, mod.Player[]>();
    public payloadRotation = mod.CreateVector(0, 0, 0);
    public segmentT = 0;
    public splineTable: { t: number; distance: number }[] | null = null;
    public segmentDistance = 0;
    public checkpointSpatials: Map<string, mod.Object> = new Map<string, mod.Object>();
    public checkpointObjectives: Map<string, mod.CapturePoint> = new Map<string, mod.CapturePoint>();
    public checkpointVfx: Map<string, mod.VFX> = new Map<string, mod.VFX>();

    // Runtime values moved from config to state.
    public overtime = false;
    public gameOngoing = true;

    // Runtime-populated payload spatial config moved from config to state.
    public payloadSpatialsConfig: SpatialConfig[] = [];

    private constructor() {}
}
