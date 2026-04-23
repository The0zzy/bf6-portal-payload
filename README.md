# PAYLOAD

This classic game mode is inspired by many popular team-based shooters. One team needs to deliver the Payload to the
target while the other team must prevent it from reaching its destination. Get close to the Payload to push it. The more
players that push the Payload, the faster it will move. Along the way there are checkpoints which will add additional
time. Defenders can contest the payload and push it back to the last checkpoint. Attackers win by pushing the Payload to
it's final target before the time runs out.

## Maps and Weather

Payload currently supports 6 maps with some of them even supporting a random winter theme:

- Siege of Cairo (Abbasid)
- Mirak Valley (Tungsten) (snow theme available)
- Liberation Peak (Capstone) (snow theme available)
- Hagental Base (Subsurface)
- Contaminated (Contaminated) (snow theme available)
- New Sobek City (Outskirts)

# Implementation

The Payload game mode is implemented in TypeScript and is designed to be modular and extensible. The core logic of the
game mode is contained within the `PayloadCore` class, which manages the state of the game, including player
interactions, payload movement, and checkpoint management.
