import { STATE } from "./state.ts";

let VOModule1: mod.VO;
let VOModule2: mod.VO;

let soundCheckpoint: mod.SFX;
let progressSound: mod.SFX;
let reverseSound: mod.SFX;

let winning1 = false;
let winning2 = false;
let nearend = false;
let lowtime = false;
let nearendVO = false;



export async function initSounds() {
    //Setup VO Modules
    VOModule1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    VOModule2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

    //Setup Sound Object
    soundCheckpoint = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_AreaUnlock_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    progressSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    reverseSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

    //Setup Music
    mod.LoadMusic(mod.MusicPackages.Core);
    mod.SetMusicParam(mod.MusicParams.Core_Amplitude, 1);
    mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
}

//Play sound for checkpoint reached
export function playCheckpointReachedSound(): void {
    nearend = false;
    lowtime = false;
    nearendVO = false;
    mod.PlaySound(soundCheckpoint, 1);
    mod.PlayMusic(mod.MusicEvents.Core_PhaseBegin);
    if (STATE.currentCheckpoint == (STATE.maxCheckpoints - 1)) {
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.CheckPointMovingToLastFriendly, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.CheckPointMovingToLastEnemy, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    } else if (STATE.currentCheckpoint == 2) {
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.CheckPointFriendly, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.CheckPointEnemy, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    } else {
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.CheckPointFriendlyAnother, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.CheckPointEnemyAnother, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    }
}

//Play VO for team 1 pushing
export function VOPushing(): void {
    if (!winning1) {
        winning1 = true;
        winning2 = false;
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    }
}

//Play VO for team 2 pushing
export function VOPushingBack(): void {
    if (!winning2) {
        winning2 = true;
        winning1 = false;
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
    }
}

// Play VO for low time
export function playLowTimeVO(): void {
    if (!lowtime) {
        lowtime = true;
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    }
}

// Play VO Near End
export function playNearEndVO(): void {
    if (!nearendVO) {
        nearendVO = true;
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.ProgressLateWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.ProgressLateLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    }
}

//Play Near End Music
export function playNearEndMusic(): void {
    if (!nearend) {
        nearend = true;
        mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop);
    }
}

export function playPayloadReversingSound(location: mod.Vector): void {
    mod.PlaySound(reverseSound, 0.3, location, 50);
}

export function playPayloadProgressingSound(location: mod.Vector): void {
    mod.PlaySound(progressSound, 0.3, location, 50);
}

export function endGameMusic(team: number): void {
    mod.SetMusicParam(mod.MusicParams.Core_IsWinning, team);
    mod.PlayMusic(mod.MusicEvents.Core_EndOfRound_Loop);
}