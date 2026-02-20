let spatial: mod.SpatialObject;
let spatialId: number;

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const playerPos = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetPosition);
    const spawnPos = mod.Add(playerPos, mod.CreateVector(0, 0, 1));
    const rotation = mod.CreateVector(0, 0, 0);
    spatial = mod.SpawnObject(
        mod.RuntimeSpawn_Abbasid.M1083CargoTruck_01_Canopy,
        spawnPos,
        rotation,
        mod.CreateVector(1, 1, 1)
    );
    spatialId = mod.GetObjId(spatial);
    mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialId));
}

export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsCrouching)
    ) {
        debugSpatial();
        mod.EnableSpatialObject(spatial, true);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialEnabled));
    } else if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsProne)
    ) {
        debugSpatial();
        mod.EnableSpatialObject(spatial, false);
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialDisabled));
    }
}

function debugSpatial() {
    if (spatial !== undefined) {
        if (mod.GetSpatialObject(spatialId)) {
            const pos = mod.GetObjectPosition(spatial);
            const rot = mod.GetObjectRotation(spatial);
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialPosition, mod.XComponentOf(pos), mod.YComponentOf(pos), mod.ZComponentOf(pos)));
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialRotation, mod.XComponentOf(rot), mod.YComponentOf(rot), mod.ZComponentOf(rot)));
        } else {
            mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialIdNotFound, spatialId));
        }
    } else {
        mod.DisplayHighlightedWorldLogMessage(mod.Message(mod.stringkeys.spatialUndefined));
    }
}