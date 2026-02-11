export enum Movemethod {
    MoveObjectWithRotation,
    MoveObjectWithRotationOverTime,
    MoveObject,
    MoveObjectOverTime,
    TransformWithRotation,
    TransformWithRotationOverTime,
    Transform,
    TransformOverTime
}

let payloadObject: mod.Object | null = null;
let lastElapsedSeconds = 0;
let spawnPoint = mod.CreateVector(0, 0, 0);
let movemethod = Movemethod.MoveObjectWithRotation;

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    let pos = mod.GetSoldierState(eventPlayer, mod.SoldierStateVector.GetPosition);
    pos = mod.Add(pos, mod.CreateVector(0, 0, 5));
    spawnPoint = pos;
    payloadObject = mod.SpawnObject(mod.RuntimeSpawn_Common.MCOM, pos, mod.CreateVector(1, 1, 1));
}

export function OngoingGlobal(): void {
    // test different functions to move object by very small increments
    const increment = mod.CreateVector(0, 0, 0.01);

    if (mod.GetMatchTimeElapsed() != lastElapsedSeconds) {
        lastElapsedSeconds = mod.GetMatchTimeElapsed();
        respawnObject();
    } else {
        if (payloadObject) {
            if (movemethod == Movemethod.MoveObjectWithRotation) {
                mod.MoveObjectWithRotation(payloadObject, increment);
            }
            else if (movemethod == Movemethod.MoveObjectWithRotationOverTime) {
                mod.MoveObjectWithRotationOverTime(payloadObject, increment);
            }
            else if (movemethod == Movemethod.MoveObject) {
                mod.MoveObject(payloadObject, increment);
            }
            else if (movemethod == Movemethod.MoveObjectOverTime) {
                mod.MoveObjectOverTime(payloadObject, increment);
            }
            else if (movemethod == Movemethod.TransformWithRotation) {
                mod.TransformWithRotation(payloadObject, increment);
            }
            else if (movemethod == Movemethod.TransformWithRotationOverTime) {
                mod.TransformWithRotationOverTime(payloadObject, increment);
            }
            else if (movemethod == Movemethod.Transform) {
                mod.Transform(payloadObject, increment);
            }
            else if (movemethod == Movemethod.TransformOverTime) {
                mod.TransformOverTime(payloadObject, increment);
            }
        }
    }
}

function respawnObject() {
    if (!mod.Equals(spawnPoint, mod.CreateVector(0, 0, 0))) {
        if (payloadObject) {
            mod.UnspawnObject(payloadObject);
        }
        payloadObject = mod.SpawnObject(mod.RuntimeSpawn_Common.MCOM, spawnPoint, mod.CreateVector(1, 1, 1));
    }
}