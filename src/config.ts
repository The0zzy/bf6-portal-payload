export interface PayloadObjectConfig {
    prefab: any;
    relativeOffset: mod.Vector;
    initialSize: mod.Vector;
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
    payloadObjects: PayloadObjectConfig[];
}

export const CONFIG: Config = {
    gameModeTime: 60 * 60, // 60 minutes
    defaultCheckpointTime: 450, // 7.5 minutes
    enablePayloadSound: true,
    pushProximityRadius: 7.5,
    waypointProximityRadius: 0.25,
    speedAdditionPerPushingPlayer: 0.005,
    payloadSpeedMultiplierT1: 0.035,
    payloadSpeedMultiplierT2: 0.015,
    objectiveScorePerSecond: 5,
    overtimeDuration: 60,
    overtimeEnabled: true,
    enableDebug: true,
    payloadObjects: [
        { prefab: mod.RuntimeSpawn_Common.MCOM, relativeOffset: mod.CreateVector(0, 3, 0), initialSize: mod.CreateVector(1, 1, 1) },
        { prefab: mod.RuntimeSpawn_Common.FX_Gadget_DeployableMortar_Target_Area, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(2.5, 1, 2.5) },
        // { prefab: mod.RuntimeSpawn_Common.FX_Gadget_AmmoCrate_Area, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(2.5, 1, 2.5) },
        // { prefab: mod.RuntimeSpawn_Common.FX_Gadget_VehicleSupplyCrate_Range_Indicator, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(2.5, 1, 2.5) },
        // { prefab: mod.RuntimeSpawn_Common.FX_Gadget_VehicleSupplyCrate_Range_Indicator_Upgraded, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(2.5, 1, 2.5) },
        // { prefab: mod.RuntimeSpawn_Common.CrateAmmo_01_StackA, relativeOffset: mod.CreateVector(0, 0, 0), initialSize: mod.CreateVector(1.3, 1.3, 1.3) }
    ],
};
