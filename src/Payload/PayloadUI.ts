import { PayloadConfig } from './PayloadConfig.ts';
import { PayloadState, PayloadMovementState } from './PayloadState.ts';
import { PayloadSounds } from './PayloadSounds.ts';

const MAX_POOL_SIZE = 128;

export class PayloadUI {
    private static friendlycolour = mod.CreateVector(0, 0.7, 1);
    private static enemycolour = mod.CreateVector(1, 0.2, 0.2);
    private static friendlybgcolour = mod.CreateVector(0, 0.15, 0.3);
    private static enemybgcolour = mod.CreateVector(0.4, 0, 0);
    private static goldcolour = mod.CreateVector(1, 0.8, 0);
    private static goldbgcolour = mod.CreateVector(0.5, 0.4, 0);
    private static uiReady = false;
    private static mins = 7;
    private static secs = 30;
    private static timer = mod.stringkeys.payload.objective.checkpoint_timer;

    private static availableIds: string[] = [];
    private static usedIds: string[] = [];
    private static poolInitialized = false;

    private static cachedWidgets: {
        progress1?: mod.UIWidget;
        progress2?: mod.UIWidget;
        percentage1?: mod.UIWidget;
        percentage2?: mod.UIWidget;
        progress_background1?: mod.UIWidget;
        progress_background2?: mod.UIWidget;
        progressflash1?: mod.UIWidget;
        progressflash2?: mod.UIWidget;
        progress_backgroundflash1?: mod.UIWidget;
        progress_backgroundflash2?: mod.UIWidget;
        payload_progress_icon?: mod.UIWidget;
    } = {};

    private static getWidget(name: string): mod.UIWidget | undefined {
        if (!PayloadUI.cachedWidgets[name as keyof typeof PayloadUI.cachedWidgets]) {
            PayloadUI.cachedWidgets[name as keyof typeof PayloadUI.cachedWidgets] = mod.FindUIWidgetWithName(name);
        }
        return PayloadUI.cachedWidgets[name as keyof typeof PayloadUI.cachedWidgets];
    }

    public static updateCheckpointTimer(remainingTime: number): void {
        PayloadUI.mins = mod.Floor(remainingTime / 60);
        PayloadUI.secs = mod.Floor(mod.Modulo(remainingTime, 60));
        if (PayloadState.instance.overtime && remainingTime <= 0) {
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time1'), mod.Message(mod.stringkeys.payload.state.overtime));
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time2'), mod.Message(mod.stringkeys.payload.state.overtime));
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time1'), PayloadUI.goldbgcolour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time2'), PayloadUI.goldbgcolour);
        } else if (remainingTime > 0) {
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time1'), mod.Message(PayloadUI.timer, PayloadUI.mins, mod.Floor(PayloadUI.secs / 10), mod.Modulo(PayloadUI.secs, 10)));
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time2'), mod.Message(PayloadUI.timer, PayloadUI.mins, mod.Floor(PayloadUI.secs / 10), mod.Modulo(PayloadUI.secs, 10)));
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time1'), PayloadUI.enemybgcolour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time2'), PayloadUI.friendlybgcolour);
        } else {
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time1'), mod.Message(PayloadUI.timer, 0, 0, 0));
            mod.SetUITextLabel(mod.FindUIWidgetWithName('remaining_time2'), mod.Message(PayloadUI.timer, 0, 0, 0));
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time1'), PayloadUI.enemybgcolour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName('remaining_time2'), PayloadUI.friendlybgcolour);
        }
    }

    public static setup(): void {
        mod.AddUIContainer('container', mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
        const containerWidget = mod.FindUIWidgetWithName('container');
        mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
        mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

        mod.AddUIText('payloadstatus1', mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 38, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
        mod.AddUIText('payloadstatus2', mod.CreateVector(0, 55, 0), mod.CreateVector(150, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.4, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle), 38, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
        mod.AddUIImage('payload_icon1', mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(1));
        mod.AddUIImage('payload_icon2', mod.CreateVector(0, 20, 0), mod.CreateVector(50, 40, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, mod.CreateVector(1, 1, 1), 0.7, mod.UIBgFill.None, mod.UIImageType.CrownSolid, mod.CreateVector(1, 1, 1), 1, mod.GetTeam(2));
        mod.AddUIContainer('progress_background1', mod.CreateVector(152, 5, 0), mod.CreateVector(600 - (6 * PayloadState.instance.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(1));
        mod.AddUIContainer('progress1', mod.CreateVector(150, 0, 0), mod.CreateVector((6 * PayloadState.instance.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(1));
        mod.AddUIContainer('progress_background2', mod.CreateVector(152, 5, 0), mod.CreateVector(600 - (6 * PayloadState.instance.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(2));
        mod.AddUIContainer('progress2', mod.CreateVector(150, 0, 0), mod.CreateVector((6 * PayloadState.instance.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.GetTeam(2));
        mod.AddUIContainer('checkpoint0', mod.CreateVector(146, -5, 0), mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0.9, 0.9, 0.9), 1, mod.UIBgFill.Solid);
        mod.AddUIText('remaining_time1', mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(PayloadUI.timer, PayloadUI.mins, mod.Floor(PayloadUI.secs / 10), mod.Modulo(PayloadUI.secs, 10)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
        mod.AddUIText('remaining_time2', mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(PayloadUI.timer, PayloadUI.mins, mod.Floor(PayloadUI.secs / 10), mod.Modulo(PayloadUI.secs, 10)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
        mod.AddUIText('percentage1', mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.friendlybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(PayloadState.instance.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(1));
        mod.AddUIText('percentage2', mod.CreateVector(0, -5, 0), mod.CreateVector(100, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.enemybgcolour, 0.9, mod.UIBgFill.Solid, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(PayloadState.instance.progressInPercent)), 26, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, mod.GetTeam(2));
        mod.AddUIContainer('progress_backgroundflash1', mod.CreateVector(152, 5, 0), mod.CreateVector(600 - (6 * PayloadState.instance.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.enemycolour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(1));
        mod.AddUIContainer('progress_backgroundflash2', mod.CreateVector(152, 5, 0), mod.CreateVector(600 - (6 * PayloadState.instance.progressInPercent), 10, 0), mod.UIAnchor.TopRight, containerWidget, true, 0, PayloadUI.friendlycolour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(2));
        mod.AddUIContainer('progressflash1', mod.CreateVector(150, 0, 0), mod.CreateVector((6 * PayloadState.instance.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.friendlycolour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(1));
        mod.AddUIContainer('progressflash2', mod.CreateVector(150, 0, 0), mod.CreateVector((6 * PayloadState.instance.progressInPercent) - 2, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, PayloadUI.enemycolour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(2));
        mod.AddUIText('left_player_count1', mod.CreateVector(-35, 26, 0), mod.CreateVector(50, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, PayloadUI.friendlycolour, 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, 0), 26, PayloadUI.friendlycolour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        mod.AddUIText('left_player_count2', mod.CreateVector(-35, 26, 0), mod.CreateVector(50, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, PayloadUI.friendlycolour, 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, 0), 26, PayloadUI.friendlycolour, 1, mod.UIAnchor.Center, mod.GetTeam(2));
        mod.AddUIText('right_player_count1', mod.CreateVector(35, 26, 0), mod.CreateVector(50, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, PayloadUI.enemycolour, 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, 0), 26, PayloadUI.enemycolour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        mod.AddUIText('right_player_count2', mod.CreateVector(35, 26, 0), mod.CreateVector(50, 30, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, PayloadUI.enemycolour, 0.9, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, 0), 26, PayloadUI.enemycolour, 1, mod.UIAnchor.Center, mod.GetTeam(2));

        for (let i = 1; i < PayloadState.instance.waypoints.length; i++) {
            if (PayloadState.instance.waypoints[i].isCheckpoint) {
                mod.AddUIContainer('checkpoint' + i,
                    mod.CreateVector(146 + (6 * ((PayloadState.instance.waypoints[i].distance / PayloadState.instance.totalDistanceInMeters) * 100)), -5, 0),
                    mod.CreateVector(4, 30, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(0.9, 0.9, 0.9), 1, mod.UIBgFill.Solid);
            }
        }

        mod.AddUIContainer('payload_progress_icon', mod.CreateVector(mod.RoundToInteger((146 + (6 * PayloadState.instance.progressInPercent)) * 10) / 10, 0, 0), mod.CreateVector(4, 20, 0), mod.UIAnchor.TopLeft, containerWidget, true, 0, mod.CreateVector(1, 1, 0), 1, mod.UIBgFill.Solid);
        mod.AddUIText('credits', mod.CreateVector(10, 2, 0), mod.CreateVector(300, 30, 0), mod.UIAnchor.BottomLeft, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.credits), 14, mod.CreateVector(1, 1, 1), 0.6, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI);

        PayloadUI.cachedWidgets = {};
        PayloadUI.uiReady = true;
    }

    public static async updateProgressUI(): Promise<void> {
        const leftProgress = mod.RoundToInteger(6 * PayloadState.instance.progressInPercent) - 2;
        const rightProgress = mod.RoundToInteger(600 - (6 * PayloadState.instance.progressInPercent));
        const progressIconPos = mod.RoundToInteger((146 + (6 * PayloadState.instance.progressInPercent)) * 100) / 100;

        const wProgress1 = PayloadUI.getWidget('progress1');
        const wProgress2 = PayloadUI.getWidget('progress2');
        const wPercentage1 = PayloadUI.getWidget('percentage1');
        const wPercentage2 = PayloadUI.getWidget('percentage2');
        const wBg1 = PayloadUI.getWidget('progress_background1');
        const wBg2 = PayloadUI.getWidget('progress_background2');
        const wFlash1 = PayloadUI.getWidget('progressflash1');
        const wFlash2 = PayloadUI.getWidget('progressflash2');
        const wBgFlash1 = PayloadUI.getWidget('progress_backgroundflash1');
        const wBgFlash2 = PayloadUI.getWidget('progress_backgroundflash2');
        const wIcon = PayloadUI.getWidget('payload_progress_icon');

        if (wProgress1) mod.SetUIWidgetSize(wProgress1, mod.CreateVector(leftProgress, 20, 0));
        if (wProgress2) mod.SetUIWidgetSize(wProgress2, mod.CreateVector(leftProgress, 20, 0));
        if (wPercentage1) mod.SetUITextLabel(wPercentage1, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(PayloadState.instance.progressInPercent)));
        if (wPercentage2) mod.SetUITextLabel(wPercentage2, mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(PayloadState.instance.progressInPercent)));
        if (wBg1) mod.SetUIWidgetSize(wBg1, mod.CreateVector(rightProgress, 10, 0));
        if (wBg2) mod.SetUIWidgetSize(wBg2, mod.CreateVector(rightProgress, 10, 0));
        if (wFlash1) mod.SetUIWidgetSize(wFlash1, mod.CreateVector(leftProgress, 20, 0));
        if (wFlash2) mod.SetUIWidgetSize(wFlash2, mod.CreateVector(leftProgress, 20, 0));
        if (wBgFlash1) mod.SetUIWidgetSize(wBgFlash1, mod.CreateVector(rightProgress, 10, 0));
        if (wBgFlash2) mod.SetUIWidgetSize(wBgFlash2, mod.CreateVector(rightProgress, 10, 0));
        if (wIcon) mod.SetUIWidgetPosition(wIcon, mod.CreateVector(progressIconPos, 0, 0));
    }

    public static async updateStatusUI(): Promise<void> {
        let stateLabel = mod.stringkeys.payload.state.idle;
        mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon1'), mod.CreateVector(1, 1, 1));
        mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon2'), mod.CreateVector(1, 1, 1));
        mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus1'), mod.CreateVector(1, 1, 1));
        mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus2'), mod.CreateVector(1, 1, 1));
        mod.SetUITextSize(mod.FindUIWidgetWithName('payloadstatus1'), 38);
        mod.SetUITextSize(mod.FindUIWidgetWithName('payloadstatus2'), 38);

        switch (PayloadState.instance.payloadState) {
            case PayloadMovementState.ADVANCING:
                stateLabel = mod.stringkeys.payload.state.advancing;
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon1'), PayloadUI.friendlycolour);
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon2'), PayloadUI.enemycolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus1'), PayloadUI.friendlycolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus2'), PayloadUI.enemycolour);
                break;
            case PayloadMovementState.PUSHING_BACK:
                stateLabel = mod.stringkeys.payload.state.pushing_back;
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon1'), PayloadUI.enemycolour);
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon2'), PayloadUI.friendlycolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus1'), PayloadUI.enemycolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus2'), PayloadUI.friendlycolour);
                break;
            case PayloadMovementState.CONTESTED:
                stateLabel = mod.stringkeys.payload.state.contested;
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon1'), PayloadUI.goldcolour);
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon2'), PayloadUI.goldcolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus1'), PayloadUI.goldcolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus2'), PayloadUI.goldcolour);
                break;
            case PayloadMovementState.LOCKED:
                stateLabel = mod.stringkeys.payload.state.locked;
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon1'), PayloadUI.goldcolour);
                mod.SetUIImageColor(mod.FindUIWidgetWithName('payload_icon2'), PayloadUI.goldcolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus1'), PayloadUI.goldcolour);
                mod.SetUITextColor(mod.FindUIWidgetWithName('payloadstatus2'), PayloadUI.goldcolour);
                mod.SetUITextSize(mod.FindUIWidgetWithName('payloadstatus1'), 28);
                mod.SetUITextSize(mod.FindUIWidgetWithName('payloadstatus2'), 28);
                break;
        }

        mod.SetUITextLabel(mod.FindUIWidgetWithName('payloadstatus1'), mod.Message(mod.stringkeys.payload.state.message, stateLabel));
        mod.SetUITextLabel(mod.FindUIWidgetWithName('payloadstatus2'), mod.Message(mod.stringkeys.payload.state.message, stateLabel));
    }

    public static async updateCheckpointUI(): Promise<void> {
        const containerWidget = mod.FindUIWidgetWithName('container');
        mod.AddUIText('checkpointreached', mod.CreateVector(0, 100, 0), mod.CreateVector(500, 80, 0), mod.UIAnchor.TopCenter, containerWidget, true, 0, PayloadUI.goldbgcolour, 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.checkpoints.blankmessage), 52, PayloadUI.goldcolour, 1, mod.UIAnchor.Center);
        for (let i = 0; i < 500; i += 25) {
            mod.SetUIWidgetSize(mod.FindUIWidgetWithName('checkpointreached'), mod.CreateVector(i, 80, 0));
            await mod.Wait(0.033);
        }
        mod.SetUIWidgetSize(mod.FindUIWidgetWithName('checkpointreached'), mod.CreateVector(500, 80, 0));
        mod.SetUITextLabel(mod.FindUIWidgetWithName('checkpointreached'), mod.Message(mod.stringkeys.payload.checkpoints.message));
        await mod.Wait(6);
        mod.SetUITextLabel(mod.FindUIWidgetWithName('checkpointreached'), mod.Message(mod.stringkeys.payload.checkpoints.blankmessage));
        for (let i = 500; i > 0; i -= 25) {
            mod.SetUIWidgetSize(mod.FindUIWidgetWithName('checkpointreached'), mod.CreateVector(i, 80, 0));
            await mod.Wait(0.033);
        }
        mod.DeleteUIWidget(mod.FindUIWidgetWithName('checkpointreached'));
    }

    public static async updatePlayerCountUI(): Promise<void> {
        const team1 = PayloadState.instance.playersInPushProximity.get(1)?.length || 0;
        const team2 = PayloadState.instance.playersInPushProximity.get(2)?.length || 0;
        mod.SetUITextLabel(mod.FindUIWidgetWithName('left_player_count1'), mod.Message(mod.stringkeys.payload.counter, team1));
        mod.SetUITextLabel(mod.FindUIWidgetWithName('left_player_count2'), mod.Message(mod.stringkeys.payload.counter, team2));
        mod.SetUITextLabel(mod.FindUIWidgetWithName('right_player_count1'), mod.Message(mod.stringkeys.payload.counter, team2));
        mod.SetUITextLabel(mod.FindUIWidgetWithName('right_player_count2'), mod.Message(mod.stringkeys.payload.counter, team1));

        if (team1 == 0) {
            mod.SetUITextColor(mod.FindUIWidgetWithName('left_player_count1'), mod.CreateVector(1, 1, 1));
            mod.SetUITextColor(mod.FindUIWidgetWithName('right_player_count2'), mod.CreateVector(1, 1, 1));
        } else {
            mod.SetUITextColor(mod.FindUIWidgetWithName('left_player_count1'), PayloadUI.friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName('right_player_count2'), PayloadUI.enemycolour);
        }

        if (team2 == 0) {
            mod.SetUITextColor(mod.FindUIWidgetWithName('left_player_count2'), mod.CreateVector(1, 1, 1));
            mod.SetUITextColor(mod.FindUIWidgetWithName('right_player_count1'), mod.CreateVector(1, 1, 1));
        } else {
            mod.SetUITextColor(mod.FindUIWidgetWithName('left_player_count2'), PayloadUI.friendlycolour);
            mod.SetUITextColor(mod.FindUIWidgetWithName('right_player_count1'), PayloadUI.enemycolour);
        }
    }

    private static deleteUI(): void {
        mod.DeleteUIWidget(mod.FindUIWidgetWithName('container'));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName('credits'));
    }

    public static async onPlayerJoinGameGlobalUIRefresh(): Promise<void> {
        if (PayloadUI.uiReady) {
            await mod.Wait(5);
            PayloadUI.deleteUI();
            PayloadUI.setup();
            PayloadUI.updateStatusUI();
        }
    }

    public static async progressFlash(): Promise<void> {
        if (!PayloadUI.uiReady) return;
        for (let i = 10; i > 0; i -= 1) {
            const alpha = i / 10;
            if (PayloadState.instance.payloadState == PayloadMovementState.ADVANCING) {
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progressflash1'), alpha);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progressflash2'), alpha);
            }
            if (PayloadState.instance.payloadState == PayloadMovementState.PUSHING_BACK) {
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progress_backgroundflash1'), alpha);
                mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progress_backgroundflash2'), alpha);
            }
            if (PayloadState.instance.payloadState == PayloadMovementState.IDLE || PayloadState.instance.payloadState == PayloadMovementState.LOCKED) {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus1'), 1);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus2'), 1);
            } else {
                mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus1'), alpha);
                mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus2'), alpha);
            }
            await mod.Wait(0.066);
        }

        if (PayloadState.instance.payloadState == PayloadMovementState.IDLE || PayloadState.instance.payloadState == PayloadMovementState.LOCKED) {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus1'), 1);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus2'), 1);
        } else {
            mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus1'), 0.1);
            mod.SetUITextAlpha(mod.FindUIWidgetWithName('payloadstatus2'), 0.1);
        }

        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progressflash1'), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progressflash2'), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progress_backgroundflash1'), 0.01);
        mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('progress_backgroundflash2'), 0.01);
    }

    public static async nukeUI(): Promise<void> {
        PayloadUI.uiReady = false;
        mod.DeployAllPlayers();
        mod.SetCameraTypeForAll(mod.Cameras.Fixed, 50);
        mod.MoveObjectOverTime(mod.GetFixedCamera(50), mod.CreateVector(0, 2, 0), mod.CreateVector(0, 0, 0), 3, false, false);

        const siren = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_GameModes_BR_Mission_DemoCrew_Alarm_Close_SimpleLoop3D, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.PlaySound(siren, 1, PayloadState.instance.payloadPosition, 500);
        await mod.Wait(3);
        mod.DeployAllPlayers();
        for (let i = 0; i < mod.CountOf(mod.AllPlayers()); i++) {
            const player = mod.ValueInArray(mod.AllPlayers(), i);
            if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) {
                mod.UndeployPlayer(player);
            }
        }

        mod.SetCameraTypeForAll(mod.Cameras.Fixed, 51);
        await mod.Wait(2);
        mod.DeployAllPlayers();
        const nukePrologue = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.EnableVFX(nukePrologue, true);

        const nukeFire = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Gadget_Sabotage_02_SparkLoop, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.SetVFXScale(nukeFire, 20);
        mod.EnableVFX(nukeFire, true);
        mod.SetVFXScale(nukeFire, 20);

        mod.StopSound(siren);
        mod.AddUIContainer('nuke', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName('container'), true, 0, mod.CreateVector(1, 1, 1), 1, mod.UIBgFill.Solid);
        mod.AddUIContainer('nukeScreenEffect', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName('container'), true, 0, PayloadUI.goldcolour, 0.5, mod.UIBgFill.Blur);
        const vehicleSpawner = mod.SpawnObject(mod.RuntimeSpawn_Common.VehicleSpawner, PayloadState.instance.payloadPosition, PayloadState.instance.payloadRotation);
        mod.SetVehicleSpawnerVehicleType(vehicleSpawner, mod.VehicleList.M2Bradley);
        mod.ForceVehicleSpawnerSpawn(vehicleSpawner);

        PayloadState.instance.payloadSpatials.forEach((payloadSpatials) => {
            mod.UnspawnObject(payloadSpatials);
        });

        const nukeStart = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.EnableVFX(nukeStart, true);
        const nukeStart2 = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_CAP_AmbWar_Rocket_Strike, mod.Add(PayloadState.instance.payloadPosition, mod.CreateVector(0, 10, 0)), mod.CreateVector(0, 3.14, 0));
        mod.EnableVFX(nukeStart2, true);
        mod.SpawnObject(mod.RuntimeSpawn_Common.RingOfFire, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));

        await mod.Wait(1.5);

        for (let i = 10; i > 0; i -= 0.25) {
            mod.SetUIWidgetBgAlpha(mod.FindUIWidgetWithName('nuke'), i / 10);
            await mod.Wait(0.066);
        }

        mod.DeleteUIWidget(mod.FindUIWidgetWithName('nuke'));

        const nukeMid = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Carrier_Explosion_Dist, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.EnableVFX(nukeMid, true);

        const nukeMid2 = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Carrier_Explosion_Dist, mod.Subtract(PayloadState.instance.payloadPosition, mod.CreateVector(0, 20, 0)), mod.CreateVector(0, 3.14, 0));
        mod.EnableVFX(nukeMid2, true);

        const nukeEnd = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, PayloadState.instance.payloadPosition, mod.CreateVector(0, 0, 0));
        mod.EnableVFX(nukeEnd, true);

        const nukeEnd2 = mod.SpawnObject(mod.RuntimeSpawn_Common.FX_Bomb_Mk82_AIR_Detonation, mod.GetObjectPosition(mod.GetSpatialObject(52)), mod.CreateVector(0, 0, 0));
        mod.EnableVFX(nukeEnd2, true);

        await mod.Wait(0.2);
        mod.MoveObjectOverTime(mod.GetFixedCamera(51), mod.CreateVector(0, 4, 0), mod.CreateVector(0, 0, 0), 0.05, true, true);
        await mod.Wait(0.5);
        mod.MoveObjectOverTime(mod.GetFixedCamera(51), mod.CreateVector(0, 2, 0), mod.CreateVector(0, 0, 0), 0.05, true, true);
        await mod.Wait(0.5);
        mod.MoveObjectOverTime(mod.GetFixedCamera(51), mod.CreateVector(0, 1, 0), mod.CreateVector(0, 0, 0), 0.05, true, true);
        await mod.Wait(0.5);
        mod.MoveObjectOverTime(mod.GetFixedCamera(51), mod.CreateVector(0, 0.5, 0), mod.CreateVector(0, 0, 0), 0.05, true, true);
        await mod.Wait(1);
        mod.StopActiveMovementForObject(mod.GetFixedCamera(51));
    }

    public static async updateDebugUI(): Promise<void> {
        if (!PayloadConfig.enableDebug) return;
        let debugText = mod.FindUIWidgetWithName('debugText');
        if (!debugText) {
            mod.AddUIText('debugText', mod.CreateVector(0, 0, 0), mod.CreateVector(600, 30, 0), mod.UIAnchor.BottomCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.debug.tickrate), 14, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center);
            debugText = mod.FindUIWidgetWithName('debugText');
        }
        mod.SetUITextLabel(debugText, mod.Message(mod.stringkeys.payload.debug.tickrate, PayloadState.instance.ticks, PayloadState.instance.tickrate));
    }

    public static onPlayerJoinGame(eventPlayer: mod.Player): void {
        const playerData = PayloadState.getPlayerData(eventPlayer);
        const containerName = this.getPlayerUIContainerName(eventPlayer);
        mod.AddUIContainer(containerName, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, eventPlayer);

        const containerWidget = mod.FindUIWidgetWithName(containerName);
        mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
        mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

        playerData.containerName = containerName;
        playerData.containerWidget = containerWidget;
    }

    public static getPlayerUIContainerName(player: mod.Player): string {
        return 'playerUI_' + mod.GetObjId(player);
    }

    public static getPlayerUIWidget(player: mod.Player): mod.UIWidget {
        const playerData = PayloadState.getPlayerData(player);
        return playerData.containerWidget ?
            playerData.containerWidget :
            mod.FindUIWidgetWithName(PayloadUI.getPlayerUIContainerName(player));
    }

    public static async outOfBoundsUI(player: mod.Player): Promise<void> {
        const playerData = PayloadState.getPlayerData(player);
        if (playerData.outOfBounds) return;
        if (playerData.oobTimer > 0) return;

        const playerUI = PayloadUI.getPlayerUIWidget(player);
        playerData.outOfBounds = true;
        playerData.oobTimer = 5;
        mod.SkipManDown(player, true);
        mod.AddUIContainer('OOBBackground', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.Blur, player);
        mod.AddUIText('OOBText', mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0.6, 0.1, 0.1), 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.outofbounds), 56, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.TopCenter, player);
        mod.AddUIText('Countdown', mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 1, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, playerData.oobTimer), 72, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.BottomCenter, player);

        for (let i = playerData.oobTimer; i > 0; i--) {
            mod.SetUITextLabel(mod.FindUIWidgetWithName('Countdown', playerUI), mod.Message(mod.stringkeys.payload.counter, i));
            PayloadSounds.playOOBsound(player);
            await mod.Wait(1);
            if (!playerData.outOfBounds) break;
        }

        playerData.oobTimer = 0;
        if (playerData.outOfBounds) {
            mod.DealDamage(player, 10000);
        } else {
            mod.SkipManDown(player, false);
        }

        mod.DeleteUIWidget(mod.FindUIWidgetWithName('OOBBackground', playerUI));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName('OOBText', playerUI));
        mod.DeleteUIWidget(mod.FindUIWidgetWithName('Countdown', playerUI));
        playerData.outOfBounds = false;
    }

    public static clearPlayerUI(playerId: number): void {
        const playerData = PayloadState.getPlayerData(playerId);
        if (!playerData.containerWidget) return;
        mod.DeleteUIWidget(playerData.containerWidget);
        playerData.containerWidget = null;
    }
}
