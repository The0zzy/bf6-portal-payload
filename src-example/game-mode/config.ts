export interface GameModeConfig {
    targetScore: number;
    timeLimitMinutes: number;
    showIntroOnDeploy: boolean;
    respawnDelaySeconds: number;
    teams: {
        id: number;
        name: string;
        color: mod.Vector;
    }[];
}

export const CONFIG: GameModeConfig = {
    targetScore: 50,
    timeLimitMinutes: 10,
    showIntroOnDeploy: true,
    respawnDelaySeconds: 5,
    teams: [
        { id: 1, name: "Alpha", color: mod.CreateVector(0.2, 0.5, 1.0) },
        { id: 2, name: "Bravo", color: mod.CreateVector(1.0, 0.4, 0.2) },
    ],
};
