export interface TeamState {
    score: number;
    playerCount: number;
}

export interface PlayerState {
    kills: number;
    deaths: number;
    assists: number;
}

export interface GameState {
    teams: Map<number, TeamState>;
    players: Map<number, PlayerState>;
    startTime: number;
    isPaused: boolean;
    winnerTeamId: number | null;
}

export const gameState: GameState = {
    teams: new Map(),
    players: new Map(),
    startTime: 0,
    isPaused: true,
    winnerTeamId: null,
};

export function updateTeamScore(teamId: number, points: number): void {
    const team = gameState.teams.get(teamId);
    if (team) {
        team.score += points;
    }
}

export function resetGameState(): void {
    gameState.teams.clear();
    gameState.players.clear();
    gameState.startTime = Date.now();
    gameState.isPaused = false;
    gameState.winnerTeamId = null;
}
