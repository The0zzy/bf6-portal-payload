import { Events } from 'bf6-portal-utils/events';
import { ReadyUpSounds } from './ReadyUpSounds.ts';
import { ReadyUpState } from './ReadyUpState.ts';
import { ReadyUpUI } from './ReadyUpUI.ts';

export class ReadyUpSystem {
    private static completed = false;
    private static transitionStarted = false;
    private static onReady: () => void | Promise<void> = () => {};
    private static preRoundCountdownDurationSeconds = 5;
    private static finalCountdownDurationSeconds = 10;
    private static unsubscribers: Array<() => void> = [];

    public static isCompleted(): boolean {
        return ReadyUpSystem.completed;
    }

    public static start(): void;
    public static start(onReady: () => void | Promise<void>, preRoundCountdownDurationSeconds: number, finalCountdownDurationSeconds: number): void;
    // mod.JsAction('main.ReadyUpSystem.start') can be used to invoke this from blocks.
    public static start(
        onReady?: () => void | Promise<void>,
        preRoundCountdownDurationSeconds?: number,
        finalCountdownDurationSeconds?: number
    ): void {
        if (!ReadyUpSystem.completed && ReadyUpState.isPreRound) {
            mod.SendErrorReport(mod.Message(mod.stringkeys.readyup.already_started));
            return;
        }

        ReadyUpSystem.cleanupSubscriptions();
        ReadyUpSystem.completed = false;
        ReadyUpSystem.transitionStarted = false;
        ReadyUpSystem.onReady = onReady ?? (() => {});
        ReadyUpSystem.preRoundCountdownDurationSeconds = preRoundCountdownDurationSeconds ?? 5;
        ReadyUpSystem.finalCountdownDurationSeconds = finalCountdownDurationSeconds ?? 10;

        ReadyUpSystem.init();
    }

    private static init(): void {
        ReadyUpState.reset();
        mod.PauseGameModeTime(true);

        ReadyUpSounds.init();

        const unsubscribeButton = Events.OnPlayerUIButtonEvent.subscribe((player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) => {
            ReadyUpSystem.handleUIButtonEvent(player, widget, event);
        });

        const unsubscribeDeployed = Events.OnPlayerDeployed.subscribe((eventPlayer: mod.Player) => {
            if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
                return;
            }
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
                return;
            }

            ReadyUpUI.setupPreRoundUI(eventPlayer);
        });

        const unsubscribeLeave = Events.OnPlayerLeaveGame.subscribe((playerId: number) => {
            if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
                return;
            }

            ReadyUpUI.clearPlayerUI(playerId);
            ReadyUpState.playerData.delete(playerId);
            ReadyUpUI.updatePreRoundUI();
            ReadyUpSystem.checkPreRoundStartCondition();
        });

        ReadyUpSystem.unsubscribers = [unsubscribeButton, unsubscribeDeployed, unsubscribeLeave];
    }

    private static cleanupSubscriptions(): void {
        for (const unsubscribe of ReadyUpSystem.unsubscribers) {
            unsubscribe();
        }
        ReadyUpSystem.unsubscribers = [];
    }

    private static handleUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
        if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
            return;
        }

        const name = mod.GetUIWidgetName(widget);
        const playerId = mod.GetObjId(player);

        if (name === `pr_ready_btn_${playerId}`) {
            if (!mod.Equals(event, mod.UIButtonEvent.ButtonUp)) {
                return;
            }

            const pData = ReadyUpState.getPlayerData(playerId);
            pData.isReady = !pData.isReady;
            ReadyUpUI.updatePreRoundUI();
            ReadyUpSystem.checkPreRoundStartCondition();
            return;
        }

        if (name === `pr_switch_btn_${playerId}`) {
            if (!mod.Equals(event, mod.UIButtonEvent.ButtonUp)) {
                return;
            }

            const currentTeam = mod.GetTeam(player);
            const otherTeam = mod.Equals(currentTeam, mod.GetTeam(1)) ? mod.GetTeam(2) : mod.GetTeam(1);
            mod.SetTeam(player, otherTeam);

            const pData = ReadyUpState.getPlayerData(playerId);
            pData.isReady = false;

            ReadyUpUI.updatePreRoundUI();
            ReadyUpSystem.checkPreRoundStartCondition();
        }
    }

    private static checkPreRoundStartCondition(): void {
        if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
            return;
        }

        const { allReady } = ReadyUpSystem.getPreRoundReadiness();
        if (allReady) {
            if (ReadyUpState.preRoundCountdownActive) {
                return;
            }

            ReadyUpState.preRoundCountdownActive = true;
            ReadyUpState.preRoundCountdownRemaining = ReadyUpSystem.preRoundCountdownDurationSeconds;
            ReadyUpState.preRoundCountdownToken += 1;
            const token = ReadyUpState.preRoundCountdownToken;

            ReadyUpUI.updatePreRoundUI();
            ReadyUpSystem.startPreRoundCountdown(token);
            return;
        }

        if (ReadyUpState.preRoundCountdownActive) {
            ReadyUpSystem.cancelPreRoundCountdown();
            ReadyUpUI.updatePreRoundUI();
        }
    }

    private static getPreRoundReadiness(): { activeHumanCount: number; readyCount: number; allReady: boolean } {
        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);

        let activeHumanCount = 0;
        let readyCount = 0;

        for (let i = 0; i < playerCount; i++) {
            const p = mod.ValueInArray(allPlayers, i);
            if (mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier)) {
                continue;
            }

            activeHumanCount++;
            const pId = mod.GetObjId(p);
            if (ReadyUpState.getPlayerData(pId).isReady) {
                readyCount++;
            }
        }

        return {
            activeHumanCount,
            readyCount,
            allReady: activeHumanCount > 0 && readyCount === activeHumanCount,
        };
    }

    private static cancelPreRoundCountdown(): void {
        ReadyUpState.preRoundCountdownActive = false;
        ReadyUpState.preRoundCountdownRemaining = 0;
        ReadyUpState.preRoundCountdownToken += 1;
    }

    private static async startPreRoundCountdown(token: number): Promise<void> {
        for (let secondsLeft = ReadyUpSystem.preRoundCountdownDurationSeconds; secondsLeft >= 1; secondsLeft--) {
            if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
                return;
            }
            if (
                !ReadyUpState.preRoundCountdownActive ||
                ReadyUpState.preRoundCountdownToken !== token
            ) {
                return;
            }

            const { allReady } = ReadyUpSystem.getPreRoundReadiness();
            if (!allReady) {
                ReadyUpSystem.cancelPreRoundCountdown();
                ReadyUpUI.updatePreRoundUI();
                return;
            }

            ReadyUpState.preRoundCountdownRemaining = secondsLeft;
            ReadyUpUI.updatePreRoundUI();
            ReadyUpSounds.playPreRoundCountdownBeep();
            await mod.Wait(1);
        }

        if (!ReadyUpState.isPreRound || ReadyUpSystem.completed) {
            return;
        }
        if (!ReadyUpState.preRoundCountdownActive || ReadyUpState.preRoundCountdownToken !== token) {
            return;
        }

        const { allReady } = ReadyUpSystem.getPreRoundReadiness();
        if (!allReady) {
            ReadyUpSystem.cancelPreRoundCountdown();
            ReadyUpUI.updatePreRoundUI();
            return;
        }

        ReadyUpSystem.cancelPreRoundCountdown();
        await ReadyUpSystem.beginGameTransition();
    }

    private static async beginGameTransition(): Promise<void> {
        if (ReadyUpSystem.transitionStarted || ReadyUpSystem.completed) {
            return;
        }
        ReadyUpSystem.transitionStarted = true;

        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);
        for (let i = 0; i < playerCount; i++) {
            const p = mod.ValueInArray(allPlayers, i);
            if (mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier)) {
                continue;
            }

            ReadyUpUI.removePreRoundUI(p);
        }

        mod.UndeployAllPlayers();
        mod.EnableAllPlayerDeploy(false);

        const countdownName = 'pr_countdown';
        const titleName = 'pr_countdown_title';
        const oldWidget = mod.FindUIWidgetWithName(countdownName);
        if (oldWidget) {
            mod.DeleteUIWidget(oldWidget);
        }
        const oldTitle = mod.FindUIWidgetWithName(titleName);
        if (oldTitle) {
            mod.DeleteUIWidget(oldTitle);
        }

        mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);

        mod.AddUIText(
            countdownName,
            mod.CreateVector(0, 150, 0),
            mod.CreateVector(10000, 10000, 0),
            mod.UIAnchor.Center,
            mod.Message(mod.stringkeys.readyup.countdown, ReadyUpSystem.finalCountdownDurationSeconds)
        );
        const widget = mod.FindUIWidgetWithName(countdownName)!;
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 256);
        mod.SetUITextColor(widget, ReadyUpUI.fgColor);
        mod.SetUIWidgetDepth(widget, mod.UIDepth.AboveGameUI);
        mod.SetUITextAnchor(widget, mod.UIAnchor.Center);

        mod.AddUIText(
            titleName,
            mod.CreateVector(0, -150, 0),
            mod.CreateVector(10000, 150, 0),
            mod.UIAnchor.Center,
            mod.Message(mod.stringkeys.readyup.objective)
        );
        const titleWidget = mod.FindUIWidgetWithName(titleName)!;
        mod.SetUIWidgetBgFill(titleWidget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(titleWidget, 0.1);
        mod.SetUIWidgetBgColor(titleWidget, ReadyUpUI.bgColor);
        mod.SetUITextSize(titleWidget, 156);
        mod.SetUITextColor(titleWidget, ReadyUpUI.fgColor);
        mod.SetUIWidgetDepth(titleWidget, mod.UIDepth.AboveGameUI);
        mod.SetUITextAnchor(titleWidget, mod.UIAnchor.Center);

        for (let secondsLeft = ReadyUpSystem.finalCountdownDurationSeconds; secondsLeft >= 1; secondsLeft--) {
            mod.SetUITextLabel(widget, mod.Message(mod.stringkeys.readyup.countdown, secondsLeft));
            if (secondsLeft <= 5) {
                ReadyUpSounds.playFinalCountdown();
            }
            await mod.Wait(1);
        }

        const swipeOverlayName = 'swipe_overlay';
        const oldSwipe = mod.FindUIWidgetWithName(swipeOverlayName);
        if (oldSwipe) {
            mod.DeleteUIWidget(oldSwipe);
        }

        mod.AddUIContainer(
            swipeOverlayName,
            mod.CreateVector(0, -1200, 0),
            mod.CreateVector(10000, 1200, 0),
            mod.UIAnchor.TopCenter
        );
        const swipeWidget = mod.FindUIWidgetWithName(swipeOverlayName)!;
        mod.SetUIWidgetBgFill(swipeWidget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(swipeWidget, ReadyUpUI.fgColor);
        mod.SetUIWidgetBgAlpha(swipeWidget, 1.0);
        mod.SetUIWidgetDepth(swipeWidget, mod.UIDepth.AboveGameUI);

        const swipeSteps = 15;
        const swipeStepDuration = 0.03;
        for (let i = 1; i <= swipeSteps; i++) {
            const progress = i / swipeSteps;
            const easedProgress = progress * (2 - progress);
            const yPos = -1200 + 1200 * easedProgress;
            mod.SetUIWidgetPosition(swipeWidget, mod.CreateVector(0, yPos, 0));
            await mod.Wait(swipeStepDuration);
        }

        ReadyUpSounds.playImpactSound();

        mod.DeleteUIWidget(widget);
        mod.DeleteUIWidget(titleWidget);

        ReadyUpState.isPreRound = false;
        ReadyUpState.preRoundCountdownActive = false;
        ReadyUpState.preRoundCountdownRemaining = 0;
        ReadyUpSystem.completed = true;
        ReadyUpSystem.cleanupSubscriptions();

        await Promise.resolve(ReadyUpSystem.onReady());

        mod.EnableAllPlayerDeploy(true);

        for (let i = 1; i <= swipeSteps; i++) {
            const progress = i / swipeSteps;
            const easedProgress = progress * progress;
            const yPos = 1200 * easedProgress;
            mod.SetUIWidgetPosition(swipeWidget, mod.CreateVector(0, yPos, 0));
            await mod.Wait(swipeStepDuration);
        }

        mod.DeleteUIWidget(swipeWidget);
    }
}
