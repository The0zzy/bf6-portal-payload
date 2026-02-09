export enum PayloadState {
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
}

export interface State {
    lastElapsedSeconds: any;
    progress: number;
    firstAttackerSpawned: boolean;
    payloadState: PayloadState;
    payloadPosition: mod.Vector;
    waypoints: Map<number, PayloadWaypoint>;
    reachedWaypointIndex: number;
    isOvertime: boolean;
    payloadObjects: mod.Object[];
    totalDistanceInMeters: number;
    reachedCheckpointIndex: number;
    maxCheckpoints: number;
    currentCheckpoint: number;
    checkpointStartTime: number;
    progressInMeters: number;
    progressInPercent: number;
    playerScores: Map<number, PlayerScoring>;
}

export const STATE: State = {
    lastElapsedSeconds: 0,
    progress: 0,
    firstAttackerSpawned: false,
    payloadState: PayloadState.IDLE,
    waypoints: new Map<number, PayloadWaypoint>(),
    reachedWaypointIndex: 0,
    isOvertime: false,
    payloadObjects: [],
    totalDistanceInMeters: 0,
    reachedCheckpointIndex: 0,
    maxCheckpoints: 0,
    currentCheckpoint: 0,
    checkpointStartTime: 0,
    payloadPosition: mod.CreateVector(0, 0, 0),
    progressInMeters: 0,
    progressInPercent: 0,
    playerScores: new Map<number, PlayerScoring>(),
};
