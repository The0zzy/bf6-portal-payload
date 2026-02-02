export function initCheckpointTimer(initialRemaining: number): void {
    const mins = mod.Floor(initialRemaining / 60);
    const secs = mod.Floor(mod.Modulo(initialRemaining, 60));

    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;

    mod.AddUIText(
        "checkpoint_timer",
        mod.CreateVector(0, 50, 0),
        mod.CreateVector(400, 50, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(
            timerKey,
            mins,
            mod.Floor(secs / 10),
            mod.Modulo(secs, 10)
        )
    );
}

export function updateCheckpointTimer(remainingTime: number): void {
    const timerWidget = mod.FindUIWidgetWithName("checkpoint_timer");
    if (timerWidget) {
        const mins = mod.Floor(remainingTime / 60);
        const secs = mod.Floor(mod.Modulo(remainingTime, 60));
        const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;

        mod.SetUITextLabel(
            timerWidget,
            mod.Message(
                timerKey,
                mins,
                mod.Floor(secs / 10),
                mod.Modulo(secs, 10)
            )
        );
    }
}