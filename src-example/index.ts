import { GameMode } from './game-mode/index.ts';

let gameMode: GameMode | undefined;

// This will trigger every sever tick.
export function OngoingGlobal(): void {
    // Do something minimal every tick. Remember, this gets called 30 times per second.
    gameMode?.ongoingGlobal();
}

// This will trigger every sever tick, for each Player.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    // Handle player-specific logic every tick
    gameMode?.ongoingPlayer(eventPlayer);
}

// This will trigger at the start of the gamemode.
export function OnGameModeStarted(): void {
    // Initialize the example game mode
    gameMode = new GameMode();
    gameMode.initialize();
}

// This will trigger whenever a Player deploys.
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    gameMode?.onPlayerDeployed(eventPlayer);
}

// This will trigger whenever a Player dies.
export function OnPlayerDied(
    eventPlayer: mod.Player, // The player who died.
    eventOtherPlayer: mod.Player, // The player who killed the player who died.
    eventDeathType: mod.DeathType, // The type of death.
    eventWeaponUnlock: mod.WeaponUnlock // The weapon that killed the player who died.
): void {
    gameMode?.onPlayerDied(eventPlayer, eventOtherPlayer);
}

// This will trigger when a Player joins the game.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    gameMode?.onPlayerJoinGame(eventPlayer);
}

// This will trigger when any player leaves the game.
export function OnPlayerLeaveGame(eventNumber: number): void {
    gameMode?.onPlayerLeaveGame(eventNumber);
}

// This will trigger when a Player changes team.
export function OnPlayerSwitchTeam(eventPlayer: mod.Player, eventTeam: mod.Team): void {
    // Note: The example GameMode doesn't handle this explicitly yet, 
    // but you can add gameMode.onPlayerSwitchTeam(eventPlayer, eventTeam) and implement it if needed.
}

// This will trigger when the gamemode time limit has been reached.
export function OnTimeLimitReached(): void {
    gameMode?.onTimeLimitReached();
}