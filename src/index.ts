import { Payload } from './Payload/Payload.ts';

export function OnGameModeStarted(): void {
    Payload.init();
}

export function OnPlayerDied(victim: mod.Player, killer: mod.Player): void {
    Payload.onPlayerDied(victim, killer);
}

export function OnPlayerEarnedKillAssist(player: mod.Player, assistOn: mod.Player): void {
    Payload.onPlayerEarnedKillAssist(player, assistOn);
}

export function OnPlayerLeaveGame(playerId: number): void {
    Payload.onPlayerLeaveGame(playerId);
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    Payload.onPlayerJoinGame(eventPlayer);
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): void {
    Payload.onPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger);
}

export async function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger): Promise<void> {
    await Payload.onPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger);
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    Payload.onPlayerDeployed(eventPlayer);
}

export function OnRevived(victim: mod.Player, reviver: mod.Player): void {
    Payload.onRevived(victim, reviver);
}

export function OngoingGlobal(): void {
    Payload.ongoingGlobal();
}

export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    Payload.onPlayerEnterVehicle(eventPlayer, eventVehicle);
}

export function OngoingPlayer(eventPlayer: mod.Player): void {
    Payload.ongoingPlayer(eventPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    Payload.onPlayerUndeploy(eventPlayer);
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
    Payload.onVehicleSpawned(eventVehicle);
}

export function OngoingVehicle(eventVehicle: mod.Vehicle): void {
    Payload.ongoingVehicle(eventVehicle);
}
