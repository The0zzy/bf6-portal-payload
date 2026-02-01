export function OnPlayerDeployed(player: mod.Player) {
    let position1 = mod.GetSoldierState(
        player,
        mod.SoldierStateVector.GetPosition
    );
    let position2 = mod.Add(position1, mod.ForwardVector());
    let object1 = mod.SpawnObject(
        mod.RuntimeSpawn_Common.ChairPlastic_01_A,
        position1,
        mod.CreateVector(0, 0, 0)
    );
    let object2 = mod.SpawnObject(
        mod.RuntimeSpawn_Common.ChairPlastic_01_B,
        position2,
        mod.CreateVector(0, 0, 0)
    );
    mod.AddUIIcon(
        object1,
        mod.WorldIconImages.Skull,
        3,
        mod.CreateVector(1, 0, 0),
        mod.Message(mod.stringkeys.text)
    );
    mod.AddUIIcon(
        object2,
        mod.WorldIconImages.Skull,
        3,
        mod.CreateVector(0, 1, 0),
        mod.Message(mod.stringkeys.text),
        player
    );

    // TEST WORLD ICON
    // const iconPos = mod.Add(mod.ForwardVector(), mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition));
    // const worldicon = mod.SpawnObject(mod.RuntimeSpawn_Common.WorldIcon, mod.Add(mod.UpVector(), mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition)), mod.CreateVector(0, 0, 0));
    // mod.SetWorldIconColor(worldicon, mod.CreateVector(1, 0, 0));
    // mod.SetWorldIconImage(worldicon, mod.WorldIconImages.Skull);
    // //mod.SetWorldIconOwner(worldicon, mod.GetTeam(player));
    // mod.SetWorldIconPosition(worldicon, iconPos);
    // mod.EnableWorldIconImage(worldicon, true);
    // mod.EnableWorldIconText(worldicon, true);
}