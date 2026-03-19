import { PayloadState, STATE } from "./state.ts";

export function updateCheckpointTimer(remainingTime: number): void {
    mins = mod.Floor(remainingTime / 60);
    secs = mod.Floor(mod.Modulo(remainingTime, 60));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time1"), mod.Message(timer, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
    mod.SetUITextLabel(mod.FindUIWidgetWithName("remaining_time2"), mod.Message(timer, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)));
}

let friendlycolour = mod.CreateVector(0, 0.7, 1); //0, 0.8, 1
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.15, 0.3);
let enemybgcolour = mod.CreateVector(0.4, 0, 0);
let goldcolour = mod.CreateVector(1, 0.8, 0);
let goldbgcolour = mod.CreateVector(0.5, 0.4, 0);
let ui_ready = false;
let mins = 7;
let secs = 30;
let timer = mod.stringkeys.payload.objective.checkpoint_timer;

// Cached UI Widgets for performance
let cachedWidgets: {
    progress1?: mod.UIWidget,
    progress2?: mod.UIWidget,
    percentage1?: mod.UIWidget,
    percentage2?: mod.UIWidget,
    progress_background1?: mod.UIWidget,
    progress_background2?: mod.UIWidget,
    progressflash1?: mod.UIWidget,
    progressflash2?: mod.UIWidget,
    progress_backgroundflash1?: mod.UIWidget,
    progress_backgroundflash2?: mod.UIWidget,
    payload_progress_icon?: mod.UIWidget,
    container?: mod.UIWidget,
    payload_icon1?: mod.UIWidget,
    payload_icon2?: mod.UIWidget,
    payloadstatus1?: mod.UIWidget,
    payloadstatus2?: mod.UIWidget
} = {};

function getWidget(name: string): mod.UIWidget | undefined {
    if (!cachedWidgets[name as keyof typeof cachedWidgets]) {
        cachedWidgets[name as keyof typeof cachedWidgets] = mod.FindUIWidgetWithName(name);
    }
    return cachedWidgets[name as keyof typeof cachedWidgets];
}

export function uiSetup(): void {
    // Container setup
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
    const containerWidget = mod.FindUIWidgetWithName("container");
    mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    // Payload status
    mod.AddUIText("payloadstatus1", mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 38, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("payloadstatus2", mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 38, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIImage("payload_icon1", mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(1));
    mod.AddUIImage("payload_icon2", mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(2));
    mod.AddUIContainer("progress_background1", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress1", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(1));
    mod.AddUIContainer("progress_background2", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("progress2", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(2));
    mod.AddUIContainer("checkpoint0", mod.CreateVector(146, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0.9, 0.9, 0.9), 1, mod.UIBgFill.Solid);
    mod.AddUIText("remaining_time1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(timer, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("remaining_time2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(timer, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIText("percentage1", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
    mod.AddUIText("percentage2", mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
    mod.AddUIContainer("progress_backgroundflash1", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, enemycolour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(1));
    mod.AddUIContainer("progress_backgroundflash2", mod.CreateVector(150, 5, 0), mod.CreateVector(600 - (6 * STATE.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, friendlycolour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(2));
    mod.AddUIContainer("progressflash1", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, friendlycolour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(1));
    mod.AddUIContainer("progressflash2", mod.CreateVector(150, 0, 0), mod.CreateVector((6 * STATE.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, enemycolour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(2));

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
    mod.AddUIText("credits", mod.CreateVector(0, 0, 0), mod.CreateVector(600, 30, 0), mod.UIAnchor.BottomLeft, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.credits), 14, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.BottomLeft);

    // Refresh cache after setup
    cachedWidgets = {};
    ui_ready = true;
}

export function updateProgressUI(): void {
    const leftProgress = (6 * STATE.progressInPercent) - 2;
    const rightProgress = 600 - (6 * STATE.progressInPercent);
    const progressIconPos = 146 + (6 * STATE.progressInPercent);

    const wProgress1 = getWidget("progress1");
    const wProgress2 = getWidget("progress2");
    const wPercentage1 = getWidget("percentage1");
    const wPercentage2 = getWidget("percentage2");
    const wBg1 = getWidget("progress_background1");
    const wBg2 = getWidget("progress_background2");
    const wFlash1 = getWidget("progressflash1");
    const wFlash2 = getWidget("progressflash2");
    const wBgFlash1 = getWidget("progress_backgroundflash1");
    const wBgFlash2 = getWidget("progress_backgroundflash2");
    const wIcon = getWidget("payload_progress_icon");

    if (wProgress1) mod.SetUIWidgetSize(wProgress1, mod.CreateVector(leftProgress, 20, 0));
    if (wProgress2) mod.SetUIWidgetSize(wProgress2, mod.CreateVector(leftProgress, 20, 0));

    if (wPercentage1) mod.SetUITextLabel(wPercentage1, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));
    if (wPercentage2) mod.SetUITextLabel(wPercentage2, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(STATE.progressInPercent)));

    if (wBg1) mod.SetUIWidgetSize(wBg1, mod.CreateVector(rightProgress, 10, 0));
    if (wBg2) mod.SetUIWidgetSize(wBg2, mod.CreateVector(rightProgress, 10, 0));

    if (wFlash1) mod.SetUIWidgetSize(wFlash1, mod.CreateVector(leftProgress, 20, 0));
    if (wFlash2) mod.SetUIWidgetSize(wFlash2, mod.CreateVector(leftProgress, 20, 0));

    if (wBgFlash1) mod.SetUIWidgetSize(wBgFlash1, mod.CreateVector(rightProgress, 10, 0));
    if (wBgFlash2) mod.SetUIWidgetSize(wBgFlash2, mod.CreateVector(rightProgress, 10, 0));

    if (wIcon) mod.SetUIWidgetPosition(wIcon, mod.CreateVector(progressIconPos, 0, 0));
}

export function updateStatusUI(): void {
    let state = mod.stringkeys.payload.state.idle;
    mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), mod.CreateVector(1, 1, 1));
    mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), mod.CreateVector(1, 1, 1));
    mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), mod.CreateVector(1, 1, 1));
    mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), mod.CreateVector(1, 1, 1));
    mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus1"), 38);
    mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus2"), 38);
    switch (STATE.payloadState) {
        case PayloadState.ADVANCING:
            state = mod.stringkeys.payload.state.advancing;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), friendlycolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), enemycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), enemycolour);
            break;
        case PayloadState.PUSHING_BACK:
            state = mod.stringkeys.payload.state.pushing_back;
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon1"), enemycolour);
            mod.SetUIImageColor(mod.FindUIWidgetWithName("payload_icon2"), friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus1"), enemycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("payloadstatus2"), friendlycolour);
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
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus1"), 28);
            mod.SetUITextSize(mod.FindUIWidgetWithName("payloadstatus2"), 28);
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
            const alpha = i / 10;
            const alphaNegative = 1 - alpha;
            if (STATE.payloadState == PayloadState.ADVANCING) {
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progressflash1"), alpha);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progressflash2"), alpha);
            }
            if (STATE.payloadState == PayloadState.PUSHING_BACK) {
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progress_backgroundflash1"), alpha);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progress_backgroundflash2"), alpha);
            }
            if (STATE.payloadState == PayloadState.IDLE || STATE.payloadState == PayloadState.LOCKED) {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), 1);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), 1);
            } else {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), alpha);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), alpha);
            }
            await mod.Wait(0.066);
        }
        if (STATE.payloadState == PayloadState.IDLE || STATE.payloadState == PayloadState.LOCKED) {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), 1);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), 1);
        } else {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus1"), 0.1);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName("payloadstatus2"), 0.1);
        }
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progressflash1"), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progressflash2"), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progress_backgroundflash1"), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName("progress_backgroundflash2"), 0.01);
    }
}

//Handles the end game explosion effects
export async function nukeUI(): Promise<void> {
    ui_ready = false;
    mod.SetCameraTypeForAll(mod.Cameras.Fixed, 50);
    //mod.MoveObjectOverTime(mod.GetSpatialObject(50), mod.CreateVector(0, 2, 0), mod.CreateVector(0, 0, 0), 3, false, false);
    mod.SetObjectTransformOverTime(mod.GetSpatialObject(50), mod.CreateTransform(mod.Add(mod.GetObjectPosition(mod.GetSpatialObject(50)), mod.CreateVector(0, 2, 0)), mod.GetObjectRotation(mod.GetSpatialObject(50))), 3, false, false);
    await mod.Wait(3);

    mod.SetCameraTypeForAll(mod.Cameras.Fixed, 51);
    await mod.Wait(2);
    let nukePrologue = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukePrologue, true);

    let nukeFire = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_02_SparkLoop, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.SetVFXScale(nukeFire, 20);
    mod.EnableVFX(nukeFire, true);
    mod.SetVFXScale(nukeFire, 20);

    mod.AddUIContainer("nuke", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("container"), true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
    mod.AddUIContainer("nukeScreenEffect", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("container"), true, 0, goldcolour, 0.5, mod.UIBgFill.Blur);

    let nukeStart = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike, STATE.payloadPosition, mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeStart, true);
    let ROF = mod.SpawnObject(mod.RuntimeSpawn_Common.RingOfFire, STATE.payloadPosition, mod.CreateVector(0, 0, 0));

    await mod.Wait(1.5);

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

    let nukeEnd2 = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, mod.GetObjectPosition(mod.GetSpatialObject(52)), mod.CreateVector(0, 0, 0));
    mod.EnableVFX(nukeEnd2, true);

    await mod.Wait(1);
    //mod.MoveObjectOverTime(mod.GetSpatialObject(51), mod.CreateVector(0, 1, 0), mod.CreateVector(0, 0, 0), 0.1, true, true);
    mod.SetObjectTransformOverTime(mod.GetSpatialObject(51), mod.CreateTransform(mod.Add(mod.GetObjectPosition(mod.GetSpatialObject(51)), mod.CreateVector(0, 1, 0)), mod.GetObjectRotation(mod.GetSpatialObject(51))), 0.1, true, true);
}
