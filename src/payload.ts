// Translated from Blockly workspace to Battlefield 6 Portal TypeScript

let iterator = 0;
let track = mod.EmptyArray();
let checkpoints = mod.EmptyArray();
let Payload: mod.SpatialObject | undefined;
const TrackCurrent = 0;

// Setup (OnGameModeStarted)
export async function OnGameModeStarted(): Promise<void> {
    checkpoints = mod.AppendToArray(checkpoints, 0); // Dummy entry at index 0

    // Spawn payload object (door) at origin, identity rotation and scale
    Payload = mod.SpawnObject(
        mod.RuntimeSpawn_Common.FiringRange_ExitDoor_01,
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(0, 0, 0),
        mod.CreateVector(1, 1, 1)
    ) as mod.SpatialObject;

    // Build track from spatial object ids 1000..1999
    for (iterator = 1000; iterator < 1999; iterator++) {
        const objPos = mod.GetObjectPosition(mod.GetSpatialObject(iterator));
        if (!(mod.XComponentOf(objPos) == 0 && mod.YComponentOf(objPos) == 0)) {
            track = mod.AppendToArray(track, objPos);
        }
    }

    // Move payload to first track point after short wait
    await mod.Wait(1);
    const start = mod.FirstOf(track);
    mod.MoveObject(Payload, start, mod.CreateVector(0, 0, 0));

    // Collect checkpoints from spatial object ids 2000..2999
    for (iterator = 2000; iterator < 2999; iterator++) {
        const cp = mod.GetSpatialObject(iterator);
        const cpPos = mod.GetObjectPosition(cp);
        // Check for non-zero position to confirm existence
        if (!(mod.XComponentOf(cpPos) == 0 && mod.YComponentOf(cpPos) == 0)) {
            checkpoints = mod.AppendToArray(checkpoints, (iterator - 2000));
        }
    }
}

// OnPlayerDeployed: notify player about track/checkpoints
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    // "Track Size: {}"
    mod.DisplayNotificationMessage(
        mod.Message(mod.stringkeys.payload.track.size, mod.CountOf(track)),
        eventPlayer
    );

    // "No of Checkpoints: {}"
    mod.DisplayNotificationMessage(
        mod.Message(mod.stringkeys.payload.checkpoints.count, mod.CountOf(checkpoints)),
        eventPlayer
    );

    // Optional status message with current/target indices
    mod.DisplayNotificationMessage(
        mod.Message(
            mod.stringkeys.payload.status,
            TrackCurrent,
            mod.CountOf(track),
            mod.CountOf(checkpoints)
        ),
        eventPlayer
    );
}
