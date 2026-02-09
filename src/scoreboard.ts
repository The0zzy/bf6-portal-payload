import { deleteUI, uiSetup } from "./ui.ts";

export enum PlayerVar {
    Distance = 0,
    Kills = 1,
    Deaths = 2,
    Assists = 3,
    Revives = 4,
}

export function initScoreboard(): void {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardColumnWidths(1, 1, 1, 1, 1);
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.payload.scoreboard.attackers),
        mod.Message(mod.stringkeys.payload.scoreboard.defenders)
    );
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.payload.scoreboard.push_score),
        mod.Message(mod.stringkeys.payload.scoreboard.kills),
        mod.Message(mod.stringkeys.payload.scoreboard.deaths),
        mod.Message(mod.stringkeys.payload.scoreboard.assists),
        mod.Message(mod.stringkeys.payload.scoreboard.revives)
    );
}

export function onPlayerJoinGame(player: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(player, PlayerVar.Distance), 0);
    mod.SetVariable(mod.ObjectVariable(player, PlayerVar.Kills), 0);
    mod.SetVariable(mod.ObjectVariable(player, PlayerVar.Deaths), 0);
    mod.SetVariable(mod.ObjectVariable(player, PlayerVar.Assists), 0);
    mod.SetVariable(mod.ObjectVariable(player, PlayerVar.Revives), 0);
    deleteUI();
    uiSetup();
}

export function updateScoreboard(player: mod.Player): void {
    mod.SetScoreboardPlayerValues(
        player,
        mod.GetVariable(mod.ObjectVariable(player, PlayerVar.Distance)),
        mod.GetVariable(mod.ObjectVariable(player, PlayerVar.Kills)),
        mod.GetVariable(mod.ObjectVariable(player, PlayerVar.Deaths)),
        mod.GetVariable(mod.ObjectVariable(player, PlayerVar.Assists)),
        mod.GetVariable(mod.ObjectVariable(player, PlayerVar.Revives))
    );
}

export function onPlayerEarnedKill(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Kills), mod.GetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Kills)) + 1);
    updateScoreboard(eventPlayer);
}

export function onPlayerDied(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Deaths), mod.GetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Deaths)) + 1);
    updateScoreboard(eventPlayer);
}

export function onPlayerAssisted(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Assists), mod.GetVariable(mod.ObjectVariable(eventPlayer, PlayerVar.Assists)) + 1);
    updateScoreboard(eventPlayer);
}

export function onPlayerRevived(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    mod.SetVariable(mod.ObjectVariable(eventOtherPlayer, PlayerVar.Revives), mod.GetVariable(mod.ObjectVariable(eventOtherPlayer, PlayerVar.Revives)) + 1);
    updateScoreboard(eventOtherPlayer);
}