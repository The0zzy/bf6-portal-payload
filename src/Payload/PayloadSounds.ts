import { PayloadState } from './PayloadState.ts';

export class PayloadSounds {
    private static VOModule1: mod.VO;
    private static VOModule2: mod.VO;

    private static soundCheckpoint: mod.SFX;
    private static progressSound: mod.SFX;
    private static reverseSound: mod.SFX;
    private static payloadMoving: mod.SFX;
    private static payloadIdle: mod.SFX;
    private static OOBSound: mod.SFX;

    private static winning1 = false;
    private static winning2 = false;
    private static nearend = false;
    private static lowtime = false;
    private static nearendVO = false;
    private static idle = false;
    private static payloadenabled = true;
    private static lastSoundUpdatePos: mod.Vector = mod.CreateVector(0, 0, 0);
    private static musicPlayed = false;

    public static init(): void {
        PayloadSounds.VOModule1 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        PayloadSounds.VOModule2 = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

        PayloadSounds.soundCheckpoint = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_AreaUnlock_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        PayloadSounds.progressSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickIcon_IsFriendly_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        PayloadSounds.reverseSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));
        PayloadSounds.OOBSound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_OutOfBounds_Countdown_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(0, 0, 0));

        PayloadSounds.payloadMoving = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gamemodes_Payload_Breacher_Exterior_Accel_SimpleLoop3D, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));
        PayloadSounds.payloadIdle = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_Gamemodes_Payload_Breacher_Idle_SimpleLoop3D, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1));

        mod.LoadMusic(mod.MusicPackages.Core);
        mod.SetMusicParam(mod.MusicParams.Core_Amplitude, 1);
        mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
    }

    public static playCheckpointReachedSound(): void {
        PayloadSounds.nearend = false;
        PayloadSounds.lowtime = false;
        PayloadSounds.nearendVO = false;
        mod.PlaySound(PayloadSounds.soundCheckpoint, 0.7);
        mod.PlayMusic(mod.MusicEvents.Core_PhaseBegin);
        if (PayloadState.instance.reachedCheckpointIndex == (PayloadState.instance.checkpointIndexes.length - 2)) {
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.CheckPointMovingToLastFriendly, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.CheckPointMovingToLastEnemy, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        } else if (PayloadState.instance.reachedCheckpointIndex == 1) {
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.CheckPointFriendly, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.CheckPointEnemy, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        } else {
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.CheckPointFriendlyAnother, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.CheckPointEnemyAnother, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        }
    }

    public static VOPushing(): void {
        if (!PayloadSounds.payloadenabled) return;
        if (PayloadSounds.idle || !PayloadSounds.winning1) {
            PayloadSounds.playPayloadMovingSound();
            PayloadSounds.idle = false;
        }
        if (!PayloadSounds.winning1) {
            PayloadSounds.winning1 = true;
            PayloadSounds.winning2 = false;
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        }
    }

    public static VOPushingBack(): void {
        if (!PayloadSounds.payloadenabled) return;
        if (PayloadSounds.idle || !PayloadSounds.winning2) {
            PayloadSounds.playPayloadMovingSound();
            PayloadSounds.idle = false;
        }
        if (!PayloadSounds.winning2) {
            PayloadSounds.winning2 = true;
            PayloadSounds.winning1 = false;
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
        }
    }

    public static stopPayloadSound(): void {
        PayloadSounds.payloadenabled = false;
        mod.StopSound(PayloadSounds.payloadMoving);
        mod.StopSound(PayloadSounds.payloadIdle);
    }

    public static playPayloadMovingSound(): void {
        mod.StopSound(PayloadSounds.payloadIdle);
    }

    public static playPayloadIdleSound(): void {
        if (!PayloadSounds.payloadenabled) return;
        if (!PayloadSounds.idle) {
            mod.StopSound(PayloadSounds.payloadMoving);
            PayloadSounds.idle = true;
            PayloadSounds.lastSoundUpdatePos = PayloadState.instance.payloadPosition;
            mod.SetObjectTransform(PayloadSounds.payloadIdle, mod.CreateTransform(PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0)));
        }
    }

    public static async updateSoundPositions(): Promise<void> {
        if (mod.DistanceBetween(PayloadState.instance.payloadPosition, PayloadSounds.lastSoundUpdatePos) > 1.5) {
            PayloadSounds.lastSoundUpdatePos = PayloadState.instance.payloadPosition;
            mod.SetObjectTransform(PayloadSounds.payloadMoving, mod.CreateTransform(PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0)));
        }
    }

    public static async playLowTimeVO(): Promise<void> {
        if (!PayloadSounds.lowtime) {
            PayloadSounds.lowtime = true;
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        }
    }

    public static async playNearEndVO(): Promise<void> {
        if (!PayloadSounds.nearendVO) {
            PayloadSounds.nearendVO = true;
            mod.PlayVO(PayloadSounds.VOModule1, mod.VoiceOverEvents2D.ProgressLateWinning, mod.VoiceOverFlags.Alpha, mod.GetTeam(1));
            mod.PlayVO(PayloadSounds.VOModule2, mod.VoiceOverEvents2D.ProgressLateLosing, mod.VoiceOverFlags.Alpha, mod.GetTeam(2));
        }
    }

    public static async playNearEndMusic(): Promise<void> {
        if (!PayloadSounds.nearend) {
            PayloadSounds.nearend = true;
            mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop);
        }
    }

    public static playPayloadReversingSound(player: mod.Player): void {
        mod.PlaySound(PayloadSounds.reverseSound, 0.3, player);
    }

    public static playPayloadProgressingSound(player: mod.Player): void {
        mod.PlaySound(PayloadSounds.progressSound, 0.3, player);
    }

    public static endGameMusic(team: number): void {
        if (PayloadSounds.musicPlayed) return;
        PayloadSounds.musicPlayed = true;
        if (PayloadState.instance.progressInPercent > 99) {
            mod.SetMusicParam(mod.MusicParams.Core_IsWinning, team);
        }
        mod.PlayMusic(mod.MusicEvents.Core_EndOfRound_Loop);
    }

    public static playOOBsound(player: mod.Player): void {
        mod.PlaySound(PayloadSounds.OOBSound, 0.6, player);
    }
}
