import { Payload } from './Payload/Payload.ts';
import { Events } from 'bf6-portal-utils/events';

enum GameModes {
    Payload = 1
}

Events.OnGameModeStarted.subscribe(async () => {
    mod.EnableAllPlayerDeploy(false);
    // pick a random GameMode from the list of GameModes to determine which mode to initialize.
    const gameModeValues = Object.values(GameModes).filter(value => typeof value === 'number') as number[];
    const currentGameMode = gameModeValues[Math.floor(Math.random() * gameModeValues.length)];

    if (currentGameMode === GameModes.Payload) {
        Payload.init();
    }
    await mod.Wait(4);
    mod.EnableAllPlayerDeploy(true);
});
