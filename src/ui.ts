import { PayloadState, STATE } from "./state.ts";

export function updateCheckpointTimer(remainingTime: number): void {
    const mins = mod.Floor(remainingTime / 60);
    const secs = mod.Floor(mod.Modulo(remainingTime, 60));
    const timerKey = mins < 10 ? mod.stringkeys.payload.objective.checkpoint_timer_padded : mod.stringkeys.payload.objective.checkpoint_timer;
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time1"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time2"), mod.Message(timerKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
}

let friendlycolour = mod.CreateVector(0, 0.7, 1); //0, 0.8, 1
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.15, 0.3);
let enemybgcolour = mod.CreateVector(0.4, 0, 0);
let goldcolour = mod.CreateVector(1, 0.8, 0);
let goldbgcolour = mod.CreateVector(0.5, 0.4, 0);
let ui_ready = false;


export function uiSetup(): void {
    // Container setup
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    // Payload status
    mod.AddUIText("payloadstatus1", mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 28, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("payloadstatus2", mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 28, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIImage("payload_icon1", mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(1));
    mod.AddUIImage("payload_icon2", mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(2));
    mod.AddUIContainer("progress_background1", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress1", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress_background2", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("progress2", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemycolour, 0.7, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("checkpoint0", mod.CreateVector(146, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0.9, 0.9, 0.9), 1, mod.UIBgFill.Solid);
    mod.AddUIText("remaining_time1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("remaining_time2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.idle), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIText("percentage1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("percentage2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIContainer("progress_backgroundflash", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.1, mod.UIBgFill.GradientLeft);
    mod.AddUIContainer("progressflash", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.1, mod.UIBgFill.GradientRight);

    // The UI alpha cannot be set to 0 as this breaks the animation. This works in blocks but not TS 
    mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progressflash"), false);
    mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progress_backgroundflash"), false);

    //Checkpoints distance on progress UI
    for (let i = 1; i < STATE.waypoints.size; i++) {
        if (STATE.waypoints.get(i)!.isCheckpoint) {
            mod.AddUIContainer("checkpoint" + i,
                mod.CreateVector(146 + (6 * ((STATE.waypoints.get(i)!.distance / STATE.totalDistanceInMeters) * 100)), -5, 0),
                mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0.9, 0.9, 0.9), 1, mod.UIBgFill.Solid);
        }
    }

    //Game mode version display
    mod.AddUIText(
        "version",
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(600, 30, 0),
        mod.UIAnchor.BottomRight,
        mod.GetUIRoot(),
        true,
        0,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(
            mod.stringkeys.payload.meta.meta_text,
            mod.stringkeys.payload.meta.name,
            mod.stringkeys.payload.meta.version,
            mod.stringkeys.payload.meta.build
        ),
        18,
        mod.CreateVector(0.3, 0.3, 0.3),
        1,
        mod.UIAnchor.BottomRight
    );
    // Payload progress icon draws last to show progress on top of Checkpoints
    mod.AddUIContainer("payload_progress_icon", mod.CreateVector(146 + (6 * STATE.progressInPercent), 0, 0), mod.CreateVector(4, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 0), 1, mod.UIBgFill.Solid);
    ui_ready = true;
}

export function updateProgressUI(): void {
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress1"), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress2"), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage1"), mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("percentage2"), mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress_background1"), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress_background2"), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progressflash"), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0));
    mod.SetUIWidgetSize(mod.FindUIWidgetWithName("progress_backgroundflash"), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0));
    mod.SetUIWidgetPosition(mod.FindUIWidgetWithName("payload_progress_icon"), mod.CreateVector(146 + (6 * STATE.progressInPercent), 0, 0));
}

export function updateStatusUI(): void {
    let state = mod.stringkeys.payload.state.idle;
    mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), mod.CreateVector(1, 1, 1));
    mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), mod.CreateVector(1, 1, 1));
    mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), mod.CreateVector(1, 1, 1));
    mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), mod.CreateVector(1, 1, 1));
    mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus1"), 28);
    mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus2"), 28);
    switch (STATE.payloadState) {
        case PayloadState.ADVANCING:
            state = mod.stringkeys.payload.state.advancing;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), friendlycolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), enemycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), enemycolour);
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus1"), 48);
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus2"), 48);
            break;
        case PayloadState.PUSHING_BACK:
            state = mod.stringkeys.payload.state.pushing_back;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), enemycolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), enemycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), friendlycolour);
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus1"), 44);
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus2"), 44);
            break;
        case PayloadState.CONTESTED:
            state = mod.stringkeys.payload.state.contested;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), goldcolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), goldcolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), goldcolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), goldcolour);
            break;
        case PayloadState.LOCKED:
            state = mod.stringkeys.payload.state.locked;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), goldcolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), goldcolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), goldcolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), goldcolour);
            break;
    }
    mod.SetUITextLabel(mod.FindUIWidgetWithName("payloadstatus1"), mod.Message(mod.stringkeys.payload.state.message, state));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("payloadstatus2"), mod.Message(mod.stringkeys.payload.state.message, state));
    //mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.payload.state.message, state));
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
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("payloadstatus1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("payloadstatus2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("payload_icon1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("payload_icon2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress_background1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress_background2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("checkpoint0"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("remaining_time1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("remaining_time2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("percentage1"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("percentage2"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progressflash"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("progress_backgroundflash"));
    //mod.DeleteUIWidget(mod.FindUIWidgetWithName("payload_progress_icon"));
    //for (let i = 1; i < STATE.waypoints.size; i++) {
    //    if (STATE.waypoints.get(i)!.isCheckpoint) {
    //        mod.DeleteUIWidget(mod.FindUIWidgetWithName("checkpoint" + i));
    //    }
    //}
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("container"));
}

// WORKAROUND FOR BUGGED UI WHEN PLAYER JOINS MID-GAME
export async function ui_onPlayerJoinGame(): Promise<void> {
    if (ui_ready) {
        deleteUI();
        uiSetup();
    }
}

export async function progressFlash(): Promise<void> {
    if (ui_ready) {
        for (let i = 10; i > 0; i -= 1) {
            if (STATE.payloadState == PayloadState.ADVANCING) {
                mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progressflash"), true);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progressflash"), i / 10);
            }
            if (STATE.payloadState == PayloadState.PUSHING_BACK) {
                mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progress_backgroundflash"), true);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progress_backgroundflash"), i / 10);
            }
            if (STATE.payloadState == PayloadState.IDLE || STATE.payloadState == PayloadState.LOCKED) {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), 1);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), 1);
            } else {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), i / 10);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), i / 10);
            }
            await mod.Wait(0.033);
        }
        mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), 1);
        mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), 1);
        mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progressflash"), false);
        mod.SetUIWidgetVisible(mod.FindUIWidgetWithName("progress_backgroundflash"), false);
    }
}

//Handles the end game explosion effects
export async function nukeUI(): Promise<void> {
    ui_ready = false;
    mod.AddUIContainer("nuke", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("container"), true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIContainer("nukeScreenEffect", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("container"), true, 0, goldcolour, 0.5, mod.UIBgFill.Blur);
    let nukeStart = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeStart, true);
    let ROF = mod.SpawnObject(mod.RuntimeSpawn_Common.RingOfFire, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    await mod.Wait(0.7);
    for (let i = 10; i > 0; i -= 0.25) {
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("nuke"), i / 10);
        await mod.Wait(0.066);
    }
    //let nukeStart2 = mod.SpawnObject(mod.RuntimeSpawn_Common.VFX_Launchers_GroundShockwave_Grass, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    let nukeStart2 = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_BASE_DeployClouds_Var_A, mod.Add(STATE.payloadPosition, mod.CreateVector(0, 30, 0)), mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeStart2, true);
    mod.SetVFXScale(nukeStart2, 20);
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("nuke"));
    let nukeMid = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Carrier_Explosion_Dist, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeMid, true);
    let nukeEnd = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeEnd, true);
}
