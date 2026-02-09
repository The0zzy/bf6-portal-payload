import { STATE, type PlayerScoring } from './state.ts';

export function scoring_initScoreboard(): void {
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
        mod.Message(mod.stringkeys.payload.scoring.deaths),
        mod.Message(mod.stringkeys.payload.scoring.revives)
    );
    mod.SetScoreboardColumnWidths(20, 20, 20, 20, 20);

    // Sort by objective (Column 1) descending
    mod.SetScoreboardSorting(1);
}

export function scoring_getOrCreatePlayerScore(player: mod.Player): PlayerScoring {
    const playerId = mod.GetObjId(player);
    if (!STATE.playerScores.has(playerId)) {
        STATE.playerScores.set(playerId, {
            kills: 0,
            assists: 0,
            deaths: 0,
            objective: 0,
            revives: 0
        });
    }
    return STATE.playerScores.get(playerId)!;
}

export function scoring_updatePlayerScore(player: mod.Player, type: keyof PlayerScoring, amount: number): void {
    const score = scoring_getOrCreatePlayerScore(player);
    (score[type] as number) += amount;

    // Update the actual scoreboard values using column indices
    mod.SetScoreboardPlayerValues(player, score.objective, score.kills, score.assists, score.deaths, score.revives);
}

export function scoring_onPlayerDied(victim: mod.Player, killer: mod.Player): void {
    scoring_updatePlayerScore(victim, 'deaths', 1);
    if (!mod.Equals(mod.GetTeam(victim), mod.GetTeam(killer))) {
        scoring_updatePlayerScore(killer, 'kills', 1);
    }
}

export function scoring_onPlayerRevived(reviver: mod.Player, victim: mod.Player): void {
    scoring_updatePlayerScore(reviver, 'revives', 1);
}

export function scoring_onPlayerEarnedAssist(player: mod.Player): void {
    scoring_updatePlayerScore(player, 'assists', 1);
}

export function scoring_awardObjectivePoints(player: mod.Player, amount: number): void {
    scoring_updatePlayerScore(player, 'objective', amount);
}

export function scoring_onPlayerLeave(playerId: number): void {
    if (STATE.playerScores.has(playerId)) {
        STATE.playerScores.delete(playerId);
    }
}
