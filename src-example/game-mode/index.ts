import { CONFIG } from './config.ts';
import { gameState, resetGameState, updateTeamScore } from './state.ts';
import { broadcastMessage, formatTime } from './utilities.ts';

export class GameMode {
    /**
     * Called when the game mode is initialized.
     */
    initialize(): void {
        console.log("Game Mode Initialized");
        resetGameState();

        // Set match time limit
        mod.SetGameModeTimeLimit(CONFIG.timeLimitMinutes * 60);

        // Broadcast start message
        broadcastMessage(mod.Message(mod.stringkeys.gameMode.notifications.matchStart));
    }

    /**
     * Called every tick globally.
     */
    ongoingGlobal(): void {
        if (gameState.isPaused) return;

        // Check for time limit manually if needed
        const remainingTime = mod.GetMatchTimeRemaining();
        if (remainingTime <= 0) {
            this.onTimeLimitReached();
        }
    }

    /**
     * Called every tick for each player.
     */
    ongoingPlayer(player: mod.Player): void {
        // Handle player-specific logic every tick
    }

    /**
     * Called when a player deploys into the field.
     */
    onPlayerDeployed(player: mod.Player): void {
        const teamId = mod.GetObjId(mod.GetTeam(player));
        console.log(`Player ${mod.GetObjId(player)} deployed on team ${teamId}`);
    }

    /**
     * Called when a player dies.
     */
    onPlayerDied(player: mod.Player, killer: mod.Player | null): void {
        if (killer) {
            const killerTeamId = mod.GetObjId(mod.GetTeam(killer));
            updateTeamScore(killerTeamId, 1);

            // Check for win condition
            const teamState = gameState.teams.get(killerTeamId);
            if (teamState && teamState.score >= CONFIG.targetScore) {
                this.endMatch(killerTeamId);
            }
        }
    }

    /**
     * Called when a player joins the game.
     */
    onPlayerJoinGame(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        gameState.players.set(playerId, { kills: 0, deaths: 0, assists: 0 });
        broadcastMessage(mod.Message(mod.stringkeys.gameMode.notifications.playerJoined, player));
    }

    /**
     * Called when a player leaves the game.
     */
    onPlayerLeaveGame(playerId: number): void {
        gameState.players.delete(playerId);
        // Note: For leave events, we only have the ID, so we might not be able to show the name
        // unless we stored it in the gameState.
    }

    /**
     * Called when the time limit for the match is reached.
     */
    onTimeLimitReached(): void {
        console.log("Time limit reached!");

        // Determine winner
        let winningTeamId: number | null = null;
        let maxScore = -1;

        gameState.teams.forEach((state, teamId) => {
            if (state.score > maxScore) {
                maxScore = state.score;
                winningTeamId = teamId;
            }
        });

        this.endMatch(winningTeamId);
    }

    /**
     * Ends the match and declares a winner.
     */
    private endMatch(winningTeamId: number | null): void {
        if (gameState.winnerTeamId !== null) return;

        gameState.winnerTeamId = winningTeamId;
        gameState.isPaused = true;

        if (winningTeamId !== null) {
            broadcastMessage(mod.Message(mod.stringkeys.gameMode.ui.winnerAnnouncement, winningTeamId));
            const winnerTeam = mod.GetTeam(winningTeamId);
            mod.EndGameMode(winnerTeam);
        } else {
            broadcastMessage(mod.Message(mod.stringkeys.gameMode.ui.drawAnnouncement));
            // End with neutral result if possible
            mod.EndGameMode(mod.GetTeam(0));
        }
    }
}
