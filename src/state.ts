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

export interface State {
    progress: number;
    firstAttackerSpawned: boolean;
    payloadState: PayloadState;
    payloadPosition: mod.Vector;
    waypoints: Map<number, PayloadWaypoint>;
    reachedWaypointIndex: number;
    isOvertime: boolean;
    payloadObject: mod.Object | undefined;
    totalDistanceInMeters: number;
    reachedCheckpointIndex: number;
    maxCheckpoints: number;
    currentCheckpoint: number;
    checkpointStartTime: number;
    progressInMeters: number;
    progressInPercent: number;
}

export const STATE: State = {
    progress: 0,
    firstAttackerSpawned: false,
    payloadState: PayloadState.IDLE,
    waypoints: new Map<number, PayloadWaypoint>(),
    reachedWaypointIndex: 0,
    isOvertime: false,
    payloadObject: undefined,
    totalDistanceInMeters: 0,
    reachedCheckpointIndex: 0,
    maxCheckpoints: 0,
    currentCheckpoint: 0,
    checkpointStartTime: 0,
    payloadPosition: mod.CreateVector(0, 0, 0),
    progressInMeters: 0,
    progressInPercent: 0,
};
