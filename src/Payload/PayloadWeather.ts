import { PayloadConfig } from "./PayloadConfig.ts";
import { PayloadCore } from "./PayloadCore.ts";

export class PayloadWeather {
    private static weatherEnabled = false;
    private static weatherResetOngoing = false;
    private static weatherResetInQueue = false;

    public static init(): void {
        if (PayloadConfig.enableCompetitiveMode) return;
        const weatherIndicatorObj = mod.GetSpatialObject(4000);
        if (PayloadCore.isSpatialValid(weatherIndicatorObj)) {
            const objPos = mod.GetObjectPosition(weatherIndicatorObj);
            PayloadWeather.weatherEnabled = mod.RoundToInteger(mod.RandomReal(0, 1)) === 1;
            if (PayloadWeather.weatherEnabled) {
                mod.AddUIContainer('WinterFilter', mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName('container'), true, 0, mod.CreateVector(0, 0.8, 1), 0.1, mod.UIBgFill.Blur);
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(3.15, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 3.15), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(1, 0, 0), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 1), mod.CreateVector(10000, 10000, 10000));
                mod.SpawnObject(mod.RuntimeSpawn_Common.EnvironmentDecalVolume_Winter_Event, objPos, mod.CreateVector(0, 0, 0), mod.CreateVector(10000, 10000, 10000));
                PayloadWeather.resetWeatherVFX();
            }
        }
    }

    public static async resetWeatherVFX(): Promise<void> {
        if (!PayloadWeather.weatherEnabled) return;
        if (PayloadWeather.weatherResetOngoing) {
            PayloadWeather.weatherResetInQueue = true;
            return;
        }

        PayloadWeather.weatherResetOngoing = true;
        for (let i = 3000; i < 3300; i++) {
            mod.EnableVFX(mod.GetVFX(i), false);
            mod.EnableVFX(mod.GetVFX(i), true);
            if (i % 5 === 0) {
                await mod.Wait(0.066);
            }
        }

        PayloadWeather.weatherResetOngoing = false;
        if (PayloadWeather.weatherResetInQueue) {
            PayloadWeather.weatherResetInQueue = false;
            PayloadWeather.resetWeatherVFX();
        }
    }
}
