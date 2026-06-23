export interface ReadyUpPlayerData {
    isReady: boolean;
}

class ReadyUpPlayerState implements ReadyUpPlayerData {
    public isReady = false;
}

export class ReadyUpState {
    public static isPreRound = false;
    public static preRoundCountdownActive = false;
    public static preRoundCountdownRemaining = 0;
    public static preRoundCountdownToken = 0;
    public static playerData: Map<number, ReadyUpPlayerData> = new Map<number, ReadyUpPlayerData>();

    public static reset(): void {
        ReadyUpState.isPreRound = true;
        ReadyUpState.preRoundCountdownActive = false;
        ReadyUpState.preRoundCountdownRemaining = 0;
        ReadyUpState.preRoundCountdownToken = 0;
        ReadyUpState.playerData.clear();
    }

    public static getPlayerData(player: mod.Player | number): ReadyUpPlayerData {
        const playerId = typeof player === 'number' ? player : mod.GetObjId(player);
        if (!ReadyUpState.playerData.has(playerId)) {
            ReadyUpState.playerData.set(playerId, new ReadyUpPlayerState());
        }

        return ReadyUpState.playerData.get(playerId)!;
    }
}
