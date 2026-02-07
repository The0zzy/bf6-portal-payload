let VOModule1: mod.VO;
let VOModule2: mod.VO;

let soundCheckpoint: mod.SFX;


export async function initSounds() {
    //Setup VO Modules
    VOModule1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    VOModule2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

    //Setup Sound Object
    soundCheckpoint = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_AreaUnlock_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
}

//Example of how to play a sound
function SomeFunctionInYourExperience() {
    mod.PlayVO(
        VOModule1,
        mod.VoiceOverEvents2D.ObjectiveCaptured,
        mod.VoiceOverFlags.Alpha);
}

export function playCheckpointReachedSound(): void {
    mod.PlaySound(soundCheckpoint, 1);
}

