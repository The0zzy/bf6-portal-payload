import { Payload } from './Payload/Payload.ts';
import { PayloadConfig } from './Payload/PayloadConfig.ts';
import { ReadyUpSystem } from './ReadyUp/ReadyUpSystem.ts';
import { Events } from 'bf6-portal-utils/events';

enum GameModes {
    Payload = 1,
    // TDM = 2,
    // Conquest = 3,
    // Domination = 4,
    // VIPDeathmatch = 5,
    // LoadoutDeathmatch = 6,
    // TeamGunMaster = 7,
    // Chainlink = 8,
    // Frontlines = 9,
    // Rush = 10,
    // Breakthrough = 11,
}

Events.OnGameModeStarted.subscribe(async () => {
    mod.EnableAllPlayerDeploy(false);
    // pick a random GameMode from the list of GameModes to determine which mode to initialize.
    const gameModeValues = Object.values(GameModes).filter(value => typeof value === 'number') as number[];
    const currentGameMode = gameModeValues[Math.floor(Math.random() * gameModeValues.length)];

    if (currentGameMode === GameModes.Payload) {
        if (PayloadConfig.enableCompetitiveMode) {
            new ReadyUpSystem(
                () => Payload.init(),
                {
                    preRoundCountdownDurationSeconds: PayloadConfig.preRoundCountdownDurationSeconds,
                    finalCountdownDurationSeconds: 10,
                    text: {
                        title: () => mod.Message(mod.stringkeys.payload.preRound.title),
                        startingIn: (seconds: number) => mod.Message(mod.stringkeys.payload.preRound.startingIn, seconds),
                        ready: () => mod.Message(mod.stringkeys.payload.preRound.ready),
                        unready: () => mod.Message(mod.stringkeys.payload.preRound.unready),
                        switchTeam: () => mod.Message(mod.stringkeys.payload.preRound.switchTeam),
                        team1: () => mod.Message(mod.stringkeys.payload.preRound.team1),
                        team2: () => mod.Message(mod.stringkeys.payload.preRound.team2),
                        playerName: (player: mod.Player) => mod.Message(mod.stringkeys.payload.preRound.playerName, player),
                        countdown: (seconds: number) => mod.Message(mod.stringkeys.payload.preRound.countdown, seconds),
                        objectiveTitle: () => mod.Message(mod.stringkeys.payload.objective.title),
                    },
                    style: {
                        goldColour: PayloadConfig.uiConfig.goldColour,
                        goldBgColour: PayloadConfig.uiConfig.goldBgColour,
                    },
                }
            );
        } else {
            Payload.init();
        }
    }
    await mod.Wait(4);
    mod.EnableAllPlayerDeploy(true);
});
