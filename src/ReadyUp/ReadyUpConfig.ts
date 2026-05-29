export interface ReadyUpTextConfig {
    title: () => mod.Message;
    startingIn: (seconds: number) => mod.Message;
    ready: () => mod.Message;
    unready: () => mod.Message;
    switchTeam: () => mod.Message;
    team1: () => mod.Message;
    team2: () => mod.Message;
    playerName: (player: mod.Player) => mod.Message;
    countdown: (seconds: number) => mod.Message;
    objectiveTitle: () => mod.Message;
}

export interface ReadyUpStyleConfig {
    goldColour: mod.Vector;
    goldBgColour: mod.Vector;
}

export interface ReadyUpSystemConfig {
    preRoundCountdownDurationSeconds: number;
    finalCountdownDurationSeconds: number;
    text: ReadyUpTextConfig;
    style?: Partial<ReadyUpStyleConfig>;
}

export interface ResolvedReadyUpSystemConfig {
    preRoundCountdownDurationSeconds: number;
    finalCountdownDurationSeconds: number;
    text: ReadyUpTextConfig;
    style: ReadyUpStyleConfig;
}

export class ReadyUpConfig {
    public static readonly defaultStyle: ReadyUpStyleConfig = {
        goldColour: mod.CreateVector(1, 0.8, 0),
        goldBgColour: mod.CreateVector(0.5, 0.4, 0),
    };

    public static resolve(config: ReadyUpSystemConfig): ResolvedReadyUpSystemConfig {
        return {
            preRoundCountdownDurationSeconds: config.preRoundCountdownDurationSeconds,
            finalCountdownDurationSeconds: config.finalCountdownDurationSeconds,
            text: config.text,
            style: {
                ...ReadyUpConfig.defaultStyle,
                ...config.style,
            },
        };
    }
}
