import { Events } from 'bf6-portal-utils/events';
import { ReadyUpConfig, type ReadyUpSystemConfig } from './ReadyUpConfig.ts';
import { ReadyUpSounds } from './ReadyUpSounds.ts';
import { ReadyUpState } from './ReadyUpState.ts';
import { ReadyUpUI } from './ReadyUpUI.ts';

export class ReadyUpSystem {
    private readonly onReady: () => void | Promise<void>;
    private readonly config: ReturnType<typeof ReadyUpConfig.resolve>;
    private readonly ui: ReadyUpUI;
    private completed = false;
    private transitionStarted = false;

    constructor(onReady: () => void | Promise<void>, config: ReadyUpSystemConfig) {
        this.onReady = onReady;
        this.config = ReadyUpConfig.resolve(config);
        this.ui = new ReadyUpUI(this.config);

        this.init();
    }

    private init(): void {
        ReadyUpState.instance.reset();
        mod.PauseGameModeTime(true);

        ReadyUpSounds.init();

        Events.OnPlayerUIButtonEvent.subscribe((player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) => {
            this.handleUIButtonEvent(player, widget, event);
        });

        Events.OnPlayerDeployed.subscribe((eventPlayer: mod.Player) => {
            if (!ReadyUpState.instance.isPreRound || this.completed) {
                return;
            }
            if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) {
                return;
            }

            this.ui.setupPreRoundUI(eventPlayer);
        });

        Events.OnPlayerLeaveGame.subscribe((playerId: number) => {
            if (!ReadyUpState.instance.isPreRound || this.completed) {
                return;
            }

            this.ui.clearPlayerUI(playerId);
            ReadyUpState.instance.playerData.delete(playerId);
            this.ui.updatePreRoundUI();
            this.checkPreRoundStartCondition();
        });
    }

    private handleUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
        if (!ReadyUpState.instance.isPreRound || this.completed) {
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
            this.ui.updatePreRoundUI();
            this.checkPreRoundStartCondition();
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

            this.ui.updatePreRoundUI();
            this.checkPreRoundStartCondition();
        }
    }

    private checkPreRoundStartCondition(): void {
        if (!ReadyUpState.instance.isPreRound || this.completed) {
            return;
        }

        const { allReady } = this.getPreRoundReadiness();
        if (allReady) {
            if (ReadyUpState.instance.preRoundCountdownActive) {
                return;
            }

            ReadyUpState.instance.preRoundCountdownActive = true;
            ReadyUpState.instance.preRoundCountdownRemaining = this.config.preRoundCountdownDurationSeconds;
            ReadyUpState.instance.preRoundCountdownToken += 1;
            const token = ReadyUpState.instance.preRoundCountdownToken;

            this.ui.updatePreRoundUI();
            this.startPreRoundCountdown(token);
            return;
        }

        if (ReadyUpState.instance.preRoundCountdownActive) {
            this.cancelPreRoundCountdown();
            this.ui.updatePreRoundUI();
        }
    }

    private getPreRoundReadiness(): { activeHumanCount: number; readyCount: number; allReady: boolean } {
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

    private cancelPreRoundCountdown(): void {
        ReadyUpState.instance.preRoundCountdownActive = false;
        ReadyUpState.instance.preRoundCountdownRemaining = 0;
        ReadyUpState.instance.preRoundCountdownToken += 1;
    }

    private async startPreRoundCountdown(token: number): Promise<void> {
        for (let secondsLeft = this.config.preRoundCountdownDurationSeconds; secondsLeft >= 1; secondsLeft--) {
            if (!ReadyUpState.instance.isPreRound || this.completed) {
                return;
            }
            if (
                !ReadyUpState.instance.preRoundCountdownActive ||
                ReadyUpState.instance.preRoundCountdownToken !== token
            ) {
                return;
            }

            const { allReady } = this.getPreRoundReadiness();
            if (!allReady) {
                this.cancelPreRoundCountdown();
                this.ui.updatePreRoundUI();
                return;
            }

            ReadyUpState.instance.preRoundCountdownRemaining = secondsLeft;
            this.ui.updatePreRoundUI();
            ReadyUpSounds.playPreRoundCountdownBeep();
            await mod.Wait(1);
        }

        if (!ReadyUpState.instance.isPreRound || this.completed) {
            return;
        }
        if (!ReadyUpState.instance.preRoundCountdownActive || ReadyUpState.instance.preRoundCountdownToken !== token) {
            return;
        }

        const { allReady } = this.getPreRoundReadiness();
        if (!allReady) {
            this.cancelPreRoundCountdown();
            this.ui.updatePreRoundUI();
            return;
        }

        this.cancelPreRoundCountdown();
        await this.beginGameTransition();
    }

    private async beginGameTransition(): Promise<void> {
        if (this.transitionStarted || this.completed) {
            return;
        }
        this.transitionStarted = true;

        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);
        for (let i = 0; i < playerCount; i++) {
            const p = mod.ValueInArray(allPlayers, i);
            if (mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier)) {
                continue;
            }

            this.ui.removePreRoundUI(p);
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
            mod.Message(mod.stringkeys.readyup.countdown, this.config.finalCountdownDurationSeconds)
        );
        const widget = mod.FindUIWidgetWithName(countdownName)!;
        mod.SetUIWidgetBgFill(widget, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgAlpha(widget, 1);
        mod.SetUIWidgetBgColor(widget, mod.CreateVector(0, 0, 0));
        mod.SetUITextSize(widget, 256);
        mod.SetUITextColor(widget, ReadyUpConfig.goldColour);
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
        mod.SetUIWidgetBgColor(titleWidget, ReadyUpConfig.goldBgColour);
        mod.SetUITextSize(titleWidget, 156);
        mod.SetUITextColor(titleWidget, ReadyUpConfig.goldColour);
        mod.SetUIWidgetDepth(titleWidget, mod.UIDepth.AboveGameUI);
        mod.SetUITextAnchor(titleWidget, mod.UIAnchor.Center);

        for (let secondsLeft = this.config.finalCountdownDurationSeconds; secondsLeft >= 1; secondsLeft--) {
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
        mod.SetUIWidgetBgColor(swipeWidget, ReadyUpConfig.goldColour);
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

        ReadyUpState.instance.isPreRound = false;
        ReadyUpState.instance.preRoundCountdownActive = false;
        ReadyUpState.instance.preRoundCountdownRemaining = 0;
        this.completed = true;

        await Promise.resolve(this.onReady());

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
