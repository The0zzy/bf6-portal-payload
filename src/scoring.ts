import { STATE, type PlayerScoring } from './state.ts';

export function scoring_initScoreboard(): void {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardColumnWidths(1, 1, 1, 1, 1);
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.payload.scoreboard.team1),
        mod.Message(mod.stringkeys.payload.scoreboard.team2)
    );
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.payload.scoreboard.objective),
        mod.Message(mod.stringkeys.payload.scoreboard.kills),
        mod.Message(mod.stringkeys.payload.scoreboard.assists),
        mod.Message(mod.stringkeys.payload.scoreboard.deaths),
        mod.Message(mod.stringkeys.payload.scoreboard.revives)
    );
    // mod.SetScoreboardSorting(1);
    scoring_refreshScoreboard();
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

export function scoring_refreshScoreboard(): void {
    const allPlayers = mod.AllPlayers();
    const playerCount = mod.CountOf(allPlayers);
    for (let i = 0; i < playerCount; i++) {
        const player = mod.ValueInArray(allPlayers, i) as mod.Player;
        const score = scoring_getOrCreatePlayerScore(player);
        mod.SetScoreboardPlayerValues(player, score.objective, score.kills, score.assists, score.deaths, score.revives);
    }
}

export function scoring_updatePlayerScore(player: mod.Player, type: keyof PlayerScoring, amount: number): void {
    const score = scoring_getOrCreatePlayerScore(player);
    let scoreTypeString = mod.stringkeys.payload.scoreboard.objective;
    switch (type) {
        case 'objective':
            score.objective += amount;
            scoreTypeString = mod.stringkeys.payload.scoreboard.objective;
            break;
        case 'kills':
            score.kills += amount;
            scoreTypeString = mod.stringkeys.payload.scoreboard.kills;
            break;
        case 'assists':
            score.assists += amount;
            scoreTypeString = mod.stringkeys.payload.scoreboard.assists;
            break;
        case 'deaths':
            score.deaths += amount;
            scoreTypeString = mod.stringkeys.payload.scoreboard.deaths;
            break;
        case 'revives':
            score.revives += amount;
            scoreTypeString = mod.stringkeys.payload.scoreboard.revives;
            break;
    }
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.scoreboard.message, player, amount, scoreTypeString));
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
