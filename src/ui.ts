export function initCheckpointTimer(initialRemaining: number): void {
    const mins = mod.Floor(initialRemaining / 60);
    const secs = mod.Floor(mod.Modulo(initialRemaining, 60));

    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;

    mod.AddUIText(
        "checkpoint_timer",
        mod.CreateVector(0, 100, 0),
        mod.CreateVector(300, 50, 0),
        mod.UIAnchor.TopCenter,
        mod.Message(
            timerKey,
            mins,
            mod.Floor(secs / 10),
            mod.Modulo(secs, 10)
        )
    );

    const timer = mod.FindUIWidgetWithName("checkpoint_timer");

    mod.SetUIWidgetBgColor(timer, mod.CreateVector(0, 0, 0));
    mod.SetUIWidgetBgAlpha(timer, 0.8);
    mod.SetUITextSize(timer, 26);
    mod.SetUITextColor(timer, mod.CreateVector(1, 1, 1));
    mod.SetUITextAlpha(timer, 1);
    mod.SetUITextAnchor(timer, mod.UIAnchor.Center);
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

let friendlycolour = mod.CreateVector(0, 0.8, 1);
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.2, 0.5);
let enemybgcolour = mod.CreateVector(0.6, 0.1, 0.1);




export function uiSetup(): void {
    // Container setup
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(2000, 2000, 0), mod.UIAnchor.TopCenter);
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    // Payload status
    mod.AddUIText("payloadstatus", mod.CreateVector(0, 50, 0), mod.CreateVector(200, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center);
    mod.AddUIContainer("progressbackground", mod.CreateVector(0, 0, 0), mod.CreateVector(600, 5, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.6, 0.1, 0.1), 0.8, mod.UIBgFill.Solid);
    mod.AddUIContainer("progress", mod.CreateVector(0, 0, 0), mod.CreateVector(10, 5, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0, 0.6, 1), 1, mod.UIBgFill.Solid);
}
