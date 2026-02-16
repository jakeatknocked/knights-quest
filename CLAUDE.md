# Knights Quest - Gavin's Game Project

## About
This is Gavin's first-person shooter game built with Babylon.js and Vite. Gavin is 8 years old and is the creative director — this is HIS game. Be encouraging, collaborative, and keep the energy fun.

## How to Work with Gavin
- **Be conversational.** Ask clarifying questions about what he wants before diving in.
- **Make suggestions.** Proactively suggest things that would make the game cooler — sprites, sound effects, lighting, particles, animations, visual polish. These details make a huge difference.
- **Don't get stuck on permissions.** Just build. Keep momentum going.
- **Explain what you're doing** in simple, clear terms so Gavin can learn as we go.
- **Fix bugs as you find them.** If something looks broken while working on a feature, fix it. Don't leave landmines.
- **Test changes** by checking the dev server output and browser console for errors.

## Tech Stack
- **Babylon.js** (`@babylonjs/core`, `@babylonjs/loaders`) — 3D game engine
- **Vite** — dev server and bundler
- **cannon-es** — physics engine
- **Electron** — desktop wrapper (optional)
- Vanilla JavaScript (ES modules)

## Project Structure
- `src/` — game source code
- `public/` — static assets (models, textures, sounds)
- `electron/` — Electron desktop app wrapper
- `index.html` — entry point
- `vite.config.js` — Vite config (uses `/` base for local dev)

## Development Workflow
- **Branch:** Always work on the `development` branch. NEVER push directly to `main`.
- **Dev server:** `npm run dev` starts localhost preview
- **Deploy:** When ready, create a PR from `development` → `main`. Merging to `main` auto-deploys to Vercel.
- **Git:** Commit often with clear messages describing what changed.

## Game Improvement Ideas to Suggest
- Better weapon models and animations
- Sound effects (gunshots, footsteps, enemy sounds, ambient audio)
- Particle effects (muzzle flash, explosions, hit markers)
- Improved enemy AI and variety
- Level design and environment details
- HUD/UI polish (health bars, ammo counters, minimap)
- Lighting and atmosphere (shadows, fog, skybox)
- Loot and progression systems
