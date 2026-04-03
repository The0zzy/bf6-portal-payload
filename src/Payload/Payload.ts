import { Events } from 'bf6-portal-utils/events';
import { PayloadCore } from './PayloadCore.ts';

export class Payload {
    private static subscribed = false;

    public static init(): void {
        if (Payload.subscribed) {
            return;
        }

        PayloadCore.OnGameModeStarted();

        // SECTION: Tick-based events
        Events.OngoingGlobal.subscribe(() => {
            PayloadCore.OngoingGlobal();
        });

        Events.OngoingPlayer.subscribe(async (eventPlayer: mod.Player) => {
            PayloadCore.checkTeamSwitchConditions(eventPlayer);
            PayloadCore.playerEndState(eventPlayer);
        });


        Events.OnPlayerDied.subscribe((victim: mod.Player, killer: mod.Player) => {
            PayloadCore.OnPlayerDied(victim, killer);
        });

        Events.OnPlayerEarnedKillAssist.subscribe((player: mod.Player, assistOn: mod.Player) => {
            PayloadCore.OnPlayerEarnedKillAssist(player, assistOn);
        });

        Events.OnPlayerLeaveGame.subscribe((playerId: number) => {
            PayloadCore.OnPlayerLeaveGame(playerId);
        });

        Events.OnPlayerJoinGame.subscribe((eventPlayer: mod.Player) => {
            PayloadCore.OnPlayerJoinGame(eventPlayer);
        });

        Events.OnPlayerEnterAreaTrigger.subscribe((eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) => {
            PayloadCore.OnPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger);
        });

        Events.OnPlayerExitAreaTrigger.subscribe(async (eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) => {
            await PayloadCore.OnPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger);
        });

        Events.OnPlayerDeployed.subscribe((eventPlayer: mod.Player) => {
            PayloadCore.OnPlayerDeployed(eventPlayer);
        });

        Events.OnRevived.subscribe((victim: mod.Player, reviver: mod.Player) => {
            PayloadCore.OnRevived(victim, reviver);
        });

        Events.OnPlayerUndeploy.subscribe((eventPlayer: mod.Player) => {
            PayloadCore.OnPlayerUndeploy(eventPlayer);
        });

        Payload.subscribed = true;
    }
}
