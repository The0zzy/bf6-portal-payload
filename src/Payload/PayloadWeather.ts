import { PayloadCore } from "./PayloadCore.ts";

export class PayloadWeather {
    private static weather = 0;

    public static init(): void {
        const weatherIndicatorObj = mod.GetSpatialObject(4000);
        if(PayloadCore.isSpatialValid(weatherIndicatorObj)) {
            const objPos = mod.GetObjectPosition(weatherIndicatorObj);
            PayloadWeather.weather = mod.RoundToInteger(mod.RandomReal(0, 1));
            if (PayloadWeather.weather === 1) {
                mod.AddUIContainer('WinterFilter', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName('container'), true, 0, mod.CreateVector(0, 0.8, 1), 0.1, mod.UIBgFill.Blur);
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(3.15, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 3.15), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(1, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 1), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
                for (let i = 3000; i < 3999; i++) {
                    mod.EnableVFX(mod.GetVFX(i), true);
                }
            }
        }
    }

    public static async resetWeatherVFX(): Promise<void> {
        for (let i = 3000; i < 3999; i++) {
            mod.EnableVFX(mod.GetVFX(i), false);
        }
        await mod.Wait(1);
        if (PayloadWeather.weather === 1) {
            for (let i = 3000; i < 3999; i++) {
                mod.EnableVFX(mod.GetVFX(i), true);
            }
        }
    }
}
