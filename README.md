# TYPE BLADE — Anime Typing Duel

A playable first version of an anime-inspired 1v1 typing combat website built with React, TypeScript, Vite, and Phaser 3.

## Requirements
- Node.js 20.19+ or 22.12+ recommended
- npm (included with Node.js)
- Windows 10/11, PowerShell, or Windows Terminal

## Run on Windows

1. Extract `type-blade.zip`.
2. Open PowerShell in the extracted `type-blade` folder.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open the local URL printed in the terminal, usually `http://localhost:5173`.

## Controls and gameplay
- Click **BEGIN DUEL**.
- Type the highlighted target word. Correct completion damages Kuro and builds a combo.
- Wrong characters reset the combo; correct characters remain highlighted as you type.
- Kuro lands a hit every 7 seconds, so keep the pace up.
- **CHARGE SPECIAL MOVE** swaps in a longer phrase target. Complete it for a hit.
- The round lasts 60 seconds. Defeat Kuro before time runs out.
- Use **SOUND OFF/ON** to toggle generated sound effects.
- Press **FIGHT AGAIN** or **REMATCH** to restart.

## Production build

```powershell
npm run build
npm run preview
```

## Project structure

```text
type-blade/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles.css
    └── game/
        └── ArenaScene.ts
```

## Notes
- The anime-inspired fighters are drawn with Phaser vector graphics, so the project does not require external image assets.
- Google Fonts are loaded from Google Fonts; system fallbacks are provided.
- This is a local playable prototype. Accounts, online multiplayer, persistent stats, and global leaderboards are not included yet.
