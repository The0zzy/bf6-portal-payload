import { updateCheckpointTimer, uiSetup, updateProgressUI, updateCheckpointUI, ui_onPlayerJoinGame, updateStatusUI } from './ui.ts';
import { initSounds, playCheckpointReachedSound, VOPushing, VOPushingBack, playNearEndMusic, playLowTimeVO, playNearEndVO, playPayloadReversingSound } from './sounds.ts';
import { CONFIG } from './config.ts';
import { STATE, PayloadState, type PayloadWaypoint } from './state.ts';
import { scoring_initScoreboard, scoring_onPlayerDied, scoring_onPlayerEarnedAssist, scoring_awardObjectivePoints, scoring_onPlayerLeave, scoring_onPlayerRevived, scoring_refreshScoreboard } from './scoring.ts';


function getOpponentTeam(team: mod.Team): mod.Team {
    const teamId = mod.GetObjId(team);
    return teamId === 1 ? mod.GetTeam(2) : mod.GetTeam(1);
}

function calculatePayloadProgress(): void {
    let traveledDistance = 0;
    traveledDistance = STATE.waypoints.get(STATE.reachedWaypointIndex)!.distance;
    traveledDistance += mod.DistanceBetween(STATE.waypoints.get(STATE.reachedWaypointIndex)!.position, STATE.payloadPosition);
    STATE.progressInMeters = traveledDistance;
    STATE.progressInPercent = (traveledDistance / STATE.totalDistanceInMeters) * 100;
}

function initPayloadTrack(): void {
    // Build track from spatial object ids 1000..1999
    let waypointIndex = 0;
    let distance = 0;
    for (let i = 1000; i < 1999; i++) {
        const objPos = mod.GetObjectPosition(mod.GetSpatialObject(i));
        if (mod.DistanceBetween(objPos, mod.CreateVector(0, 0, 0)) >= 1) {
            let isCheckpoint = false;
            const checkpointPos = mod.GetObjectPosition(mod.GetSpatialObject(i + 1000));
            if (mod.DistanceBetween(objPos, mod.CreateVector(0, 0, 0)) >= 1) {
                isCheckpoint = true;
                STATE.maxCheckpoints++;
            }
            if (waypointIndex > 0) {
                distance += mod.DistanceBetween(STATE.waypoints.get(waypointIndex - 1)!.position, objPos);
            }
            STATE.waypoints.set(waypointIndex, {
                position: objPos,
                isCheckpoint: isCheckpoint,
                rotation: mod.CreateVector(0, 0, 0),
                distance: distance
            });
            waypointIndex++;
        }
    }

    // If the first waypoint is not a checkpoint, make it one to ensure a first checkpoint
    const firstWaypoint = STATE.waypoints.get(0);
    if (firstWaypoint && !firstWaypoint.isCheckpoint) {
        firstWaypoint.isCheckpoint = true;
        STATE.maxCheckpoints++;
    }

    // If the last waypoint is not a checkpoint, make it one to ensure a final checkpoint
    const lastWaypoint = STATE.waypoints.get(STATE.waypoints.size - 1);
    if (lastWaypoint && !lastWaypoint.isCheckpoint) {
        lastWaypoint.isCheckpoint = true;
        STATE.maxCheckpoints++;
    }

    STATE.totalDistanceInMeters = distance;
    STATE.reachedWaypointIndex = 0;
    STATE.reachedCheckpointIndex = 0;
    STATE.currentCheckpoint = 1;
    STATE.payloadPosition = STATE.waypoints.get(0)!.position;
}

function initPayloadRotation(): void {
    const defaultFacingDirection = mod.CreateVector(0, 0, 1);
    for (let i = 0; i < STATE.waypoints.size - 1; i++) {
        const currentPos = STATE.waypoints.get(i)!.position;
        const nextPos = STATE.waypoints.get(i + 1)!.position;
        const direction = mod.DirectionTowards(currentPos, nextPos);
        const directionXZ = mod.CreateVector(mod.XComponentOf(direction), 0, mod.ZComponentOf(direction));
        const angle = mod.AngleBetweenVectors(defaultFacingDirection, directionXZ);
        const radians = mod.DegreesToRadians(angle);
        const rotation = mod.CreateVector(0, radians, 0);
        STATE.waypoints.get(i)!.rotation = rotation;
    }
}

function initPayloadObjective(): void {
    const start = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
    for (const objConfig of CONFIG.payloadObjects) {
        const spawnPos = mod.Add(start.position, objConfig.relativeOffset);
        const obj = mod.SpawnObject(
            objConfig.prefab,
            spawnPos,
            start.rotation,
            objConfig.initialSize
        );
        if (mod.IsType(obj, mod.Types.VFX)) {
            mod.EnableVFX(obj, true);
            mod.SetVFXScale(obj, 1.5);
        }
        STATE.payloadObjects.push(obj);
    }
    const vehicleSpawner = mod.SpawnObject(
        mod.RuntimeSpawn_Common.VehicleSpawner,
        start.position,
        start.rotation,
        mod.CreateVector(1, 1, 1)
    ) as mod.VehicleSpawner;
    mod.SetVehicleSpawnerVehicleType(vehicleSpawner, mod.VehicleList.M2Bradley); //Marauder - This is bugged so spawning another vehicle instead
    mod.ForceVehicleSpawnerSpawn(vehicleSpawner);
}

export function OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
    const vehiclePosition = mod.GetVehicleState(eventVehicle, mod.VehicleStateVector.VehiclePosition);
    if (mod.DistanceBetween(STATE.waypoints.get(0)!.position, vehiclePosition) < 5) {
        STATE.payloadVehicle = eventVehicle;
        mod.SetVehicleMaxHealthMultiplier(eventVehicle, 5);
    }
}

export function OngoingVehicle(eventVehicle: mod.Vehicle): void {
    if (STATE.payloadVehicle && mod.GetObjId(eventVehicle) == mod.GetObjId(STATE.payloadVehicle)) {
        mod.Heal(eventVehicle, 100);
    }
}

function initSectors(): void {
    for (let i = 103; i < 199; i++) {
        mod.EnableGameModeObjective(mod.GetSector(i), false);
    }
    for (let i = 302; i < 399; i++) {
        mod.EnableHQ(mod.GetHQ(i), false);
    }
    for (let i = 402; i < 499; i++) {
        mod.EnableHQ(mod.GetHQ(i), false);
    }
}

function getAlivePlayersInProximity(position: mod.Vector, radius: number): { t1: mod.Player[]; t2: mod.Player[] } {
    const players = mod.AllPlayers();
    let t1: mod.Player[] = [];
    let t2: mod.Player[] = [];
    const team1 = mod.GetTeam(1);
    const team2 = mod.GetTeam(2);
    const playerCount = mod.CountOf(players);

    for (let i = 0; i < playerCount; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        if (mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive)) {
            const playerPos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
            if (mod.DistanceBetween(position, playerPos) <= radius) {
                const team = mod.GetTeam(player);
                if (mod.Equals(team, team1)) {
                    t1.push(player);
                } else if (mod.Equals(team, team2)) {
                    t2.push(player);
                }
                mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, true);
            } else {
                mod.EnableInputRestriction(player, mod.RestrictedInputs.Interact, false);
            }
        }
    }
    return { t1, t2 };
}

function moveTowards(targetPos: mod.Vector, speed: number): void {
    const direction = mod.DirectionTowards(STATE.payloadPosition, targetPos);
    const moveDelta = mod.Multiply(direction, speed);
    const nextPos = mod.Add(STATE.payloadPosition, moveDelta);
    STATE.payloadPosition = nextPos;
}

function onCheckpointReached(): void {
    if (STATE.payloadState !== PayloadState.ADVANCING) return;

    mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 300), false);
    mod.EnableHQ(mod.GetHQ((STATE.currentCheckpoint - 1) + 400), false);
    if (STATE.reachedWaypointIndex == STATE.waypoints.size - 1) {
        onFinalCheckpointReached();
        return;
    }
    playCheckpointReachedSound();
    updateCheckpointUI();
    STATE.checkpointStartTime = mod.GetMatchTimeElapsed();
    mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 300), true);
    mod.EnableHQ(mod.GetHQ(STATE.currentCheckpoint + 400), true);
    mod.EnableGameModeObjective(mod.GetSector(STATE.currentCheckpoint + 101), true);
    mod.DisplayHighlightedWorldLogMessage(
        mod.Message(
            mod.stringkeys.payload.state.checkpoint_reached,
            STATE.currentCheckpoint,
            STATE.maxCheckpoints
        )
    );
}

function setPayloadState(state: PayloadState): void {
    if (STATE.payloadState !== state) {
        STATE.payloadState = state;
        onPayloadStateChanged();
    }
}

function onPayloadStateChanged(): void {
    updateStatusUI();
}

function checkWaypointReached(targetWaypointIndex: number) {
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    if (mod.DistanceBetween(STATE.payloadPosition, targetWaypoint.position) <= CONFIG.waypointProximityRadius) {
        STATE.reachedWaypointIndex = targetWaypointIndex;
        if (targetWaypoint.isCheckpoint) {
            STATE.reachedCheckpointIndex = targetWaypointIndex;
            STATE.currentCheckpoint++;
            onCheckpointReached();
        }
    }
}

function pushForward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    const targetWaypointIndex = STATE.reachedWaypointIndex + 1;
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t1.length - counts.t2.length);
    const speed = CONFIG.payloadSpeedMultiplierT1 + speedAddtion;
    moveTowards(targetWaypoint.position, speed);
    setPayloadState(PayloadState.ADVANCING);
    checkWaypointReached(targetWaypointIndex);
    VOPushing();
}

function pushBackward(counts: { t1: mod.Player[]; t2: mod.Player[] }) {
    if (STATE.reachedWaypointIndex <= STATE.reachedCheckpointIndex) {
        setPayloadState(PayloadState.LOCKED);
        return;
    }
    const targetWaypointIndex = STATE.reachedWaypointIndex - 1;
    const targetWaypoint = STATE.waypoints.get(targetWaypointIndex)!;
    const speedAddtion = CONFIG.speedAdditionPerPushingPlayer * (counts.t2.length - counts.t1.length);
    const speed = CONFIG.payloadSpeedMultiplierT2 + speedAddtion;
    moveTowards(targetWaypoint.position, speed);
    setPayloadState(PayloadState.PUSHING_BACK);
    checkWaypointReached(targetWaypointIndex);
    VOPushingBack();
}

function updatePayloadObject() {
    const waypoint = STATE.waypoints.get(STATE.reachedWaypointIndex)!;
    const rotation = waypoint.rotation;
    for (let i = 0; i < STATE.payloadObjects.length; i++) {
        const obj = STATE.payloadObjects[i];
        const config = CONFIG.payloadObjects[i];
        const worldPos = mod.Add(STATE.payloadPosition, config.relativeOffset);
        if (mod.IsType(obj, mod.Types.VFX)) {
            mod.MoveVFX(obj as mod.VFX, worldPos, rotation);
        } else {
            mod.SetObjectTransform(obj, mod.CreateTransform(worldPos, rotation));
        }
    }
    if (STATE.payloadVehicle) {
        mod.Teleport(STATE.payloadVehicle, STATE.payloadPosition, mod.YComponentOf(rotation));
    }
}

function onPayloadMoved() {
    calculatePayloadProgress();
    updatePayloadObject();
    updateProgressUI();
    if (STATE.progressInPercent > 90) {
        playNearEndMusic();
        playNearEndVO();
    }
}

function executeEverySecond() {
    if (STATE.lastElapsedSeconds >= CONFIG.gameModeTime) {
        onRunningOutOfTime();
        return;
    }
    // Update Checkpoint Timer
    const elapsedSinceCheckpoint = STATE.lastElapsedSeconds - STATE.checkpointStartTime;
    const remainingTime = CONFIG.defaultCheckpointTime - elapsedSinceCheckpoint;
    updateCheckpointTimer(remainingTime);
    if (remainingTime <= 0) {
        onRunningOutOfTime();
        return;
    }
    if (remainingTime <= 60) {
        playNearEndMusic();
        playLowTimeVO();
    }
    if (STATE.payloadState == PayloadState.PUSHING_BACK) {
        playPayloadReversingSound(STATE.payloadPosition);
    }
}

function onFinalCheckpointReached() {
    mod.EndGameMode(mod.GetTeam(1));
}

function onRunningOutOfTime() {
    mod.EndGameMode(mod.GetTeam(2));
}

export function OnGameModeStarted(): void {
    mod.SetGameModeTimeLimit(3600);
    mod.SetGameModeTargetScore(1000);
    initSectors();
    initPayloadTrack();
    initPayloadRotation();
    initPayloadObjective();
    initSounds();
    scoring_initScoreboard();

    STATE.checkpointStartTime = mod.GetMatchTimeElapsed();

    uiSetup();
}

export function OnPlayerDied(victim: mod.Player, killer: mod.Player): void {
    scoring_onPlayerDied(victim, killer);
}

export function OnPlayerEarnedKillAssist(player: mod.Player, assistOn: mod.Player): void {
    scoring_onPlayerEarnedAssist(player);
}

export function OnPlayerLeaveGame(playerId: number): void {
    scoring_onPlayerLeave(playerId);
}

export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    ui_onPlayerJoinGame();
    scoring_refreshScoreboard();
}

export function OnRevived(victim: mod.Player, reviver: mod.Player): void {
    scoring_onPlayerRevived(victim, reviver);
}

export function OngoingGlobal(): void {
    const elapsedSeconds = mod.GetMatchTimeElapsed();
    const counts = getAlivePlayersInProximity(STATE.payloadPosition, CONFIG.pushProximityRadius);

    if (STATE.lastElapsedSeconds != elapsedSeconds) {
        STATE.lastElapsedSeconds = elapsedSeconds;
        // Award objective points to all players in proximity of the payload
        for (const p of counts.t1) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }
        for (const p of counts.t2) {
            scoring_awardObjectivePoints(p, CONFIG.objectiveScorePerSecond);
        }
        executeEverySecond();
    }

    if (counts.t1.length > counts.t2.length) {
        pushForward(counts);
        onPayloadMoved();
    } else if (counts.t2.length > counts.t1.length) {
        pushBackward(counts);
        onPayloadMoved();
    } else if (counts.t1.length > 0 && counts.t2.length > 0) {
        setPayloadState(PayloadState.CONTESTED);
    } else {
        setPayloadState(PayloadState.IDLE);
    }
}

//Force remove players from payload vehicle
export function OnPlayerEnterVehicle(eventPlayer: mod.Player, eventVehicle: mod.Vehicle): void {
    if (mod.CompareVehicleName(eventVehicle, mod.VehicleList.M2Bradley)) { //Direct comparison not working: eventVehicle == STATE.payloadVehicle as mod.Vehicle
        mod.ForcePlayerExitVehicle(mod.GetVehicleFromPlayer(eventPlayer));
        mod.DisplayNotificationMessage(mod.Message(mod.stringkeys.payload.objective.exit_message), eventPlayer);
    }
}

// Team Switcher for testing
export function OngoingPlayer(eventPlayer: mod.Player): void {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier)) return;
    if (!mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAlive)) return;
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsZooming)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsCrouching)
        && mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsInteracting)
    ) {
        mod.SetTeam(eventPlayer, mod.Equals(mod.GetTeam(eventPlayer), mod.GetTeam(2)) ? mod.GetTeam(1) : mod.GetTeam(2));
    }
}

// bugged...
// export function OnTimeLimitReached(): void {
//     mod.EndGameMode(mod.GetTeam(2));
// }