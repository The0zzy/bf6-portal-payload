export function getPlayersByTeam(teamId: number): mod.Player[] {
    const allPlayers = mod.AllPlayers();
    const count = mod.CountOf(allPlayers);
    const result: mod.Player[] = [];

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(allPlayers, i) as mod.Player;
        if (mod.GetObjId(mod.GetTeam(player)) === teamId) {
            result.push(player);
        }
    }
    return result;
}

export function isPlayerAlive(player: mod.Player): boolean {
    return mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
}

export function broadcastMessage(message: mod.Message): void {
    mod.DisplayHighlightedWorldLogMessage(message);
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
