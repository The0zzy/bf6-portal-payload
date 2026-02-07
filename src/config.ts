export interface Config {
    gameModeTime: number;
    defaultCheckpointTime: number;
    enablePayloadSound: boolean;
    pushProximityRadius: number;
    waypointProximityRadius: number;
    speedAdditionPerPushingPlayer: number;
    payloadSpeedMultiplierT1: number;
    payloadSpeedMultiplierT2: number;
    overtimeDuration: number;
    overtimeEnabled: boolean;
    enableDebug: boolean;
}

export const CONFIG: Config = {
    gameModeTime: 60 * 60, // 60 minutes
    defaultCheckpointTime: 450, // 7.5 minutes
    enablePayloadSound: true,
    pushProximityRadius: 5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.095, //0.035
    payloadSpeedMultiplierT2: 0.015,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
};
