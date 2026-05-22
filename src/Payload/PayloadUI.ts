import { PayloadConfig } from './PayloadConfig.ts';
import { PayloadState, PayloadMovementState } from './PayloadState.ts';
import { PayloadSounds } from './PayloadSounds.ts';

export class PayloadUI {
    private static readonly timerStringKey = mod.stringkeys.payload.objective.checkpoint_timer;
    private static prevTeam1Count = -1;
    private static prevTeam2Count = -1;

    private static widgets = {
        container: null as mod.UIWidget | null,
        payloadstatus1: null as mod.UIWidget | null,
        payloadstatus2: null as mod.UIWidget | null,
        payload_icon1: null as mod.UIWidget | null,
        payload_icon2: null as mod.UIWidget | null,
        progress1: null as mod.UIWidget | null,
        progress2: null as mod.UIWidget | null,
        progress_background1: null as mod.UIWidget | null,
        progress_background2: null as mod.UIWidget | null,
        progressflash1: null as mod.UIWidget | null,
        progressflash2: null as mod.UIWidget | null,
        progress_backgroundflash1: null as mod.UIWidget | null,
        progress_backgroundflash2: null as mod.UIWidget | null,
        remaining_time1: null as mod.UIWidget | null,
        remaining_time2: null as mod.UIWidget | null,
        percentage1: null as mod.UIWidget | null,
        percentage2: null as mod.UIWidget | null,
        payload_progress_icon: null as mod.UIWidget | null,
        left_player_count1: null as mod.UIWidget | null,
        left_player_count2: null as mod.UIWidget | null,
        right_player_count1: null as mod.UIWidget | null,
        right_player_count2: null as mod.UIWidget | null,
        credits: null as mod.UIWidget | null,
        debugText: null as mod.UIWidget | null,
    };

    //#region UI Setup

    public static setup(): void {
        // Clean up existing widgets if this is a re-setup
        if (PayloadUI.widgets.container) mod.DeleteUIWidget(PayloadUI.widgets.container);
        if (PayloadUI.widgets.credits) mod.DeleteUIWidget(PayloadUI.widgets.credits);
        if (PayloadUI.widgets.debugText) mod.DeleteUIWidget(PayloadUI.widgets.debugText);
        PayloadUI.resetWidgetCache();

        // Setup all widgets (order matters for references and layering)
        PayloadUI.setupContainer();
        PayloadUI.setupStatusIndicator();
        PayloadUI.setupProgressBar();
        PayloadUI.setupTimerAndPercentage();
        PayloadUI.setupFlashOverlays();
        PayloadUI.setupCheckpoints();
        PayloadUI.setupPlayerCounts();
        PayloadUI.setupProgressIcon();
        PayloadUI.setupCredits();
        PayloadUI.setupDebugText();
    }

    private static setupContainer(): void {
        const name = 'container';
        mod.AddUIContainer(name, mod.CreateVector(0, 50, 0), mod.CreateVector(900, 500, 0), mod.UIAnchor.TopCenter);
        PayloadUI.widgets.container = mod.FindUIWidgetWithName(name);
        mod.SetUIWidgetBgFill(PayloadUI.widgets.container!, mod.UIBgFill.None);
        mod.SetUIWidgetDepth(PayloadUI.widgets.container!, mod.UIDepth.AboveGameUI);
    }

    /**
     * Sets up the status indicator of the payload at the top-center of the screen, 
     * which is using symbols for the movement along with an colored crown icon 
     * indicating the current team in control. 
     * The status text and icon is doubled for each team in order to reflect
     * the friendly and enemy perspectives according to the player's team (e.g. red vs blue).
     */
    private static setupStatusIndicator(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const statusPos = mod.CreateVector(0, 55, 0);
        const statusSize = mod.CreateVector(150, 30, 0);
        const statusBgColour = mod.CreateVector(0.5, 0.5, 0.5);
        const idleMsg = mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle);
        const iconPos = mod.CreateVector(0, 20, 0);
        const iconSize = mod.CreateVector(50, 40, 0);
        const padding = 0;
        const statusBgAlpha = 0.4;
        const iconBgAlpha = 0.7;
        const textAlpha = 1;

        const payloadstatus1 = 'payloadstatus1';
        mod.AddUIText(
            payloadstatus1, statusPos, statusSize, mod.UIAnchor.TopCenter,
            container, true, padding, statusBgColour, statusBgAlpha, mod.UIBgFill.None,
            idleMsg, uiConfig.statusFontSize, uiConfig.whiteColour, textAlpha,
            mod.UIAnchor.Center, mod.GetTeam(1)
        );
        PayloadUI.widgets.payloadstatus1 = mod.FindUIWidgetWithName(payloadstatus1);

        const payloadstatus2 = 'payloadstatus2';
        mod.AddUIText(
            payloadstatus2, statusPos, statusSize, mod.UIAnchor.TopCenter,
            container, true, padding, statusBgColour, statusBgAlpha, mod.UIBgFill.None,
            idleMsg, uiConfig.statusFontSize, uiConfig.whiteColour, textAlpha,
            mod.UIAnchor.Center, mod.GetTeam(2)
        );
        PayloadUI.widgets.payloadstatus2 = mod.FindUIWidgetWithName(payloadstatus2);

        const payload_icon1 = 'payload_icon1';
        mod.AddUIImage(
            payload_icon1, iconPos, iconSize, mod.UIAnchor.TopCenter,
            container, true, padding, uiConfig.whiteColour, iconBgAlpha, mod.UIBgFill.None,
            mod.UIImageType.CrownSolid, uiConfig.whiteColour, textAlpha, mod.GetTeam(1)
        );
        PayloadUI.widgets.payload_icon1 = mod.FindUIWidgetWithName(payload_icon1);

        const payload_icon2 = 'payload_icon2';
        mod.AddUIImage(
            payload_icon2, iconPos, iconSize, mod.UIAnchor.TopCenter,
            container, true, padding, uiConfig.whiteColour, iconBgAlpha, mod.UIBgFill.None,
            mod.UIImageType.CrownSolid, uiConfig.whiteColour, textAlpha, mod.GetTeam(2)
        );
        PayloadUI.widgets.payload_icon2 = mod.FindUIWidgetWithName(payload_icon2);
    }

    /**
     * Sets up the progress bar at the top of the screen, 
     * which is using two containers with different colours 
     * filling up from the center to the left and right according 
     * to the current progress of the payload.   
     */
    private static setupProgressBar(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const multiplier = uiConfig.progressBarMultiplier; // progressBarWidth / 100
        const progress = PayloadState.instance.progressInPercent;
        const rightOffsetPos = mod.CreateVector(uiConfig.progressBarRightOffset, 5, 0);
        const leftOffsetPos = mod.CreateVector(uiConfig.progressBarLeftOffset, 0, 0);
        const rightSize = mod.CreateVector(uiConfig.progressBarWidth - (multiplier * progress), 10, 0);
        const leftSize = mod.CreateVector((multiplier * progress) - 2, 20, 0);
        const progressBarBgAlpha = 0.9;
        const padding = 0;

        const progress_background1 = 'progress_background1';
        mod.AddUIContainer(
            progress_background1, rightOffsetPos, rightSize, mod.UIAnchor.TopRight,
            container, true, padding, uiConfig.enemyBgColour, progressBarBgAlpha,
            mod.UIBgFill.Solid, mod.GetTeam(1)
        );
        PayloadUI.widgets.progress_background1 = mod.FindUIWidgetWithName(progress_background1);

        const progress1 = 'progress1';
        mod.AddUIContainer(
            progress1, leftOffsetPos, leftSize, mod.UIAnchor.TopLeft,
            container, true, padding, uiConfig.friendlyBgColour, progressBarBgAlpha,
            mod.UIBgFill.Solid, mod.GetTeam(1)
        );
        PayloadUI.widgets.progress1 = mod.FindUIWidgetWithName(progress1);

        const progress_background2 = 'progress_background2';
        mod.AddUIContainer(
            progress_background2, rightOffsetPos, rightSize, mod.UIAnchor.TopRight,
            container, true, padding, uiConfig.friendlyBgColour, progressBarBgAlpha,
            mod.UIBgFill.Solid, mod.GetTeam(2)
        );
        PayloadUI.widgets.progress_background2 = mod.FindUIWidgetWithName(progress_background2);

        const progress2 = 'progress2';
        mod.AddUIContainer(
            progress2, leftOffsetPos, leftSize, mod.UIAnchor.TopLeft,
            container, true, padding, uiConfig.enemyBgColour, progressBarBgAlpha,
            mod.UIBgFill.Solid, mod.GetTeam(2)
        );
        PayloadUI.widgets.progress2 = mod.FindUIWidgetWithName(progress2);
    }

    private static setupCheckpoints(): void {
        const container = PayloadUI.widgets.container!;
        const state = PayloadState.instance;
        const multiplier = PayloadConfig.uiConfig.progressBarMultiplier;
        const markerOffset = PayloadConfig.uiConfig.progressBarLeftOffset - 4;
        const markerSize = mod.CreateVector(4, 30, 0);
        const markerColour = mod.CreateVector(0.9, 0.9, 0.9);

        // Start marker
        mod.AddUIContainer(
            'checkpoint0', mod.CreateVector(markerOffset, -5, 0), markerSize,
            mod.UIAnchor.TopLeft, container, true, 0, markerColour, 1, mod.UIBgFill.Solid
        );

        // Checkpoint dividers (fire-and-forget - never referenced again)
        for (const cpIndex of state.checkpointIndexes) {
            const progressAtCheckpoint = (state.waypoints[cpIndex].distance / state.totalDistanceInMeters) * 100;
            const leftOffset = markerOffset + (multiplier * progressAtCheckpoint);
            mod.AddUIContainer(
                'checkpoint' + cpIndex, mod.CreateVector(leftOffset, -5, 0), markerSize,
                mod.UIAnchor.TopLeft, container, true, 0, markerColour, 1, mod.UIBgFill.Solid
            );
        }
    }

    private static setupTimerAndPercentage(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const progress = PayloadState.instance.progressInPercent;
        const remainingTime = PayloadConfig.defaultCheckpointTime - (PayloadState.instance.lastElapsedSeconds - PayloadState.instance.checkpointStartTime);
        const mins = mod.Floor(remainingTime / 60);
        const secs = mod.Floor(mod.Modulo(remainingTime, 60));
        const timerMsg = mod.Message(PayloadUI.timerStringKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10));
        const percentMsg = mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(progress));
        const position = mod.CreateVector(0, -5, 0);
        const size = mod.CreateVector(100, 30, 0);

        const remaining_time1 = 'remaining_time1';
        mod.AddUIText(remaining_time1, position, size, mod.UIAnchor.TopRight, container, true, 0, uiConfig.enemyBgColour, 0.9, mod.UIBgFill.Solid, timerMsg, 26, uiConfig.whiteColour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        PayloadUI.widgets.remaining_time1 = mod.FindUIWidgetWithName(remaining_time1);

        const remaining_time2 = 'remaining_time2';
        mod.AddUIText(remaining_time2, position, size, mod.UIAnchor.TopRight, container, true, 0, uiConfig.friendlyBgColour, 0.9, mod.UIBgFill.Solid, timerMsg, 26, uiConfig.whiteColour, 1, mod.UIAnchor.Center, mod.GetTeam(2));
        PayloadUI.widgets.remaining_time2 = mod.FindUIWidgetWithName(remaining_time2);

        const percentage1 = 'percentage1';
        mod.AddUIText(percentage1, position, size, mod.UIAnchor.TopLeft, container, true, 0, uiConfig.friendlyBgColour, 0.9, mod.UIBgFill.Solid, percentMsg, 26, uiConfig.whiteColour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        PayloadUI.widgets.percentage1 = mod.FindUIWidgetWithName(percentage1);

        const percentage2 = 'percentage2';
        mod.AddUIText(percentage2, position, size, mod.UIAnchor.TopLeft, container, true, 0, uiConfig.enemyBgColour, 0.9, mod.UIBgFill.Solid, percentMsg, 26, uiConfig.whiteColour, 1, mod.UIAnchor.Center, mod.GetTeam(2));
        PayloadUI.widgets.percentage2 = mod.FindUIWidgetWithName(percentage2);
    }

    private static setupFlashOverlays(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const multiplier = uiConfig.progressBarMultiplier;
        const progress = PayloadState.instance.progressInPercent;
        const rightOffsetPos = mod.CreateVector(uiConfig.progressBarRightOffset, 5, 0);
        const leftOffsetPos = mod.CreateVector(uiConfig.progressBarLeftOffset, 0, 0);
        const rightSize = mod.CreateVector(uiConfig.progressBarWidth - (multiplier * progress), 10, 0);
        const leftSize = mod.CreateVector((multiplier * progress) - 2, 20, 0);

        const progress_backgroundflash1 = 'progress_backgroundflash1';
        mod.AddUIContainer(progress_backgroundflash1, rightOffsetPos, rightSize, mod.UIAnchor.TopRight, container, true, 0, uiConfig.enemyColour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(1));
        PayloadUI.widgets.progress_backgroundflash1 = mod.FindUIWidgetWithName(progress_backgroundflash1);

        const progress_backgroundflash2 = 'progress_backgroundflash2';
        mod.AddUIContainer(progress_backgroundflash2, rightOffsetPos, rightSize, mod.UIAnchor.TopRight, container, true, 0, uiConfig.friendlyColour, 0.01, mod.UIBgFill.GradientLeft, mod.GetTeam(2));
        PayloadUI.widgets.progress_backgroundflash2 = mod.FindUIWidgetWithName(progress_backgroundflash2);

        const progressflash1 = 'progressflash1';
        mod.AddUIContainer(progressflash1, leftOffsetPos, leftSize, mod.UIAnchor.TopLeft, container, true, 0, uiConfig.friendlyColour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(1));
        PayloadUI.widgets.progressflash1 = mod.FindUIWidgetWithName(progressflash1);

        const progressflash2 = 'progressflash2';
        mod.AddUIContainer(progressflash2, leftOffsetPos, leftSize, mod.UIAnchor.TopLeft, container, true, 0, uiConfig.enemyColour, 0.01, mod.UIBgFill.GradientRight, mod.GetTeam(2));
        PayloadUI.widgets.progressflash2 = mod.FindUIWidgetWithName(progressflash2);
    }

    private static setupPlayerCounts(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const leftPos = mod.CreateVector(-35, 26, 0);
        const rightPos = mod.CreateVector(35, 26, 0);
        const countSize = mod.CreateVector(50, 30, 0);
        const zeroMsg = mod.Message(mod.stringkeys.payload.counter, 0);

        const left_player_count1 = 'left_player_count1';
        mod.AddUIText(left_player_count1, leftPos, countSize, mod.UIAnchor.TopCenter, container, true, 0, uiConfig.friendlyColour, 0.9, mod.UIBgFill.None, zeroMsg, 26, uiConfig.friendlyColour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        PayloadUI.widgets.left_player_count1 = mod.FindUIWidgetWithName(left_player_count1);

        const left_player_count2 = 'left_player_count2';
        mod.AddUIText(left_player_count2, leftPos, countSize, mod.UIAnchor.TopCenter, container, true, 0, uiConfig.friendlyColour, 0.9, mod.UIBgFill.None, zeroMsg, 26, uiConfig.friendlyColour, 1, mod.UIAnchor.Center, mod.GetTeam(2));
        PayloadUI.widgets.left_player_count2 = mod.FindUIWidgetWithName(left_player_count2);

        const right_player_count1 = 'right_player_count1';
        mod.AddUIText(right_player_count1, rightPos, countSize, mod.UIAnchor.TopCenter, container, true, 0, uiConfig.enemyColour, 0.9, mod.UIBgFill.None, zeroMsg, 26, uiConfig.enemyColour, 1, mod.UIAnchor.Center, mod.GetTeam(1));
        PayloadUI.widgets.right_player_count1 = mod.FindUIWidgetWithName(right_player_count1);

        const right_player_count2 = 'right_player_count2';
        mod.AddUIText(right_player_count2, rightPos, countSize, mod.UIAnchor.TopCenter, container, true, 0, uiConfig.enemyColour, 0.9, mod.UIBgFill.None, zeroMsg, 26, uiConfig.enemyColour, 1, mod.UIAnchor.Center, mod.GetTeam(2));
        PayloadUI.widgets.right_player_count2 = mod.FindUIWidgetWithName(right_player_count2);
    }

    private static setupProgressIcon(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const container = PayloadUI.widgets.container!;
        const multiplier = uiConfig.progressBarMultiplier;
        const progress = PayloadState.instance.progressInPercent;
        const markerOffset = uiConfig.progressBarLeftOffset - 4;
        const name = 'payload_progress_icon';
        mod.AddUIContainer(name, mod.CreateVector(mod.RoundToInteger((markerOffset + (multiplier * progress)) * 10) / 10, 0, 0), mod.CreateVector(4, 20, 0), mod.UIAnchor.TopLeft, container, true, 0, mod.CreateVector(1, 1, 0), 1, mod.UIBgFill.Solid);
        PayloadUI.widgets.payload_progress_icon = mod.FindUIWidgetWithName(name);
    }

    private static setupCredits(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const name = 'credits';
        mod.AddUIText(name, mod.CreateVector(10, 2, 0), mod.CreateVector(300, 30, 0), mod.UIAnchor.BottomLeft, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.credits), 14, uiConfig.whiteColour, 0.6, mod.UIAnchor.Center, mod.UIDepth.AboveGameUI);
        PayloadUI.widgets.credits = mod.FindUIWidgetWithName(name);
    }

    private static setupDebugText(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const name = 'debugText';
        mod.AddUIText(name, mod.CreateVector(0, 0, 0), mod.CreateVector(600, 30, 0), mod.UIAnchor.BottomCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.debug.emptyMessage), 14, uiConfig.whiteColour, 1, mod.UIAnchor.Center);
        PayloadUI.widgets.debugText = mod.FindUIWidgetWithName(name);
    }

    private static resetWidgetCache(): void {
        const keys = Object.keys(PayloadUI.widgets) as (keyof typeof PayloadUI.widgets)[];
        for (const key of keys) {
            PayloadUI.widgets[key] = null;
        }
    }

    public static async setupEndScreen(): Promise<void> {
        const uiConfig = PayloadConfig.uiConfig;
        mod.DeleteAllUIWidgets();
        mod.AddUIContainer("endscreen", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10080, 0), mod.UIAnchor.Center);
        mod.SetUIWidgetDepth(mod.FindUIWidgetWithName("endscreen"), mod.UIDepth.AboveGameUI);
        mod.SetUIWidgetBgFill(mod.FindUIWidgetWithName("endscreen"), mod.UIBgFill.None);
        mod.AddUIText("endProgress1", mod.CreateVector(-300, 100, 0), mod.CreateVector(400, 60, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("endscreen"), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.GradientRight, mod.Message(mod.stringkeys.payload.endScreen.distance, 0), 56, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.CenterRight, mod.GetTeam(1));
        mod.AddUIText("endProgress2", mod.CreateVector(-300, 100, 0), mod.CreateVector(400, 60, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("endscreen"), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.GradientRight, mod.Message(mod.stringkeys.payload.endScreen.distance, 0), 56, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.CenterRight, mod.GetTeam(2));
        mod.AddUIText("endTime1", mod.CreateVector(300, 100, 0), mod.CreateVector(400, 60, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("endscreen"), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.GradientLeft, mod.Message(mod.stringkeys.payload.endScreen.time, 0, 0, 0), 56, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.CenterLeft, mod.GetTeam(1));
        mod.AddUIText("endTime2", mod.CreateVector(300, 100, 0), mod.CreateVector(400, 60, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("endscreen"), true, 0, mod.CreateVector(0, 0, 0), 0.8, mod.UIBgFill.GradientLeft, mod.Message(mod.stringkeys.payload.endScreen.time, 0, 0, 0), 56, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.CenterLeft, mod.GetTeam(2));

        if (PayloadState.instance.progressInPercent > 99) {
            mod.SetUITextColor(mod.FindUIWidgetWithName("endProgress1"), uiConfig.friendlyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endProgress2"), uiConfig.enemyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endTime1"), uiConfig.friendlyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endTime2"), uiConfig.enemyColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endProgress1"), uiConfig.friendlyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endProgress2"), uiConfig.enemyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endTime1"), uiConfig.friendlyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endTime2"), uiConfig.enemyBgColour);
        } else {
            mod.SetUITextColor(mod.FindUIWidgetWithName("endProgress1"), uiConfig.enemyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endProgress2"), uiConfig.friendlyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endTime1"), uiConfig.enemyColour);
            mod.SetUITextColor(mod.FindUIWidgetWithName("endTime2"), uiConfig.friendlyColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endProgress1"), uiConfig.enemyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endProgress2"), uiConfig.friendlyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endTime1"), uiConfig.enemyBgColour);
            mod.SetUIWidgetBgColor(mod.FindUIWidgetWithName("endTime2"), uiConfig.friendlyBgColour);
        }

        const targetTime = mod.GetMatchTimeElapsed();
        const targetProgress = PayloadState.instance.progressInPercent;

        const duration = 0.66;
        const steps = 20;
        const waitTime = duration / steps;
        const sound = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_UI_Gauntlet_EOM_Qualified_OneShot2D, mod.CreateVector(0, 0, 0), mod.CreateVector(1, 1, 1), mod.CreateVector(1, 1, 1));

        mod.PlaySound(sound, 0.5);

        for (let i = 1; i <= steps; i++) {
            const currentTime = mod.Floor((targetTime / steps) * i);
            const currentProgress = mod.Divide(mod.Floor(mod.Multiply(((targetProgress / steps) * i), 100)), 100);

            const minutes = mod.Floor(currentTime / 60);
            const tensOfSeconds = mod.Floor((mod.Modulo(currentTime, 60)) / 10);
            const seconds = mod.Modulo(currentTime, 10);

            const msgProgress = mod.Message(mod.stringkeys.payload.endScreen.distance, currentProgress);
            const msgTime = mod.Message(mod.stringkeys.payload.endScreen.time, minutes, tensOfSeconds, seconds);

            mod.SetUITextLabel(mod.FindUIWidgetWithName("endProgress1"), msgProgress);
            mod.SetUITextLabel(mod.FindUIWidgetWithName("endProgress2"), msgProgress);
            mod.SetUITextLabel(mod.FindUIWidgetWithName("endTime1"), msgTime);
            mod.SetUITextLabel(mod.FindUIWidgetWithName("endTime2"), msgTime);

            await mod.Wait(waitTime);
        }
    }

    public static setupPreRoundUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

        mod.EnableUIInputMode(true, player);

        const borderContainerName = `pr_bg_border_${playerId}`;
        // Clean up if already exists
        const oldBorder = mod.FindUIWidgetWithName(borderContainerName);
        if (oldBorder) {
            mod.DeleteUIWidget(oldBorder);
        }

        // 1. Root border container (Slightly larger than inner container to form a border)
        mod.AddUIContainer(borderContainerName, mod.CreateVector(0, 0, 0), mod.CreateVector(800, 500, 0), mod.UIAnchor.Center, player);
        const borderContainer = mod.FindUIWidgetWithName(borderContainerName)!;
        mod.SetUIWidgetBgFill(borderContainer, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(borderContainer, mod.CreateVector(0, 0, 0)); // Gold Border
        mod.SetUIWidgetBgAlpha(borderContainer, 0.9);
        mod.SetUIWidgetDepth(borderContainer, mod.UIDepth.BelowGameUI);

        // 2. Main Container (Glassmorphic dark blur)
        const containerName = `pr_container_${playerId}`;
        mod.AddUIContainer(containerName, mod.CreateVector(0, 0, 0), mod.CreateVector(800, 500, 0), mod.UIAnchor.Center, borderContainer, true, 0, mod.CreateVector(1, 0.8, 0), 0.4, mod.UIBgFill.OutlineThin, player);
        const container = mod.FindUIWidgetWithName(containerName)!;

        // 3. Header Panel (with its own outline/border)
        const hdrBorderName = `pr_hdr_border_${playerId}`;
        mod.AddUIContainer(hdrBorderName, mod.CreateVector(0, -195, 0), mod.CreateVector(704, 64, 0), mod.UIAnchor.Center, container, true, 0, mod.CreateVector(1, 0.8, 0), 0.35, mod.UIBgFill.Solid, player);
        const hdrBorder = mod.FindUIWidgetWithName(hdrBorderName)!;

        const hdrInnerName = `pr_hdr_inner_${playerId}`;
        mod.AddUIContainer(hdrInnerName, mod.CreateVector(0, 0, 0), mod.CreateVector(700, 60, 0), mod.UIAnchor.Center, hdrBorder, true, 0, mod.CreateVector(0.06, 0.06, 0.06), 0.95, mod.UIBgFill.Solid, player);
        const hdrInner = mod.FindUIWidgetWithName(hdrInnerName)!;

        // Title text inside header
        const titleName = `pr_title_${playerId}`;
        mod.AddUIText(
            titleName, mod.CreateVector(0, 0, 0), mod.CreateVector(700, 60, 0), mod.UIAnchor.Center,
            hdrInner, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
            mod.Message(mod.stringkeys.payload.preRound.title), 30, mod.CreateVector(1, 0.8, 0), 1,
            mod.UIAnchor.Center, player
        );

        // 4. Team 1 Column Panel (Attackers)
        const t1BorderName = `pr_t1_border_${playerId}`;
        mod.AddUIContainer(t1BorderName, mod.CreateVector(-180, -10, 0), mod.CreateVector(344, 254, 0), mod.UIAnchor.Center, container, true, 0, mod.CreateVector(0.5, 0.8, 1), 0.4, mod.UIBgFill.Solid, player);
        const t1Border = mod.FindUIWidgetWithName(t1BorderName)!;

        const t1InnerName = `pr_t1_inner_${playerId}`;
        mod.AddUIContainer(t1InnerName, mod.CreateVector(0, 0, 0), mod.CreateVector(340, 250, 0), mod.UIAnchor.Center, t1Border, true, 0, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.Solid, player);
        const t1Inner = mod.FindUIWidgetWithName(t1InnerName)!;

        // Team 1 Header Panel
        const t1HdrName = `pr_t1_hdr_${playerId}`;
        mod.AddUIContainer(t1HdrName, mod.CreateVector(0, -105, 0), mod.CreateVector(340, 40, 0), mod.UIAnchor.Center, t1Inner, true, 0, mod.CreateVector(0.5, 0.8, 1), 0.25, mod.UIBgFill.Solid, player);
        const t1Hdr = mod.FindUIWidgetWithName(t1HdrName)!;

        // Team 1 Header Text
        const t1TitleName = `pr_t1_title_${playerId}`;
        mod.AddUIText(
            t1TitleName, mod.CreateVector(0, 0, 0), mod.CreateVector(340, 40, 0), mod.UIAnchor.Center,
            t1Hdr, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
            mod.Message(mod.stringkeys.payload.preRound.team1), 20, mod.CreateVector(0.5, 0.8, 1), 1,
            mod.UIAnchor.Center, player
        );

        // 5. Team 2 Column Panel (Defenders)
        const t2BorderName = `pr_t2_border_${playerId}`;
        mod.AddUIContainer(t2BorderName, mod.CreateVector(180, -10, 0), mod.CreateVector(344, 254, 0), mod.UIAnchor.Center, container, true, 0, mod.CreateVector(1, 0.4, 0.4), 0.4, mod.UIBgFill.Solid, player);
        const t2Border = mod.FindUIWidgetWithName(t2BorderName)!;

        const t2InnerName = `pr_t2_inner_${playerId}`;
        mod.AddUIContainer(t2InnerName, mod.CreateVector(0, 0, 0), mod.CreateVector(340, 250, 0), mod.UIAnchor.Center, t2Border, true, 0, mod.CreateVector(0.1, 0.04, 0.04), 0.9, mod.UIBgFill.Solid, player);
        const t2Inner = mod.FindUIWidgetWithName(t2InnerName)!;

        // Team 2 Header Panel
        const t2HdrName = `pr_t2_hdr_${playerId}`;
        mod.AddUIContainer(t2HdrName, mod.CreateVector(0, -105, 0), mod.CreateVector(340, 40, 0), mod.UIAnchor.Center, t2Inner, true, 0, mod.CreateVector(1, 0.4, 0.4), 0.25, mod.UIBgFill.Solid, player);
        const t2Hdr = mod.FindUIWidgetWithName(t2HdrName)!;

        // Team 2 Header Text
        const t2TitleName = `pr_t2_title_${playerId}`;
        mod.AddUIText(
            t2TitleName, mod.CreateVector(0, 0, 0), mod.CreateVector(340, 40, 0), mod.UIAnchor.Center,
            t2Hdr, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
            mod.Message(mod.stringkeys.payload.preRound.team2), 20, mod.CreateVector(1, 0.4, 0.4), 1,
            mod.UIAnchor.Center, player
        );

        // 6. Action Panel (at the bottom)
        const actBorderName = `pr_action_border_${playerId}`;
        mod.AddUIContainer(actBorderName, mod.CreateVector(0, 180, 0), mod.CreateVector(704, 74, 0), mod.UIAnchor.Center, container, true, 0, mod.CreateVector(0.2, 0.2, 0.2), 0.35, mod.UIBgFill.None, player);
        const actBorder = mod.FindUIWidgetWithName(actBorderName)!;

        const actInnerName = `pr_action_inner_${playerId}`;
        mod.AddUIContainer(actInnerName, mod.CreateVector(0, 0, 0), mod.CreateVector(700, 70, 0), mod.UIAnchor.Center, actBorder, true, 0, mod.CreateVector(0.06, 0.06, 0.06), 0.95, mod.UIBgFill.None, player);
        const actInner = mod.FindUIWidgetWithName(actInnerName)!;

        // Ready Button
        const readyBtnName = `pr_ready_btn_${playerId}`;
        mod.AddUIButton(
            readyBtnName, mod.CreateVector(-160, 0, 0), mod.CreateVector(240, 44, 0), mod.UIAnchor.Center,
            actInner, true, 0, mod.CreateVector(0.2, 0.2, 0.2), 0.9, mod.UIBgFill.Solid,
            true, mod.CreateVector(0.2, 0.2, 0.2), 0.9, mod.CreateVector(0.1, 0.1, 0.1), 0.5,
            mod.CreateVector(0.1, 1, 0.2), 1, mod.CreateVector(0.1, 1, 0.2), 1,
            mod.CreateVector(0.1, 1, 0.2), 1, player
        );
        const readyBtn = mod.FindUIWidgetWithName(readyBtnName)!;
        mod.EnableUIButtonEvent(readyBtn, mod.UIButtonEvent.ButtonUp, true);

        // Ready Button Text
        const readyBtnTxtName = `pr_ready_txt_${playerId}`;
        mod.AddUIText(
            readyBtnTxtName, mod.CreateVector(-160, 0, 0), mod.CreateVector(240, 44, 0), mod.UIAnchor.Center,
            actInner, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
            mod.Message(mod.stringkeys.payload.preRound.ready), 18, mod.CreateVector(1, 1, 1), 1,
            mod.UIAnchor.Center, player
        );

        // Switch Team Button
        const switchBtnName = `pr_switch_btn_${playerId}`;
        mod.AddUIButton(
            switchBtnName, mod.CreateVector(160, 0, 0), mod.CreateVector(240, 44, 0), mod.UIAnchor.Center,
            actInner, true, 0, mod.CreateVector(0.2, 0.2, 0.2), 0.9, mod.UIBgFill.Solid,
            true, mod.CreateVector(0.2, 0.2, 0.2), 0.9, mod.CreateVector(0.1, 0.1, 0.1), 0.5,
            mod.CreateVector(0.1, 0.6, 1), 1, mod.CreateVector(0.1, 0.6, 1), 1,
            mod.CreateVector(0.1, 0.6, 1), 1, player
        );
        const switchBtn = mod.FindUIWidgetWithName(switchBtnName)!;
        mod.EnableUIButtonEvent(switchBtn, mod.UIButtonEvent.ButtonUp, true);

        // Switch Team Button Text
        const switchBtnTxtName = `pr_switch_txt_${playerId}`;
        mod.AddUIText(
            switchBtnTxtName, mod.CreateVector(160, 0, 0), mod.CreateVector(240, 44, 0), mod.UIAnchor.Center,
            actInner, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
            mod.Message(mod.stringkeys.payload.preRound.switchTeam), 18, mod.CreateVector(1, 1, 1), 1,
            mod.UIAnchor.Center, player
        );

        // Call updatePreRoundUI to draw player lists immediately for this player
        PayloadUI.updatePreRoundUI();
    }

    public static updatePreRoundUI(): void {
        if (!PayloadState.instance.isPreRound) return;

        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);

        // Split all players into Team 1 and Team 2 lists
        const team1Players: mod.Player[] = [];
        const team2Players: mod.Player[] = [];

        for (let i = 0; i < playerCount; i++) {
            const p = mod.ValueInArray(allPlayers, i);
            if (mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier)) continue;

            const teamId = mod.GetObjId(mod.GetTeam(p));
            if (teamId === 1) {
                team1Players.push(p);
            } else if (teamId === 2) {
                team2Players.push(p);
            }
        }

        // Update the UI lists for EVERY player who has their pre-round container active
        for (let j = 0; j < playerCount; j++) {
            const viewer = mod.ValueInArray(allPlayers, j);
            if (mod.GetSoldierState(viewer, mod.SoldierStateBool.IsAISoldier)) continue;

            const viewerId = mod.GetObjId(viewer);
            const t1InnerName = `pr_t1_inner_${viewerId}`;
            const t2InnerName = `pr_t2_inner_${viewerId}`;
            const t1Inner = mod.FindUIWidgetWithName(t1InnerName);
            const t2Inner = mod.FindUIWidgetWithName(t2InnerName);
            if (!t1Inner || !t2Inner) continue;

            const headerBorder = mod.FindUIWidgetWithName(`pr_hdr_border_${viewerId}`);
            const headerInner = mod.FindUIWidgetWithName(`pr_hdr_inner_${viewerId}`);
            const headerTitle = mod.FindUIWidgetWithName(`pr_title_${viewerId}`);
            const isStarting = PayloadState.instance.preRoundCountdownActive;
            if (headerBorder && headerInner && headerTitle) {
                if (isStarting) {
                    mod.SetUIWidgetBgColor(headerBorder, mod.CreateVector(0.1, 0.7, 0.2));
                    mod.SetUIWidgetBgColor(headerInner, mod.CreateVector(0.04, 0.12, 0.04));
                    mod.SetUITextColor(headerTitle, mod.CreateVector(0.2, 1, 0.3));
                    mod.SetUITextLabel(
                        headerTitle,
                        mod.Message(
                            mod.stringkeys.payload.preRound.startingIn,
                            PayloadState.instance.preRoundCountdownRemaining
                        )
                    );
                } else {
                    mod.SetUIWidgetBgColor(headerBorder, mod.CreateVector(1, 0.8, 0));
                    mod.SetUIWidgetBgColor(headerInner, mod.CreateVector(0.06, 0.06, 0.06));
                    mod.SetUITextColor(headerTitle, mod.CreateVector(1, 0.8, 0));
                    mod.SetUITextLabel(headerTitle, mod.Message(mod.stringkeys.payload.preRound.title));
                }
            }

            // First, delete any existing player list item widgets for this viewer (up to 16)
            for (let i = 0; i < 16; i++) {
                const w1 = mod.FindUIWidgetWithName(`pr_t1_p_${i}_${viewerId}`);
                if (w1) mod.DeleteUIWidget(w1);
                const w2 = mod.FindUIWidgetWithName(`pr_t2_p_${i}_${viewerId}`);
                if (w2) mod.DeleteUIWidget(w2);
            }

            // Draw Team 1 Players (Attackers)
            for (let i = 0; i < Math.min(team1Players.length, 16); i++) {
                const p = team1Players[i];
                const pId = mod.GetObjId(p);
                const pData = PayloadState.getPlayerData(pId);
                const color = pData.isReady ? mod.CreateVector(0.1, 0.8, 0.2) : mod.CreateVector(0.8, 0.2, 0.2);
                const textName = `pr_t1_p_${i}_${viewerId}`;

                mod.AddUIText(
                    textName, mod.CreateVector(0, -65 + i * 25, 0), mod.CreateVector(320, 25, 0), mod.UIAnchor.Center,
                    t1Inner, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
                    mod.Message(mod.stringkeys.payload.preRound.playerName, p), 18, color, 1,
                    mod.UIAnchor.Center, viewer
                );
            }

            // Draw Team 2 Players (Defenders)
            for (let i = 0; i < Math.min(team2Players.length, 16); i++) {
                const p = team2Players[i];
                const pId = mod.GetObjId(p);
                const pData = PayloadState.getPlayerData(pId);
                const color = pData.isReady ? mod.CreateVector(0.1, 0.8, 0.2) : mod.CreateVector(0.8, 0.2, 0.2);
                const textName = `pr_t2_p_${i}_${viewerId}`;

                mod.AddUIText(
                    textName, mod.CreateVector(0, -65 + i * 25, 0), mod.CreateVector(320, 25, 0), mod.UIAnchor.Center,
                    t2Inner, true, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None,
                    mod.Message(mod.stringkeys.payload.preRound.playerName, p), 18, color, 1,
                    mod.UIAnchor.Center, viewer
                );
            }

            // Update the ready button label text for the viewer themselves
            const readyBtnTxt = mod.FindUIWidgetWithName(`pr_ready_txt_${viewerId}`);
            if (readyBtnTxt) {
                const viewerData = PayloadState.getPlayerData(viewerId);
                const btnMsg = viewerData.isReady
                    ? mod.Message(mod.stringkeys.payload.preRound.unready)
                    : mod.Message(mod.stringkeys.payload.preRound.ready);
                mod.SetUITextLabel(readyBtnTxt, btnMsg);
            }
        }
    }

    public static removePreRoundUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

        mod.EnableUIInputMode(false, player);

        const borderContainerName = `pr_bg_border_${playerId}`;
        const borderContainer = mod.FindUIWidgetWithName(borderContainerName);
        if (borderContainer) {
            mod.DeleteUIWidget(borderContainer);
        }
    }
    //#endregion

    //#region Every-Tick Updates

    public static updatePlayerCountUI(): void {
        const team1 = PayloadState.instance.playersInPushProximity.get(1)!.length;
        const team2 = PayloadState.instance.playersInPushProximity.get(2)!.length;
        if (team1 === PayloadUI.prevTeam1Count && team2 === PayloadUI.prevTeam2Count) return;

        PayloadUI.prevTeam1Count = team1;
        PayloadUI.prevTeam2Count = team2;

        const uiConfig = PayloadConfig.uiConfig;
        mod.SetUITextLabel(PayloadUI.widgets.left_player_count1!, mod.Message(mod.stringkeys.payload.counter, team1));
        mod.SetUITextLabel(PayloadUI.widgets.left_player_count2!, mod.Message(mod.stringkeys.payload.counter, team2));
        mod.SetUITextLabel(PayloadUI.widgets.right_player_count1!, mod.Message(mod.stringkeys.payload.counter, team2));
        mod.SetUITextLabel(PayloadUI.widgets.right_player_count2!, mod.Message(mod.stringkeys.payload.counter, team1));

        if (team1 == 0) {
            mod.SetUITextColor(PayloadUI.widgets.left_player_count1!, uiConfig.whiteColour);
            mod.SetUITextColor(PayloadUI.widgets.right_player_count2!, uiConfig.whiteColour);
        } else {
            mod.SetUITextColor(PayloadUI.widgets.left_player_count1!, uiConfig.friendlyColour);
            mod.SetUITextColor(PayloadUI.widgets.right_player_count2!, uiConfig.enemyColour);
        }

        if (team2 == 0) {
            mod.SetUITextColor(PayloadUI.widgets.left_player_count2!, uiConfig.whiteColour);
            mod.SetUITextColor(PayloadUI.widgets.right_player_count1!, uiConfig.whiteColour);
        } else {
            mod.SetUITextColor(PayloadUI.widgets.left_player_count2!, uiConfig.friendlyColour);
            mod.SetUITextColor(PayloadUI.widgets.right_player_count1!, uiConfig.enemyColour);
        }
    }

    public static animateProgressFlash(): void {
        if (PayloadState.instance.progressBarFlashAlpha <= 0) return;

        const state = PayloadState.instance;
        const alpha = state.progressBarFlashAlpha / 10;

        if (state.payloadState == PayloadMovementState.ADVANCING) {
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash1!, alpha);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash2!, alpha);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash1!, 0.01);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash2!, 0.01);
        } else if (state.payloadState == PayloadMovementState.PUSHING_BACK) {
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash1!, alpha);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash2!, alpha);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash1!, 0.01);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash2!, 0.01);
        } else {
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash1!, 0.01);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progressflash2!, 0.01);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash1!, 0.01);
            mod.SetUIWidgetBgAlpha(PayloadUI.widgets.progress_backgroundflash2!, 0.01);
        }

        if (state.payloadState == PayloadMovementState.IDLE || state.payloadState == PayloadMovementState.LOCKED) {
            mod.SetUITextAlpha(PayloadUI.widgets.payloadstatus1!, 1);
            mod.SetUITextAlpha(PayloadUI.widgets.payloadstatus2!, 1);
        } else {
            mod.SetUITextAlpha(PayloadUI.widgets.payloadstatus1!, alpha);
            mod.SetUITextAlpha(PayloadUI.widgets.payloadstatus2!, alpha);
        }

        // Decay alpha
        state.progressBarFlashAlpha -= 0.5;
        if (state.progressBarFlashAlpha < 0) {
            state.progressBarFlashAlpha = 0;
        }
    }

    public static updateDebugUI(): void {
        if (!PayloadConfig.enableDebug) return;
        if (!PayloadUI.widgets.debugText) return;
        mod.SetUITextLabel(PayloadUI.widgets.debugText, mod.Message(mod.stringkeys.payload.debug.tickrate, PayloadState.instance.ticks, PayloadState.instance.tickrate));
    }

    //#endregion

    //#region Every-Second Updates

    public static updateCheckpointTimer(remainingTime: number): void {
        const mins = mod.Floor(remainingTime / 60);
        const secs = mod.Floor(mod.Modulo(remainingTime, 60));
        const uiConfig = PayloadConfig.uiConfig;

        if (PayloadState.instance.overtime && remainingTime <= 0) {
            const overtimeMsg = mod.Message(mod.stringkeys.payload.state.overtime);
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time1!, overtimeMsg);
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time2!, overtimeMsg);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time1!, uiConfig.goldBgColour);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time2!, uiConfig.goldBgColour);
            PayloadSounds.playOvertime();
        } else if (remainingTime > 0) {
            const timerMsg = mod.Message(PayloadUI.timerStringKey, mins, mod.Floor(secs / 10), mod.Modulo(secs, 10));
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time1!, timerMsg);
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time2!, timerMsg);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time1!, uiConfig.enemyBgColour);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time2!, uiConfig.friendlyBgColour);
        } else {
            const zeroMsg = mod.Message(PayloadUI.timerStringKey, 0, 0, 0);
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time1!, zeroMsg);
            mod.SetUITextLabel(PayloadUI.widgets.remaining_time2!, zeroMsg);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time1!, uiConfig.enemyBgColour);
            mod.SetUIWidgetBgColor(PayloadUI.widgets.remaining_time2!, uiConfig.friendlyBgColour);
        }
    }

    //#endregion

    //#region State-Change Updates

    public static updateStatusUI(): void {
        const uiConfig = PayloadConfig.uiConfig;
        let stateLabel = mod.stringkeys.payload.state.idle;
        mod.SetUIImageColor(PayloadUI.widgets.payload_icon1!, uiConfig.whiteColour);
        mod.SetUIImageColor(PayloadUI.widgets.payload_icon2!, uiConfig.whiteColour);
        mod.SetUITextColor(PayloadUI.widgets.payloadstatus1!, uiConfig.whiteColour);
        mod.SetUITextColor(PayloadUI.widgets.payloadstatus2!, uiConfig.whiteColour);
        mod.SetUITextSize(PayloadUI.widgets.payloadstatus1!, uiConfig.statusFontSize);
        mod.SetUITextSize(PayloadUI.widgets.payloadstatus2!, uiConfig.statusFontSize);

        switch (PayloadState.instance.payloadState) {
            case PayloadMovementState.ADVANCING:
                stateLabel = mod.stringkeys.payload.state.advancing;
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon1!, uiConfig.friendlyColour);
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon2!, uiConfig.enemyColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus1!, uiConfig.friendlyColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus2!, uiConfig.enemyColour);
                break;
            case PayloadMovementState.PUSHING_BACK:
                stateLabel = mod.stringkeys.payload.state.pushing_back;
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon1!, uiConfig.enemyColour);
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon2!, uiConfig.friendlyColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus1!, uiConfig.enemyColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus2!, uiConfig.friendlyColour);
                break;
            case PayloadMovementState.CONTESTED:
                stateLabel = mod.stringkeys.payload.state.contested;
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon1!, uiConfig.goldColour);
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon2!, uiConfig.goldColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus1!, uiConfig.goldColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus2!, uiConfig.goldColour);
                break;
            case PayloadMovementState.LOCKED:
                stateLabel = mod.stringkeys.payload.state.locked;
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon1!, uiConfig.goldColour);
                mod.SetUIImageColor(PayloadUI.widgets.payload_icon2!, uiConfig.goldColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus1!, uiConfig.goldColour);
                mod.SetUITextColor(PayloadUI.widgets.payloadstatus2!, uiConfig.goldColour);
                mod.SetUITextSize(PayloadUI.widgets.payloadstatus1!, uiConfig.lockedFontSize);
                mod.SetUITextSize(PayloadUI.widgets.payloadstatus2!, uiConfig.lockedFontSize);
                break;
        }

        const statusMsg = mod.Message(mod.stringkeys.payload.state.message, stateLabel);
        mod.SetUITextLabel(PayloadUI.widgets.payloadstatus1!, statusMsg);
        mod.SetUITextLabel(PayloadUI.widgets.payloadstatus2!, statusMsg);
    }

    public static updateProgressUI(): void {
        const uiConfig = PayloadConfig.uiConfig;
        const multiplier = uiConfig.progressBarMultiplier;
        const progress = PayloadState.instance.progressInPercent;

        const leftProgress = mod.RoundToInteger(multiplier * progress) - 2;
        const rightProgress = mod.RoundToInteger(uiConfig.progressBarWidth - (multiplier * progress));
        const progressIconPos = mod.RoundToInteger(((uiConfig.progressBarLeftOffset - 4) + (multiplier * progress)) * 100) / 100;

        const leftSize = mod.CreateVector(leftProgress, 20, 0);
        const rightSize = mod.CreateVector(rightProgress, 10, 0);
        const percentMsg = mod.Message(mod.stringkeys.payload.state.percentage, mod.Floor(progress));

        mod.SetUIWidgetSize(PayloadUI.widgets.progress1!, leftSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progress2!, leftSize);
        mod.SetUITextLabel(PayloadUI.widgets.percentage1!, percentMsg);
        mod.SetUITextLabel(PayloadUI.widgets.percentage2!, percentMsg);
        mod.SetUIWidgetSize(PayloadUI.widgets.progress_background1!, rightSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progress_background2!, rightSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progressflash1!, leftSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progressflash2!, leftSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progress_backgroundflash1!, rightSize);
        mod.SetUIWidgetSize(PayloadUI.widgets.progress_backgroundflash2!, rightSize);
        mod.SetUIWidgetPosition(PayloadUI.widgets.payload_progress_icon!, mod.CreateVector(progressIconPos, 0, 0));
    }

    //#endregion

    //#region Triggers

    public static triggerProgressFlash(): void {
        PayloadState.instance.progressBarFlashAlpha = 10;
    }

    //#endregion

    //#region One-Time Events

    public static async updateCheckpointUI(): Promise<void> {
        const uiConfig = PayloadConfig.uiConfig;
        mod.AddUIText('checkpointreached', mod.CreateVector(0, 100, 0), mod.CreateVector(500, 80, 0), mod.UIAnchor.TopCenter, PayloadUI.widgets.container!, true, 0, uiConfig.goldBgColour, 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.checkpoints.blankmessage), 52, uiConfig.goldColour, 1, mod.UIAnchor.Center);
        const checkpointWidget = mod.FindUIWidgetWithName('checkpointreached');
        for (let i = 0; i < 500; i += 25) {
            mod.SetUIWidgetSize(checkpointWidget, mod.CreateVector(i, 80, 0));
            await mod.Wait(0.033);
        }
        mod.SetUIWidgetSize(checkpointWidget, mod.CreateVector(500, 80, 0));
        mod.SetUITextLabel(checkpointWidget, mod.Message(mod.stringkeys.payload.checkpoints.message));
        await mod.Wait(6);
        mod.SetUITextLabel(checkpointWidget, mod.Message(mod.stringkeys.payload.checkpoints.blankmessage));
        for (let i = 500; i > 0; i -= 25) {
            mod.SetUIWidgetSize(checkpointWidget, mod.CreateVector(i, 80, 0));
            await mod.Wait(0.033);
        }
        mod.DeleteUIWidget(checkpointWidget);
    }

    public static async nukeUI(): Promise<void> {
        const uiConfig = PayloadConfig.uiConfig;
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
        mod.AddUIContainer('nuke', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, PayloadUI.widgets.container!, true, 0, uiConfig.whiteColour, 1, mod.UIBgFill.Solid);
        mod.AddUIContainer('nukeScreenEffect', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, PayloadUI.widgets.container!, true, 0, uiConfig.goldColour, 0.5, mod.UIBgFill.Blur);
        const nukeWidget = mod.FindUIWidgetWithName('nuke');
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
            mod.SetUIWidgetBgAlpha(nukeWidget, i / 10);
            await mod.Wait(0.066);
        }
        PayloadUI.setupEndScreen();

        mod.DeleteUIWidget(nukeWidget);

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

    //#endregion

    //#region Per-Player UI

    public static initPlayerUIContainer(eventPlayer: mod.Player): void {
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

    public static getPlayerUIContainer(player: mod.Player): mod.UIWidget {
        const playerData = PayloadState.getPlayerData(player);
        if (!playerData.containerWidget) {
            PayloadUI.initPlayerUIContainer(player);
        }
        return playerData.containerWidget!;
    }

    public static async outOfBoundsUI(player: mod.Player): Promise<void> {
        if (!PayloadState.instance.gameOngoing) return;
        const playerData = PayloadState.getPlayerData(player);
        playerData.outOfBounds = true;
        if (playerData.oobTimer > 0) return;

        const playerUI = PayloadUI.getPlayerUIContainer(player);
        playerData.outOfBounds = true;
        playerData.oobTimer = PayloadConfig.oobGracePeriod;
        mod.SkipManDown(player, true);
        mod.AddUIContainer('OOBBackground', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.Blur, player);
        mod.AddUIText('OOBText', mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0.6, 0.1, 0.1), 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.outofbounds), 56, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.TopCenter, player);
        mod.AddUIText('Countdown', mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 1, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, playerData.oobTimer), 72, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.BottomCenter, player);

        for (let i = playerData.oobTimer; i > 0; i--) {
            mod.SetUITextLabel(mod.FindUIWidgetWithName('Countdown', playerUI), mod.Message(mod.stringkeys.payload.counter, i));
            PayloadSounds.playOOBsound(player);
            await mod.Wait(1);
            if (!PayloadState.instance.gameOngoing) {
                playerData.outOfBounds = false;
                break;
            }
            if (!playerData.outOfBounds || !mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) break;
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

    public static async DeployBoundsCheck(player: mod.Player): Promise<void> {
        const playerData = PayloadState.getPlayerData(player);
        if (!playerData.outOfBounds) return;
        // TODO: clarify why the wait is needed.
        await mod.Wait(0.6);
        mod.UndeployPlayer(player);
        playerData.outOfBounds = false;
    }

    public static clearPlayerUI(playerId: number): void {
        const playerData = PayloadState.getPlayerData(playerId);
        if (!playerData.containerWidget) return;
        mod.DeleteUIWidget(playerData.containerWidget);
        playerData.containerWidget = null;
    }

    //#endregion
}
