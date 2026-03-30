import { PayloadCore } from './PayloadCore.ts';

export class Payload {
    public static init(): void {
        PayloadCore.OnGameModeStarted();
    }

    public static onPlayerDied(victim: mod.Player, killer: mod.Player): void {
        PayloadCore.OnPlayerDied(victim, killer);
    }

    public static onPlayerEarnedKillAssist(player: mod.Player, assistOn: mod.Player): void {
        PayloadCore.OnPlayerEarnedKillAssist(player, assistOn);
    }

    public static onPlayerLeaveGame(playerId: number): void {
        PayloadCore.OnPlayerLeaveGame(playerId);
    }

    public static onPlayerJoinGame(player: mod.Player): void {
        PayloadCore.OnPlayerJoinGame(player);
    }

    public static onPlayerEnterAreaTrigger(player: mod.Player, trigger: mod.AreaTrigger): void {
        PayloadCore.OnPlayerEnterAreaTrigger(player, trigger);
    }

    public static onPlayerExitAreaTrigger(player: mod.Player, trigger: mod.AreaTrigger): Promise<void> {
        return PayloadCore.OnPlayerExitAreaTrigger(player, trigger);
    }

    public static onPlayerDeployed(player: mod.Player): void {
        PayloadCore.OnPlayerDeployed(player);
    }

    public static onRevived(victim: mod.Player, reviver: mod.Player): void {
        PayloadCore.OnRevived(victim, reviver);
    }

    public static ongoingGlobal(): void {
        PayloadCore.OngoingGlobal();
    }

    public static onPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle): void {
        PayloadCore.OnPlayerEnterVehicle(player, vehicle);
    }

    public static ongoingPlayer(player: mod.Player): void {
        PayloadCore.OngoingPlayer(player);
    }

    public static onPlayerUndeploy(player: mod.Player): void {
        PayloadCore.OnPlayerUndeploy(player);
    }

    public static onVehicleSpawned(vehicle: mod.Vehicle): void {
        PayloadCore.OnVehicleSpawned(vehicle);
    }

    public static ongoingVehicle(vehicle: mod.Vehicle): void {
        PayloadCore.OngoingVehicle(vehicle);
    }
}
