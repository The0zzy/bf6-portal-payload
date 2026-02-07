import { STATE } from "./state.ts";

export function initCheckpointTimer(initialRemaining: number): void {
    const mins = mod.Floor(initialRemaining / 60);
    const secs = mod.Floor(mod.Modulo(initialRemaining, 60));

    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;

    mod.AddUIText(
        "checkpoint_timer",
        mod.CreateVector(350, 45, 0),
        mod.CreateVector(70, 30, 0),
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
    const mins = mod.Floor(remainingTime / 60);
    const secs = mod.Floor(mod.Modulo(remainingTime, 60));
    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time1"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time2"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
}

let friendlycolour = mod.CreateVector(0, 0.4, 1); //0, 0.8, 1
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.15, 0.3);
let enemybgcolour = mod.CreateVector(0.4, 0, 0);




export function uiSetup(): void {
    // Container setup
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    // Payload status
    mod.AddUIText("payloadstatus", mod.CreateVector(0, 30, 0), mod.CreateVector(200, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center);
    mod.AddUIContainer("progress_background1", mod.CreateVector(0, 5, 0), mod.CreateVector(600, 10, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress1", mod.CreateVector(150, 0, 0), mod.CreateVector(6 * STATE.progressInPercent, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlycolour, 1, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress_background2", mod.CreateVector(0, 5, 0), mod.CreateVector(600, 10, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("progress2", mod.CreateVector(150, 0, 0), mod.CreateVector(6 * STATE.progressInPercent, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemycolour, 1, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("checkpoint1", mod.CreateVector(146, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIContainer("checkpoint2", mod.CreateVector(750, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIContainer("checkpoint3", mod.CreateVector(300, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIText("remaining_time1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("remaining_time2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIText("percentage1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.RoundToInteger(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("percentage2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.RoundToInteger(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
}

export function updateUI(): void {
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress1"), mod.CreateVector(6 * STATE.progressInPercent, 20, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress2"), mod.CreateVector(6 * STATE.progressInPercent, 20, 0));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage1"), mod.Message(mod.stringkeys.payload.state.percentage, mod.RoundToInteger(STATE.progressInPercent)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage2"), mod.Message(mod.stringkeys.payload.state.percentage, mod.RoundToInteger(STATE.progressInPercent)));
}