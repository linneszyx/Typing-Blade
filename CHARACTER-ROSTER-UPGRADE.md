# TYPE BLADE — Character Roster Upgrade

This patch adds three selectable fighters to the existing React + TypeScript + Phaser 3 + Vite project:

- **Akira — The Keyblade:** balanced katana attacks and **Void Breaker** ultimate.
- **Reina — The Phantom Dancer:** twin daggers, lighter damage, and **Thousand Petals** ultimate.
- **Raiden — The Storm Lancer:** energy spear, heavier damage, and **Storm Pierce** ultimate.

The chosen fighter controls the arena's color accents, weapon rendering, damage multiplier, and ultimate phrase/name. The roster locks during a duel and unlocks again after the round ends. No dependencies or external assets are added.

## Install on Windows
1. Stop the Vite server with `Ctrl+C`.
2. Back up these files: `src/App.tsx`, `src/styles.css`, and `src/game/ArenaScene.ts`.
3. Extract this ZIP into the project root, preserving the `src` folder structure and replacing those three files.
4. Run `npm run dev`.
5. Before starting a duel, select Reina or Raiden and verify the fighter card, weapon, color, damage feel, and ultimate phrase. While the duel is active, the roster should be locked.
6. Run `npm run build` to type-check and create the production build.

## Balance note
Damage multipliers are deliberately simple tuning values in `src/App.tsx`: Akira `1.0`, Reina `0.82`, Raiden `1.28`. Adjust these values to tune difficulty.
