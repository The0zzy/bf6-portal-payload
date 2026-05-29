export class ReadyUpSounds {
    private static initialized = false;
    private static preRoundCountdownBeep: mod.SFX;
    private static countdown: mod.SFX;
    private static impact: mod.SFX;

    public static init(): void {
        if (ReadyUpSounds.initialized) {
            return;
        }
        ReadyUpSounds.initialized = true;

        ReadyUpSounds.preRoundCountdownBeep = mod.SpawnObject(
            mod.RuntimeSpawn_Common.SFX_UI_Shared_Countdown_Tick_OneShot2D,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(0, 0, 0)
        );
        ReadyUpSounds.countdown = mod.SpawnObject(
            mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_Intro_Countdown_Final_OneShot2D,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(0, 0, 0)
        );
        ReadyUpSounds.impact = mod.SpawnObject(
            mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_Intro_FinalImpact_OneShot2D,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(0, 0, 0)
        );
    }

    public static playPreRoundCountdownBeep(): void {
        mod.PlaySound(ReadyUpSounds.preRoundCountdownBeep, 1);
    }

    public static playFinalCountdown(): void {
        mod.PlaySound(ReadyUpSounds.countdown, 0.6);
    }

    public static playImpactSound(): void {
        mod.PlaySound(ReadyUpSounds.impact, 0.6);
    }
}
