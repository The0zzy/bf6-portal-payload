import { STATE } from "./state.ts";

let VOModule1: mod.VO;
let VOModule2: mod.VO;

let soundCheckpoint: mod.SFX;
let progressSound: mod.SFX;
let reverseSound: mod.SFX;
let payloadMoving: mod.SFX;
let payloadIdle: mod.SFX;
let door: mod.Object;

let winning1 = false;
let winning2 = false;
let nearend = false;
let lowtime = false;
let nearendVO = false;
let idle = false;
let payloadenabled = true;


export async function initSounds() {
    //Setup VO Modules
    VOModule1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    VOModule2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

    //Setup Sound Object
    soundCheckpoint = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_AreaUnlock_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    progressSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
    reverseSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

    //Payload Sounds
    payloadMoving = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gamemodes_Payload_Breacher_Exterior_Accel_SimpleLoop3D, STATE.payloadPosition, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    payloadIdle = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gamemodes_Payload_Breacher_Idle_SimpleLoop3D, STATE.payloadPosition, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
    door = mod.SpawnObject(mod.RuntimeSpawn_Common.FiringRange_ExitDoor_01, STATE.payloadPosition, mod.CreateVector(0, 0, 0), mod.CreateVector(100, 100, 5));

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MoveObject not working. Transform works, however not moving audio location
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Play VO for team 1 pushing
export function VOPushing(): void {
    //mod.MoveObject(payloadMoving, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    //mod.MoveObject(payloadMoving, mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0));
    mod.SetObjectTransform(door, mod.CreateTransform(mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0)));
    if (!payloadenabled) return;
    if (idle || !winning1) {
        playPayloadMovingSound();
        idle = false;
    }
    if (!winning1) {
        winning1 = true;
        winning2 = false;
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
    }
    //mod.MoveObject(payloadMoving, mod.CreateVector(mod.XComponentOf(STATE.payloadPosition), mod.YComponentOf(STATE.payloadPosition) - 1, mod.ZComponentOf(STATE.payloadPosition)), mod.CreateVector(0, 0, 0));
}

//Play VO for team 2 pushing
export function VOPushingBack(): void {
    //mod.MoveObject(payloadMoving, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    //mod.MoveObject(payloadMoving, mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0));
    //mod.MoveObject(door, mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0));
    if (!payloadenabled) return;
    if (idle || !winning2) {
        playPayloadMovingSound();
        idle = false;
    }
    if (!winning2) {
        winning2 = true;
        winning1 = false;
        mod.PlayVO(VOModule2, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        mod.PlayVO(VOModule1, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
    }
    //mod.MoveObject(payloadMoving, mod.CreateVector(mod.XComponentOf(STATE.payloadPosition), mod.YComponentOf(STATE.payloadPosition) - 1, mod.ZComponentOf(STATE.payloadPosition)), mod.CreateVector(0, 0, 0));
}

export function stopPayloadSound(): void {
    payloadenabled = false;
    mod.StopSound(payloadMoving);
    mod.StopSound(payloadIdle);
}

export function playPayloadMovingSound(): void {
    mod.PlaySound(payloadMoving, 1, STATE.payloadPosition, 50);
    mod.StopSound(payloadIdle);
    mod.SetObjectTransform(payloadMoving, mod.CreateTransform(mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0)));
    mod.SetObjectTransform(door, mod.CreateTransform(mod.CreateVector(-265.994, 84.692, -260.654), mod.CreateVector(0, 0, 0)));
}

export function playPayloadIdleSound(): void {
    //mod.MoveObject(payloadIdle, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    //mod.MoveObject(payloadIdle, mod.CreateVector(-342.899, 84.692, -242.237), mod.CreateVector(0, 0, 0));
    //mod.MoveObject(door, mod.CreateVector(-342.899, 84.692, -242.237), mod.CreateVector(0, 0, 0));
    if (!payloadenabled) return;
    if (!idle) {
        mod.PlaySound(payloadIdle, 1, STATE.payloadPosition, 50);
        mod.StopSound(payloadMoving);
        idle = true;
        mod.SetObjectTransform(payloadIdle, mod.CreateTransform(mod.CreateVector(-342.899, 84.692, -242.237), mod.CreateVector(0, 0, 0)));
        mod.SetObjectTransform(door, mod.CreateTransform(mod.CreateVector(-342.899, 84.692, -242.237), mod.CreateVector(0, 0, 0)));
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