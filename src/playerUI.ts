import { PLAYER } from "./config.ts";
import { playOOBsound } from "./sounds.ts";

const UniqueIDPlayerVar = 0;
const MAX_POOL_SIZE = 128; // Built-in BF6 maximum player limit

let availableIds: string[] = [];
let usedIds: string[] = [];
let poolInitialized = false;

function refreshIdPool() {
    availableIds = [];
    for (let i = 1; i <= MAX_POOL_SIZE; i++) {
        //availableIds.push(`PlayerUI_${i}`);
        availableIds.push("PlayerUI" + i);
    }

    // Remove IDs currently in use by active players
    const allPlayers = mod.AllPlayers();
    const count = mod.CountOf(allPlayers);

    for (let i = 0; i < count; i++) {
        const p = mod.ValueInArray(allPlayers, i) as mod.Player;
        const usedId = mod.GetVariable(mod.ObjectVariable(p, PLAYER.UniquePlayerID)) as string;
        if (usedId) {
            const index = availableIds.indexOf(usedId);
            if (index > -1) {
                availableIds.splice(index, 1);
            }
        }
    }
}

/**
 * Assigns a unique UI container to a player upon joining.
 * This utilizes a widget pooling system (reusing IDs from 1 to 128) designed specifically 
 * for the Frostbite engine to recycle widget names when players disconnect.
 * By using exactly the same ID from a previously disconnected player, and executing
 * mod.DeleteUIWidget BEFORE creating the new one, any ghost UI elements orphaned 
 * in memory are aggressively garbage collected to prevent server slowdowns and crashes.
 */
export function playerUI_onPlayerJoinGame(eventPlayer: mod.Player): void {
    if (!poolInitialized) {
        refreshIdPool();
        poolInitialized = true;
    }

    // If pool is exhausted (all 128 slots taken), recalculate just in case
    // a player left without being properly unregistered.
    if (availableIds.length === 0) {
        refreshIdPool();
    }


    let assignedId = "PlayerUI_Overflow";
    if (availableIds.length > 0) {
        // Pop an available ID from the front of the free list
        assignedId = availableIds.shift() as string;
    }

    mod.SetVariable(mod.ObjectVariable(eventPlayer, PLAYER.UniquePlayerID), assignedId);
    if (usedIds.indexOf(assignedId) === -1) {
        usedIds.push(assignedId);
    } else {
        mod.DeleteUIWidget(mod.FindUIWidgetWithName(assignedId));
    }

    // Create a fresh container widget unique to this player
    mod.AddUIContainer(assignedId, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, eventPlayer);

    // Configure the container
    const newWidget = mod.FindUIWidgetWithName(assignedId);
    mod.SetUIWidgetBgFill(newWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(newWidget, mod.UIDepth.AboveGameUI);
}

/**
 * Helper to retrieve a player's assigned unique UI container name.
 */
export function getPlayerUIContainerName(player: mod.Player): string {
    return mod.GetVariable(mod.ObjectVariable(player, PLAYER.UniquePlayerID)) as string;
}

/**
 * Helper to retrieve a player's actual UI container Widget.
 * Use this as the parent widget when assigning child UI elements specific to this player.
 */
export function getPlayerUIWidget(player: mod.Player): mod.UIWidget {
    const containerName = getPlayerUIContainerName(player);
    return mod.FindUIWidgetWithName(containerName);
}


export async function OutofBoundsUI(player: mod.Player): Promise<void> {
    if (mod.GetVariable(mod.ObjectVariable(player, PLAYER.OutofBounds)) as boolean) return;
    if (mod.GetVariable(mod.ObjectVariable(player, PLAYER.OOBTimer)) as boolean) return;
    mod.SendErrorReport(mod.Message(mod.stringkeys.test5));
    const playerUI = getPlayerUIWidget(player);
    mod.SetVariable(mod.ObjectVariable(player, PLAYER.OutofBounds), true);
    mod.SetVariable(mod.ObjectVariable(player, PLAYER.OOBTimer), true);
    mod.SkipManDown(player, true);
    mod.AddUIContainer("OOBBackground", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 0.9, mod.UIBgFill.Blur, player);
    mod.AddUIText("OOBText", mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0.6, 0.1, 0.1), 0.8, mod.UIBgFill.Blur, mod.Message(mod.stringkeys.payload.outofbounds), 56, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.TopCenter, player);
    mod.AddUIText("Countdown", mod.CreateVector(0, 470, 0), mod.CreateVector(450, 150, 0), mod.UIAnchor.TopCenter, playerUI, true, 1, mod.CreateVector(0, 0, 0), 1, mod.UIBgFill.None, mod.Message(mod.stringkeys.payload.counter, 5), 72, mod.CreateVector(1, 0.2, 0.2), 1, mod.UIAnchor.BottomCenter, player);
    mod.SendErrorReport(mod.Message(mod.stringkeys.test6));
    for (let i = 5; i > 0; i--) {
        mod.SetUITextLabel(mod.FindUIWidgetWithName("Countdown", playerUI), mod.Message(mod.stringkeys.payload.counter, i));
        playOOBsound(player);
        await mod.Wait(1);
        if (!mod.GetVariable(mod.ObjectVariable(player, PLAYER.OutofBounds))) break;
    }
    mod.SetVariable(mod.ObjectVariable(player, PLAYER.OOBTimer), false);
    if (mod.GetVariable(mod.ObjectVariable(player, PLAYER.OutofBounds))) {
        mod.DealDamage(player, 10000);
    } else {
        mod.SkipManDown(player, false);
    }
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("OOBBackground", playerUI));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("OOBText", playerUI));
    mod.DeleteUIWidget(mod.FindUIWidgetWithName("Countdown", playerUI));
    mod.SetVariable(mod.ObjectVariable(player, PLAYER.OutofBounds), false);
    mod.SendErrorReport(mod.Message(mod.stringkeys.test7));
}