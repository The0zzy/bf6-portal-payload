
// This is working and is a false positive
export function initWeather() {
    const objPos = mod.GetObjectPosition(mod.GetSpatialObject(4000));
    if (!(mod.XComponentOf(objPos) == 0 || mod.YComponentOf(objPos) == 0 || mod.ZComponentOf(objPos) == 0)) {
        const type = mod.RoundToInteger(mod.RandomReal(0, 1));
        if (type === 0) {
            const snow = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
            for (let i = 3000; i < 3999; i++) {
                mod.EnableVFX(mod.GetVFX(i), true);
            }
        }
    }
}


