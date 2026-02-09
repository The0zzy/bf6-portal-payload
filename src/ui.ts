import { STATE } from "./state.ts";

export function updateCheckpointTimer(remainingTime: number): void {
    const mins = mod.Floor(remainingTime / 60);
    const secs = mod.Floor(mod.Modulo(remainingTime, 60));
    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time1"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time2"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
}

let friendlycolour = mod.CreateVector(0, 0.8, 1); //0, 0.8, 1
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.15, 0.3);
let enemybgcolour = mod.CreateVector(0.4, 0, 0);
let goldcolour = mod.CreateVector(1, 0.8, 0);
let goldbgcolour = mod.CreateVector(0.5, 0.4, 0);


export function uiSetup(): void {
    // Container setup
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    // Payload status
    mod.AddUIText("payloadstatus", mod.CreateVector(0, 30, 0), mod.CreateVector(200, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center);
    mod.AddUIContainer("progress_background1", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress1", mod.CreateVector(150, 0, 0), mod.CreateVector(6 * STATE.progressInPercent, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress_background2", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("progress2", mod.CreateVector(150, 0, 0), mod.CreateVector(6 * STATE.progressInPercent, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("checkpoint0", mod.CreateVector(146, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIText("remaining_time1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("remaining_time2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIText("percentage1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("percentage2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));

    //Checkpoints distance on progress UI
    for (let i = 1; i < STATE.waypoints.size; i++) {
        if (STATE.waypoints.get(i)!.isCheckpoint) {
            mod.AddUIContainer("checkpoint" + i,
                mod.CreateVector(146 + (6 * ((STATE.waypoints.get(i)!.distance / STATE.totalDistanceInMeters) * 100)), -5, 0),
                mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
        }
    }

}

export function updateUI(): void {
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress1"), mod.CreateVector(6 * STATE.progressInPercent, 20, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress2"), mod.CreateVector(6 * STATE.progressInPercent, 20, 0));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage1"), mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage2"), mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress_background1"), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress_background2"), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0));
}



export async function updateCheckpointUI(): Promise<void> {
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.AddUIText("checkpointreached", mod.CreateVector(0, 100, 0), mod.CreateVector(500, 80, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, goldbgcolour, 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.checkpoints.blankmessage), 52, goldcolour, 1, mod.UIAnchor.Center);
    for (let i = 0; i < 500; i += 25) {
        mod.SetUIWidgetSize(mod.FindUIWidgetWithName("checkpointreached"), mod.CreateVector(i, 80, 0));
        await mod.Wait(0.033);
    }
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("checkpointreached"), mod.CreateVector(500, 80, 0));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("checkpointreached"), mod.Message(mod.stringkeys.payload.checkpoints.message));
    await mod.Wait(6);
    mod.SetUITextLabel(mod.FindUIWidgetWithName("checkpointreached"), mod.Message(mod.stringkeys.payload.checkpoints.blankmessage));
    for (let i = 500; i > 0; i -= 25) {
        mod.SetUIWidgetSize(mod.FindUIWidgetWithName("checkpointreached"), mod.CreateVector(i, 80, 0));
        await mod.Wait(0.033);
    }
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("checkpointreached"));
}

export function deleteUI(): void {
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("container"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("payloadstatus"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress1"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress2"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress_background1"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress_background2"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("checkpoint0"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("remaining_time1"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("remaining_time2"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("percentage1"));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("percentage2"));
    for (let i = 1; i < STATE.waypoints.size; i++) {
        if (STATE.waypoints.get(i)!.isCheckpoint) {
            mod.DeleteUIWidget(mod.FindUIWidgetWithName("checkpoint" + i));
        }
    }
}

// WORKAROUND FOR BUGGED UI WHEN PLAYER JOINS MID-GAME
export function ui_onPlayerJoinGame(): void {
    deleteUI();
    uiSetup();
}
