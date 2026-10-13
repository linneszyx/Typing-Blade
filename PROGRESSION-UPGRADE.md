# TYPE BLADE — Progression Upgrade

Adds a persistent Ronin Profile to the character roster build.

## Features
- Earn 100 XP for a victory and 35 XP for a defeat.
- Level up every 150 XP.
- Akira is available from the start; Reina unlocks at level 2 and Raiden at level 4.
- Fighter selection is disabled while a duel is active and locked fighters cannot be selected.
- Profile XP, wins, losses, and best combo are stored in browser localStorage (`type-blade-profile-v1`).
- XP progress bar and unlock requirements are displayed in the UI.
- No additional packages or services required.

## Install (Windows)
1. Stop Vite with `Ctrl+C`.
2. Back up `src/App.tsx`, `src/styles.css`, and `src/game/ArenaScene.ts`.
3. Extract this ZIP into the project root and replace the files in `src`.
4. Run `npm run dev`, then `npm run build` to check the production build.

This patch is layered on the character roster version. It is a complete-file ZIP to avoid `git apply` context mismatch. If your current project is older, replace the files from this ZIP together so the UI and Phaser scene remain in sync.
