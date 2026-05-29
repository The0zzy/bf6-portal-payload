export interface ReadyUpPlayerData {
    isReady: boolean;
}

class ReadyUpPlayerState implements ReadyUpPlayerData {
    public isReady = false;
}

export class ReadyUpState {
    public static readonly instance: ReadyUpState = new ReadyUpState();

    public isPreRound = false;
    public preRoundCountdownActive = false;
    public preRoundCountdownRemaining = 0;
    public preRoundCountdownToken = 0;
    public playerData: Map<number, ReadyUpPlayerData> = new Map<number, ReadyUpPlayerData>();

    private constructor() { }

    public reset(): void {
        this.isPreRound = true;
        this.preRoundCountdownActive = false;
        this.preRoundCountdownRemaining = 0;
        this.preRoundCountdownToken = 0;
        this.playerData.clear();
    }

    public static getPlayerData(player: mod.Player | number): ReadyUpPlayerData {
        const playerId = typeof player === 'number' ? player : mod.GetObjId(player);
        if (!ReadyUpState.instance.playerData.has(playerId)) {
            ReadyUpState.instance.playerData.set(playerId, new ReadyUpPlayerState());
        }

        return ReadyUpState.instance.playerData.get(playerId)!;
    }
}
