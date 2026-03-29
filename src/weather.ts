let weather = 0;

// This is working and is a false positive
export function initWeather() {
    const objPos = mod.GetObjectPosition(mod.GetSpatialObject(4000));
    if (!(mod.XComponentOf(objPos) == 0 || mod.YComponentOf(objPos) == 0 || mod.ZComponentOf(objPos) == 0)) {
        weather = mod.RoundToInteger(mod.RandomReal(0, 1));
        if (weather === 1) {
            mod.AddUIContainer("WinterFilter", mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("container"), true, 0, mod.CreateVector(0, 0.8, 1), 0.1, mod.UIBgFill.Blur);
            const snow = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
            const snow2 = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(3.15, 0, 0), mod.CreateVector(10000, 10000, 10000));
            const snow3 = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 3.15), mod.CreateVector(10000, 10000, 10000));
            const snow4 = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(1, 0, 0), mod.CreateVector(10000, 10000, 10000));
            const snow5 = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 1), mod.CreateVector(10000, 10000, 10000));
            const snow6 = mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
            for (let i = 3000; i < 3300; i++) {
                mod.EnableVFX(mod.GetVFX(i), true);
            }
        }
    }
}

export async function resetWeatherVFX() {
    if (weather > 0) {
        for (let i = 3000; i < 3300; i++) {
            mod.EnableVFX(mod.GetVFX(i), false);
            await mod.Wait(0.033);
        }
    }
    if (weather === 1) {
        for (let i = 3000; i < 3300; i++) {
            mod.EnableVFX(mod.GetVFX(i), true);
            await mod.Wait(0.033);
        }
    }
}
