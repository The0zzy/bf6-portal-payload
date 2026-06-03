import { ReadyUpConfig, type ResolvedReadyUpSystemConfig } from './ReadyUpConfig.ts';
import { ReadyUpState } from './ReadyUpState.ts';

export class ReadyUpUI {
    private readonly config: ResolvedReadyUpSystemConfig;

    constructor(config: ResolvedReadyUpSystemConfig) {
        this.config = config;
    }

    public setupPreRoundUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

        mod.EnableUIInputMode(true, player);

        const borderContainerName = `pr_bg_border_${playerId}`;
        const oldBorder = mod.FindUIWidgetWithName(borderContainerName);
        if (oldBorder) {
            mod.DeleteUIWidget(oldBorder);
        }

        mod.AddUIContainer(
            borderContainerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(800, 500, 0),
            mod.UIAnchor.Center,
            player
        );
        const borderContainer = mod.FindUIWidgetWithName(borderContainerName)!;
        mod.SetUIWidgetBgFill(borderContainer, mod.UIBgFill.Solid);
        mod.SetUIWidgetBgColor(borderContainer, mod.CreateVector(0, 0, 0));
        mod.SetUIWidgetBgAlpha(borderContainer, 0.9);
        mod.SetUIWidgetDepth(borderContainer, mod.UIDepth.BelowGameUI);

        const containerName = `pr_container_${playerId}`;
        mod.AddUIContainer(
            containerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(800, 500, 0),
            mod.UIAnchor.Center,
            borderContainer,
            true,
            0,
            ReadyUpConfig.goldColour,
            0.4,
            mod.UIBgFill.OutlineThin,
            player
        );
        const container = mod.FindUIWidgetWithName(containerName)!;

        const hdrBorderName = `pr_hdr_border_${playerId}`;
        mod.AddUIContainer(
            hdrBorderName,
            mod.CreateVector(0, -195, 0),
            mod.CreateVector(704, 64, 0),
            mod.UIAnchor.Center,
            container,
            true,
            0,
            ReadyUpConfig.goldColour,
            0.35,
            mod.UIBgFill.Solid,
            player
        );
        const hdrBorder = mod.FindUIWidgetWithName(hdrBorderName)!;

        const hdrInnerName = `pr_hdr_inner_${playerId}`;
        mod.AddUIContainer(
            hdrInnerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(700, 60, 0),
            mod.UIAnchor.Center,
            hdrBorder,
            true,
            0,
            mod.CreateVector(0.06, 0.06, 0.06),
            0.95,
            mod.UIBgFill.Solid,
            player
        );
        const hdrInner = mod.FindUIWidgetWithName(hdrInnerName)!;

        const titleName = `pr_title_${playerId}`;
        mod.AddUIText(
            titleName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(700, 60, 0),
            mod.UIAnchor.Center,
            hdrInner,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.readyup.title),
            30,
            ReadyUpConfig.goldColour,
            1,
            mod.UIAnchor.Center,
            player
        );

        const t1BorderName = `pr_t1_border_${playerId}`;
        mod.AddUIContainer(
            t1BorderName,
            mod.CreateVector(-180, -10, 0),
            mod.CreateVector(344, 254, 0),
            mod.UIAnchor.Center,
            container,
            true,
            0,
            mod.CreateVector(0.5, 0.8, 1),
            0.4,
            mod.UIBgFill.Solid,
            player
        );
        const t1Border = mod.FindUIWidgetWithName(t1BorderName)!;

        const t1InnerName = `pr_t1_inner_${playerId}`;
        mod.AddUIContainer(
            t1InnerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(340, 250, 0),
            mod.UIAnchor.Center,
            t1Border,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0.9,
            mod.UIBgFill.Solid,
            player
        );
        const t1Inner = mod.FindUIWidgetWithName(t1InnerName)!;

        const t1HdrName = `pr_t1_hdr_${playerId}`;
        mod.AddUIContainer(
            t1HdrName,
            mod.CreateVector(0, -105, 0),
            mod.CreateVector(340, 40, 0),
            mod.UIAnchor.Center,
            t1Inner,
            true,
            0,
            mod.CreateVector(0.5, 0.8, 1),
            0.25,
            mod.UIBgFill.Solid,
            player
        );
        const t1Hdr = mod.FindUIWidgetWithName(t1HdrName)!;

        const t1TitleName = `pr_t1_title_${playerId}`;
        mod.AddUIText(
            t1TitleName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(340, 40, 0),
            mod.UIAnchor.Center,
            t1Hdr,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.readyup.team1),
            20,
            mod.CreateVector(0.5, 0.8, 1),
            1,
            mod.UIAnchor.Center,
            player
        );

        const t2BorderName = `pr_t2_border_${playerId}`;
        mod.AddUIContainer(
            t2BorderName,
            mod.CreateVector(180, -10, 0),
            mod.CreateVector(344, 254, 0),
            mod.UIAnchor.Center,
            container,
            true,
            0,
            mod.CreateVector(1, 0.4, 0.4),
            0.4,
            mod.UIBgFill.Solid,
            player
        );
        const t2Border = mod.FindUIWidgetWithName(t2BorderName)!;

        const t2InnerName = `pr_t2_inner_${playerId}`;
        mod.AddUIContainer(
            t2InnerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(340, 250, 0),
            mod.UIAnchor.Center,
            t2Border,
            true,
            0,
            mod.CreateVector(0.1, 0.04, 0.04),
            0.9,
            mod.UIBgFill.Solid,
            player
        );
        const t2Inner = mod.FindUIWidgetWithName(t2InnerName)!;

        const t2HdrName = `pr_t2_hdr_${playerId}`;
        mod.AddUIContainer(
            t2HdrName,
            mod.CreateVector(0, -105, 0),
            mod.CreateVector(340, 40, 0),
            mod.UIAnchor.Center,
            t2Inner,
            true,
            0,
            mod.CreateVector(1, 0.4, 0.4),
            0.25,
            mod.UIBgFill.Solid,
            player
        );
        const t2Hdr = mod.FindUIWidgetWithName(t2HdrName)!;

        const t2TitleName = `pr_t2_title_${playerId}`;
        mod.AddUIText(
            t2TitleName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(340, 40, 0),
            mod.UIAnchor.Center,
            t2Hdr,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.readyup.team2),
            20,
            mod.CreateVector(1, 0.4, 0.4),
            1,
            mod.UIAnchor.Center,
            player
        );

        const actBorderName = `pr_action_border_${playerId}`;
        mod.AddUIContainer(
            actBorderName,
            mod.CreateVector(0, 180, 0),
            mod.CreateVector(704, 74, 0),
            mod.UIAnchor.Center,
            container,
            true,
            0,
            mod.CreateVector(0.2, 0.2, 0.2),
            0.35,
            mod.UIBgFill.None,
            player
        );
        const actBorder = mod.FindUIWidgetWithName(actBorderName)!;

        const actInnerName = `pr_action_inner_${playerId}`;
        mod.AddUIContainer(
            actInnerName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(700, 70, 0),
            mod.UIAnchor.Center,
            actBorder,
            true,
            0,
            mod.CreateVector(0.06, 0.06, 0.06),
            0.95,
            mod.UIBgFill.None,
            player
        );
        const actInner = mod.FindUIWidgetWithName(actInnerName)!;

        const readyBtnName = `pr_ready_btn_${playerId}`;
        mod.AddUIButton(
            readyBtnName,
            mod.CreateVector(-160, 0, 0),
            mod.CreateVector(240, 44, 0),
            mod.UIAnchor.Center,
            actInner,
            true,
            0,
            mod.CreateVector(0.2, 0.2, 0.2),
            0.9,
            mod.UIBgFill.Solid,
            true,
            mod.CreateVector(0.2, 0.2, 0.2),
            0.9,
            mod.CreateVector(0.1, 0.1, 0.1),
            0.5,
            mod.CreateVector(0.1, 1, 0.2),
            1,
            mod.CreateVector(0.1, 1, 0.2),
            1,
            mod.CreateVector(0.1, 1, 0.2),
            1,
            player
        );
        const readyBtn = mod.FindUIWidgetWithName(readyBtnName)!;
        mod.EnableUIButtonEvent(readyBtn, mod.UIButtonEvent.ButtonUp, true);

        const readyBtnTxtName = `pr_ready_txt_${playerId}`;
        mod.AddUIText(
            readyBtnTxtName,
            mod.CreateVector(-160, 0, 0),
            mod.CreateVector(240, 44, 0),
            mod.UIAnchor.Center,
            actInner,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.readyup.ready),
            18,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIAnchor.Center,
            player
        );

        const switchBtnName = `pr_switch_btn_${playerId}`;
        mod.AddUIButton(
            switchBtnName,
            mod.CreateVector(160, 0, 0),
            mod.CreateVector(240, 44, 0),
            mod.UIAnchor.Center,
            actInner,
            true,
            0,
            mod.CreateVector(0.2, 0.2, 0.2),
            0.9,
            mod.UIBgFill.Solid,
            true,
            mod.CreateVector(0.2, 0.2, 0.2),
            0.9,
            mod.CreateVector(0.1, 0.1, 0.1),
            0.5,
            mod.CreateVector(0.1, 0.6, 1),
            1,
            mod.CreateVector(0.1, 0.6, 1),
            1,
            mod.CreateVector(0.1, 0.6, 1),
            1,
            player
        );
        const switchBtn = mod.FindUIWidgetWithName(switchBtnName)!;
        mod.EnableUIButtonEvent(switchBtn, mod.UIButtonEvent.ButtonUp, true);

        const switchBtnTxtName = `pr_switch_txt_${playerId}`;
        mod.AddUIText(
            switchBtnTxtName,
            mod.CreateVector(160, 0, 0),
            mod.CreateVector(240, 44, 0),
            mod.UIAnchor.Center,
            actInner,
            true,
            0,
            mod.CreateVector(0, 0, 0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.readyup.switchTeam),
            18,
            mod.CreateVector(1, 1, 1),
            1,
            mod.UIAnchor.Center,
            player
        );

        this.updatePreRoundUI();
    }

    public updatePreRoundUI(): void {
        if (!ReadyUpState.instance.isPreRound) return;

        const allPlayers = mod.AllPlayers();
        const playerCount = mod.CountOf(allPlayers);

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
            const isStarting = ReadyUpState.instance.preRoundCountdownActive;
            if (headerBorder && headerInner && headerTitle) {
                if (isStarting) {
                    mod.SetUIWidgetBgColor(headerBorder, mod.CreateVector(0.1, 0.7, 0.2));
                    mod.SetUIWidgetBgColor(headerInner, mod.CreateVector(0.04, 0.12, 0.04));
                    mod.SetUITextColor(headerTitle, mod.CreateVector(0.2, 1, 0.3));
                    mod.SetUITextLabel(
                        headerTitle,
                        mod.Message(mod.stringkeys.readyup.startingIn, ReadyUpState.instance.preRoundCountdownRemaining)
                    );
                } else {
                    mod.SetUIWidgetBgColor(headerBorder, ReadyUpConfig.goldColour);
                    mod.SetUIWidgetBgColor(headerInner, mod.CreateVector(0.06, 0.06, 0.06));
                    mod.SetUITextColor(headerTitle, ReadyUpConfig.goldColour);
                    mod.SetUITextLabel(headerTitle, mod.Message(mod.stringkeys.readyup.title));
                }
            }

            for (let i = 0; i < 16; i++) {
                const w1 = mod.FindUIWidgetWithName(`pr_t1_p_${i}_${viewerId}`);
                if (w1) mod.DeleteUIWidget(w1);
                const w2 = mod.FindUIWidgetWithName(`pr_t2_p_${i}_${viewerId}`);
                if (w2) mod.DeleteUIWidget(w2);
            }

            for (let i = 0; i < Math.min(team1Players.length, 16); i++) {
                const p = team1Players[i];
                const pId = mod.GetObjId(p);
                const pData = ReadyUpState.getPlayerData(pId);
                const color = pData.isReady ? mod.CreateVector(0.1, 0.8, 0.2) : mod.CreateVector(0.8, 0.2, 0.2);
                const textName = `pr_t1_p_${i}_${viewerId}`;

                mod.AddUIText(
                    textName,
                    mod.CreateVector(0, -65 + i * 25, 0),
                    mod.CreateVector(320, 25, 0),
                    mod.UIAnchor.Center,
                    t1Inner,
                    true,
                    0,
                    mod.CreateVector(0, 0, 0),
                    0,
                    mod.UIBgFill.None,
                    mod.Message(mod.stringkeys.readyup.playerName, p),
                    18,
                    color,
                    1,
                    mod.UIAnchor.Center,
                    viewer
                );
            }

            for (let i = 0; i < Math.min(team2Players.length, 16); i++) {
                const p = team2Players[i];
                const pId = mod.GetObjId(p);
                const pData = ReadyUpState.getPlayerData(pId);
                const color = pData.isReady ? mod.CreateVector(0.1, 0.8, 0.2) : mod.CreateVector(0.8, 0.2, 0.2);
                const textName = `pr_t2_p_${i}_${viewerId}`;

                mod.AddUIText(
                    textName,
                    mod.CreateVector(0, -65 + i * 25, 0),
                    mod.CreateVector(320, 25, 0),
                    mod.UIAnchor.Center,
                    t2Inner,
                    true,
                    0,
                    mod.CreateVector(0, 0, 0),
                    0,
                    mod.UIBgFill.None,
                    mod.Message(mod.stringkeys.readyup.playerName, p),
                    18,
                    color,
                    1,
                    mod.UIAnchor.Center,
                    viewer
                );
            }

            const readyBtnTxt = mod.FindUIWidgetWithName(`pr_ready_txt_${viewerId}`);
            if (readyBtnTxt) {
                const viewerData = ReadyUpState.getPlayerData(viewerId);
                const btnMsg = viewerData.isReady
                    ? mod.Message(mod.stringkeys.readyup.unready)
                    : mod.Message(mod.stringkeys.readyup.ready);
                mod.SetUITextLabel(readyBtnTxt, btnMsg);
            }
        }
    }

    public removePreRoundUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier)) return;

        mod.EnableUIInputMode(false, player);

        const borderContainerName = `pr_bg_border_${playerId}`;
        const borderContainer = mod.FindUIWidgetWithName(borderContainerName);
        if (borderContainer) {
            mod.DeleteUIWidget(borderContainer);
        }
    }

    public clearPlayerUI(playerId: number): void {
        const borderContainerName = `pr_bg_border_${playerId}`;
        const borderContainer = mod.FindUIWidgetWithName(borderContainerName);
        if (borderContainer) {
            mod.DeleteUIWidget(borderContainer);
        }
    }
}
