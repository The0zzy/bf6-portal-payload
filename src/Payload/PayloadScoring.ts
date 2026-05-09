import { PayloadState, type PlayerScoring } from './PayloadState.ts';

export class PayloadScoring {
    public static initScoreboard(): void {
        mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
        // adapting column widths due to temporary removal of 
        // assists and revives from the scoreboard (due to bugs)
        // mod.SetScoreboardColumnWidths(1, 1, 1, 1, 1);
        mod.SetScoreboardColumnWidths(1, 1, 1, 0, 0);
        mod.SetScoreboardHeader(
            mod.Message(mod.stringkeys.payload.scoreboard.team1),
            mod.Message(mod.stringkeys.payload.scoreboard.team2)
        );
        mod.SetScoreboardColumnNames(
            mod.Message(mod.stringkeys.payload.scoreboard.objective),
            mod.Message(mod.stringkeys.payload.scoreboard.kills),
            mod.Message(mod.stringkeys.payload.scoreboard.deaths),
            // assists are currently not working (bug raised)
            mod.Message(mod.stringkeys.payload.scoreboard.assists),
            //revives are currently not working (bug raised)
            mod.Message(mod.stringkeys.payload.scoreboard.revives)
        );
        PayloadScoring.refreshScoreboard();
    }

    public static refreshScoreboard(): void {
        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);
        for (let i = 0; i < playerCount; i++) {
            const player = mod.ValueInArray(allPlayers, i) as mod.Player;
            const score = PayloadState.getPlayerData(player);
            mod.SetScoreboardPlayerValues(player, score.objective, score.kills, score.deaths, score.assists, score.revives);
        }
    }

    public static updatePlayerScore(player: mod.Player, type: keyof PlayerScoring, amount: number): void {
        const score = PayloadState.getPlayerData(player);
        switch (type) {
            case 'objective':
                score.objective += amount;
                break;
            case 'kills':
                score.kills += amount;
                break;
            case 'assists':
                score.assists += amount;
                break;
            case 'deaths':
                score.deaths += amount;
                break;
            case 'revives':
                score.revives += amount;
                break;
        }
        mod.SetScoreboardPlayerValues(player, score.objective, score.kills, score.deaths, score.assists, score.revives);
    }

    public static onPlayerDied(victim: mod.Player, killer: mod.Player): void {
        PayloadScoring.updatePlayerScore(victim, 'deaths', 1);
        if (!mod.Equals(mod.GetTeam(victim), mod.GetTeam(killer))) {
            PayloadScoring.updatePlayerScore(killer, 'kills', 1);
        }
    }

    public static onPlayerRevived(victim: mod.Player, reviver: mod.Player): void {
        PayloadScoring.updatePlayerScore(reviver, 'revives', 1);
    }

    public static onPlayerEarnedAssist(player: mod.Player): void {
        PayloadScoring.updatePlayerScore(player, 'assists', 1);
    }

    public static awardObjectivePoints(player: mod.Player, amount: number): void {
        PayloadScoring.updatePlayerScore(player, 'objective', amount);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.objective.score_message, amount), player);
    }
}
