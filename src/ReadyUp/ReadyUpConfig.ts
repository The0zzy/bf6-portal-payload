export interface ReadyUpSystemConfig {
    preRoundCountdownDurationSeconds: number;
    finalCountdownDurationSeconds: number;
}

export interface ResolvedReadyUpSystemConfig {
    preRoundCountdownDurationSeconds: number;
    finalCountdownDurationSeconds: number;
}

export class ReadyUpConfig {
    public static readonly goldColour = mod.CreateVector(1, 0.8, 0);
    public static readonly goldBgColour = mod.CreateVector(0.5, 0.4, 0);

    public static resolve(config: ReadyUpSystemConfig): ResolvedReadyUpSystemConfig {
        return {
            preRoundCountdownDurationSeconds: config.preRoundCountdownDurationSeconds,
            finalCountdownDurationSeconds: config.finalCountdownDurationSeconds,
        };
    }
}
