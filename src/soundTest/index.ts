const ZERO_VEC = mod.CreateVector(0, 0, 0);
const MOVE_RIGHT = mod.CreateVector(-3, 0, 0);
const MOVE_LEFT = mod.CreateVector(3, 0, 0);
let TO_MY_RIGHT = ZERO_VEC;
let TO_MY_LEFT = ZERO_VEC;
let SFX3D: mod.SFX;
let BARREL: mod.SpatialObject
let i = 0;

export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    await mod.Wait(1);
    const playerPos = mod.GetObjectPosition(eventPlayer);
    TO_MY_RIGHT = mod.Add(playerPos, MOVE_RIGHT);
    TO_MY_LEFT = mod.Add(playerPos, MOVE_LEFT);
    SFX3D = mod.SpawnObject(mod.RuntimeSpawn_Common.SFX_GameModes_Rush_Alarm_SimpleLoop3D, TO_MY_RIGHT, ZERO_VEC);
    BARREL = mod.SpawnObject(mod.RuntimeSpawn_Abbasid.BarrelOil_01_D, TO_MY_RIGHT, ZERO_VEC);
    await mod.Wait(1);
    debugPos();
}

export async function OngoingPlayer(eventPlayer: mod.Player): Promise<void> {
    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)) return;
    if (i == 0) {
        mod.PlaySound(SFX3D, 1.0)
    }
    // MOVE LEFT
    if (i % 2 == 0) {
        // mod.PlaySound(SFX3D, 1.0, TO_MY_LEFT, 20);
        // mod.SetObjectTransform(SFX3D, mod.CreateTransform(TO_MY_LEFT, ZERO_VEC));
        mod.SetObjectTransformOverTime(SFX3D, mod.CreateTransform(TO_MY_LEFT, ZERO_VEC), 1, false, false);
        // mod.MoveObject(SFX3D, MOVE_LEFT);
        // mod.MoveObjectOverTime(SFX3D, MOVE_LEFT, ZERO_VEC, 1, false, false);
        // mod.SetObjectTransform(BARREL, mod.CreateTransform(TO_MY_LEFT, ZERO_VEC));
        mod.SetObjectTransformOverTime(BARREL, mod.CreateTransform(TO_MY_LEFT, ZERO_VEC), 1, false, false);
        // mod.MoveObject(BARREL, MOVE_LEFT);
        // mod.MoveObjectOverTime(BARREL, MOVE_LEFT, ZERO_VEC, 1, false, false);
    }
    // MOVE RIGHT
    else if (i % 2 == 1) {
        // mod.PlaySound(SFX3D, 1.0, TO_MY_RIGHT, 20);
        // mod.SetObjectTransform(SFX3D, mod.CreateTransform(TO_MY_RIGHT, ZERO_VEC));
        mod.SetObjectTransformOverTime(SFX3D, mod.CreateTransform(TO_MY_RIGHT, ZERO_VEC), 1, false, false);
        // mod.MoveObject(SFX3D, MOVE_RIGHT);
        // mod.MoveObjectOverTime(SFX3D, MOVE_RIGHT, ZERO_VEC, 1, false, false);
        // mod.SetObjectTransform(BARREL, mod.CreateTransform(TO_MY_RIGHT, ZERO_VEC));
        mod.SetObjectTransformOverTime(BARREL, mod.CreateTransform(TO_MY_RIGHT, ZERO_VEC), 1, false, false);
        // mod.MoveObject(BARREL, MOVE_RIGHT);
        // mod.MoveObjectOverTime(BARREL, MOVE_RIGHT, ZERO_VEC, 1, false, false);
    }
    i = i + 1;
    await mod.Wait(1);
    debugPos();
}

function debugPos() {
    // debug sfx position
    mod.SendErrorReport(mod.Message(mod.stringkeys.new_location, mod.XComponentOf(mod.GetObjectPosition(SFX3D)), mod.YComponentOf(mod.GetObjectPosition(SFX3D)), mod.ZComponentOf(mod.GetObjectPosition(SFX3D))));
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.new_location, mod.XComponentOf(mod.GetObjectPosition(SFX3D)), mod.YComponentOf(mod.GetObjectPosition(SFX3D)), mod.ZComponentOf(mod.GetObjectPosition(SFX3D))));
    mod.SendErrorReport(mod.Message(mod.stringkeys.sound_type, mod.IsType(SFX3D, mod.Types.SFX) ? 1 : 0));
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.sound_type, mod.IsType(SFX3D, mod.Types.SFX) ? 1 : 0));
    // debug barrel position
    mod.SendErrorReport(mod.Message(mod.stringkeys.barrel_new_location, mod.XComponentOf(mod.GetObjectPosition(BARREL)), mod.YComponentOf(mod.GetObjectPosition(BARREL)), mod.ZComponentOf(mod.GetObjectPosition(BARREL))));
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.barrel_new_location, mod.XComponentOf(mod.GetObjectPosition(BARREL)), mod.YComponentOf(mod.GetObjectPosition(BARREL)), mod.ZComponentOf(mod.GetObjectPosition(BARREL))));
}