import { Events } from 'bf6-portal-utils/events';
import { PayloadCore } from './PayloadCore.ts';
import { PayloadUI } from './PayloadUI.ts';
import { PayloadWeather } from './PayloadWeather.ts';
import { PayloadState } from './PayloadState.ts';
import { PayloadScoring } from './PayloadScoring.ts';

export class Payload {
    private static subscribed = false;

    public static init(): void {
        if (Payload.subscribed) {
            return;
        }

        PayloadCore.init();

        // SECTION: Tick-based events
        Events.OngoingGlobal.subscribe(() => {
            PayloadCore.executeEveryTick();
        });

        Events.OngoingPlayer.subscribe((eventPlayer: mod.Player) => {
            PayloadCore.checkTeamSwitchConditions(eventPlayer);
            PayloadCore.playerEndState(eventPlayer);
        });

        Events.OnPlayerLeaveGame.subscribe((playerId: number) => {
            PayloadUI.clearPlayerUI(playerId);
            PayloadState.instance.playerData.delete(playerId);
        });

        Events.OnPlayerJoinGame.subscribe(async (eventPlayer: mod.Player) => {
            if (
                !PayloadState.instance.gameOngoing ||
                mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)
            ) return;

            // if refreshing UI/visual elements too early, they won't refresh correctly
            // TODO: find a more elegant solution than using an arbitrary timeout
            await mod.Wait(5);
            PayloadUI.rebuildUI();
            PayloadWeather.resetWeatherVFX();
        });

        Events.OnPlayerEnterAreaTrigger.subscribe((eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) => {
            const playerData = PayloadState.getPlayerData(eventPlayer);
            playerData.playArea += 1;
            const nextCheckpointAreaTriggerId = PayloadState.instance.reachedCheckpointIndex + 1 + 600;
            if (mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(1))) {
                if (mod.GetObjId(eventAreaTrigger) > (nextCheckpointAreaTriggerId)) {
                    PayloadUI.outOfBoundsUI(eventPlayer);
                } else {
                    playerData.outOfBounds = false;
                }
            } else {
                if (mod.GetObjId(eventAreaTrigger) < (nextCheckpointAreaTriggerId)) {
                    PayloadUI.outOfBoundsUI(eventPlayer);
                } else {
                    playerData.outOfBounds = false;
                }
            }
        });

        Events.OnPlayerExitAreaTrigger.subscribe(async (eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) => {
            const playerData = PayloadState.getPlayerData(eventPlayer);
            playerData.playArea -= 1;
            await mod.Wait(0.066);
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) {
                if (playerData.playArea <= 0) {
                    PayloadUI.outOfBoundsUI(eventPlayer);
                }
            }
        });

        Events.OnPlayerDeployed.subscribe((eventPlayer: mod.Player) => {
            const data = PayloadState.getPlayerData(eventPlayer);
            mod.SkipManDown(eventPlayer, false);
            if (!data.hasDeployed && !mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
                data.hasDeployed = true;
                PayloadScoring.refreshScoreboard();
                PayloadCore.applyCheckpointFx();
                PayloadCore.updatePayloadVfx(true);
                PayloadUI.DeployBoundsCheck(eventPlayer);
            }
        });

        Events.OnPlayerUndeploy.subscribe((eventPlayer: mod.Player) => {
            mod.SkipManDown(eventPlayer, false);
            const playerData = PayloadState.getPlayerData(eventPlayer);
            playerData.outOfBounds = false;
        });

        Events.OnPlayerDied.subscribe((victim: mod.Player, killer: mod.Player) => {
            PayloadScoring.onPlayerDied(victim, killer);
        });

        Events.OnPlayerEarnedKillAssist.subscribe((player: mod.Player, assistOn: mod.Player) => {
            PayloadScoring.onPlayerEarnedAssist(player);
        });

        Events.OnRevived.subscribe((victim: mod.Player, reviver: mod.Player) => {
            PayloadScoring.onPlayerRevived(victim, reviver);
        });

        Payload.subscribed = true;
    }
}
