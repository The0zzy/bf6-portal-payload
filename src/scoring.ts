import { STATE, type PlayerScoring } from './state.ts';

export function initScoreboard(): void {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);

    // Configure columns. Column indices are 1-4.
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.payload.scoring.team1),
        mod.Message(mod.stringkeys.payload.scoring.team2)
    );
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.payload.scoring.objective),
        mod.Message(mod.stringkeys.payload.scoring.kills),
        mod.Message(mod.stringkeys.payload.scoring.assists),
        mod.Message(mod.stringkeys.payload.scoring.deaths)
    );
    mod.SetScoreboardColumnWidths(100, 100, 100, 100);

    // Sort by objective (Column 1) descending
    mod.SetScoreboardSorting(1);
}

export function getOrCreatePlayerScore(player: mod.Player): PlayerScoring {
    const playerId = mod.GetObjId(player);
    if (!STATE.playerScores.has(playerId)) {
        STATE.playerScores.set(playerId, {
            kills: 0,
            assists: 0,
            deaths: 0,
            objective: 0
        });
    }
    return STATE.playerScores.get(playerId)!;
}

export function updatePlayerScore(player: mod.Player, type: keyof PlayerScoring, amount: number): void {
    const score = getOrCreatePlayerScore(player);
    (score[type] as number) += amount;

    // Update the actual scoreboard values using column indices
    mod.SetScoreboardPlayerValues(player, score.objective, score.kills, score.assists, score.deaths);
}

export function onPlayerDied(victim: mod.Player, killer: mod.Player): void {
    updatePlayerScore(victim, 'deaths', 1);
    if (!mod.Equals(mod.GetTeam(victim), mod.GetTeam(killer))) {
        updatePlayerScore(killer, 'kills', 1);
    }
}

export function onPlayerEarnedAssist(player: mod.Player): void {
    updatePlayerScore(player, 'assists', 1);
}

export function awardObjectivePoints(player: mod.Player, amount: number): void {
    updatePlayerScore(player, 'objective', amount);
}

export function onPlayerLeave(playerId: number): void {
    if (STATE.playerScores.has(playerId)) {
        STATE.playerScores.delete(playerId);
    }
}
