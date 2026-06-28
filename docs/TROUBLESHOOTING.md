# RPG Game Troubleshooting Log

## Project Info
- **Project**: The Kingdom of Luminara (React + Vite + Canvas RPG)
- **Working Directory**: `/home/administrator/rpg-game`
- **Key Files**:
  - `src/game/Game.jsx` — Main game component (947 lines)
  - `src/game/map.js` — Map data, enemy/NPC/chest definitions
  - `src/game/tiles.js` — Tile palette (indices 0-39), TILE_SIZE=16, TILE_MAP
  - `src/game/sprites.js` — Sprite data (SPRITE_SIZE=16), hero, slimes, NPCs
  - `src/game/engine.js` — Helper render functions (NOT used by Game.jsx)

## Architecture Notes
- **No `gameState` object exists** — enemies are plain arrays exported from `map.js`
- Game.jsx imports `enemyDefs` from map.js, transforms them in `initGame()` with `alive: true`
- `gameRef.current` holds the live game state (enemies, player, NPCs, camera, etc.)
- Render loop runs via `requestAnimationFrame(gameLoop)` in a `useEffect`
- **`drawSprite` is defined INLINE in Game.jsx** (lines 34-48), NOT imported from engine.js
- Canvas: 800×560, PIXEL_SIZE=3, RENDER_TILE=48, RENDER_SPRITE=48
- Map: MAP_WIDTH=50, MAP_HEIGHT=30 tiles

---

## Issue: Slime Enemies Not Rendering

### Reported (2026-06-21)
- Slimes exist in game logic: spawn, move, cause player damage, can be killed
- No visual rendering of slimes on canvas
- HP bars and name labels for enemies also not visible
- Red outline test (previous session) did not render
- Player, NPCs, tiles, HUD all render correctly

### Verified Facts
| Check | Result | Notes |
|---|---|---|
| PALETTE indices 27, 31-39 | ✅ Defined | All have valid hex colors |
| Slime sprite data (16×16) | ✅ Valid | slimeGreen, slimeRed, slimePurple |
| SPRITE_MAP includes slimes | ✅ Yes | slimeGreen, slimeRed, slimePurple keys present |
| Enemy definitions have `sprite` | ✅ Yes | e.g., `sprite: 'slimeGreen'` |
| Enemy definitions have `hp` | ✅ Yes | hp: 3/5/7, maxHp: 3/5/7 |
| `initGame()` sets `alive: true` | ✅ Yes | Line 113 |
| `getSprite()` has fallback | ✅ Yes | Returns heroDown1 if not found |
| Enemy render block exists | ✅ Yes | Lines ~623-653 |
| Canvas renders other things | ✅ Yes | Player, NPCs, tiles, HUD |
| `drawSprite` works for player | ✅ Yes | Player renders correctly |
| `drawSprite` works for NPCs | ✅ Yes | NPCs render correctly |

### Critical Evidence
- **No HP bars visible** → Enemy render body not executing
- **No name labels visible** → Confirms render body skipped
- **No red rectangles visible** → Confirms render body skipped
- **Player/NPCs render fine** → Canvas, drawSprite, coordinates all work
- **Game logic works** → enemies exist in `gameRef.current.enemies`, `alive` is true during combat

### Theory Analysis

#### Theory A: `enemySpriteList` stale ref (DISPROVED)
Previous theory suggested a stale `useRef([...gameState.enemies])` was empty.
**Disproved**: The actual code does NOT use `enemySpriteList`. Enemies are read directly from `gameRef.current.enemies` each frame.

#### Theory B: All enemies fail `!e.alive` check ⭐ MOST LIKELY
The render loop adds enemies to `renderables`:
```js
for (const e of game.enemies) {
    if (!e.alive) continue;
    renderables.push({ y: e.y + 0.5, type: 'enemy', data: e });
}
```
If `e.alive` is `undefined` (falsy) for all enemies, none get added to renderables.
- **Supporting**: Explains why NOTHING renders (no sprites, bars, labels, rectangles)
- **Supporting**: Game logic also checks `!e.alive` but... enemies DO fight. Wait.
- **Puzzle**: If `alive` were falsy, game logic would also skip enemies. But combat works.
- **Resolution attempt**: Check if `initGame()` is actually called before render starts. The `useEffect` that calls `initGame()` runs AFTER mount. The game loop checks `if (!game) { requestAnimationFrame(gameLoop); return; }` — it waits for game to be initialized. So `alive: true` should be set before rendering begins.

#### Theory C: Silent exception in enemy render block (UNLIKELY)
If the enemy render block threw, subsequent renderables (including player) wouldn't draw.
- **Disproved**: Player renders fine after enemies in the sorted renderables array.
- Enemies at y=1,2,3,5,7,8 sort BEFORE player at y=10. If their render threw, player wouldn't appear.

#### Theory D: `drawSprite` draws zero pixels for slime sprites (UNLIKELY)
- PALETTE has all needed indices ✓
- SPRITE_SIZE=16, PIXEL_SIZE=3 → 48×48 pixel sprites ✓
- Same function works for hero and NPC sprites ✓
- `getSprite` returns heroDown1 as fallback → SOMETHING would draw

#### Theory E: Enemy positions always off-screen (UNLIKELY)
- Contact damage works → enemies get within 0.8 tiles of player
- Canvas shows ~17×12 tiles → enemies at player's position would be visible
- Player starts at (37,10), closest enemy slime4 at (35,1) — 9 tiles away

#### Theory F: Canvas context corrupted between NPC and enemy renders (POSSIBLE)
- NPC render block calls `ctx.fillText('!', ...)` which modifies ctx state
- If there's an unbalanced `ctx.save()`/`ctx.restore()` or clip region, it could affect subsequent renders
- **Counter**: `drawSprite` does its own save/restore. HP bars use plain `fillRect`.

#### Theory G: Two separate gameRef states / double mount (POSSIBLE)
- If the Game component mounts twice (React strict mode in dev?), one instance's `initGame` could overwrite the other's state
- React 18 strict mode doubles-mounts effects in development
- **This would cause**: First mount initializes enemies with `alive: true`, second mount re-initializes with fresh `alive: true` — shouldn't cause issues unless state is corrupted between mounts

#### Theory H: Vite HMR / stale code (POSSIBLE)
- Previous session added a "red outline test" that didn't render
- If the code was modified but the game loop is running with stale/bundled code that lacks the enemy render block entirely
- **Check**: Do a hard refresh or rebuild to ensure latest code is loaded

### Debugging Plan (ordered by impact)

1. **HARD REFRESH / REBUILD**: Ensure latest code is loaded
   - `npm run build && npm run dev`
   - Hard refresh browser (Ctrl+Shift+R)

2. **Check minimap**: Enemy dots should appear on minimap if enemies are alive
   - Minimap code at lines ~799-802 draws colored dots for alive enemies
   - If dots appear → render loop works, issue is in sprite rendering
   - If dots DON'T appear → enemies not in game.enemies or all dead

3. **Console logging in game loop**: Add temporary logs to check:
   - `game.enemies.length` at render time
   - `e.alive` for each enemy
   - `getSprite(e.sprite)` return value
   - Position calculations (ex, ey)

4. **Check React strict mode**: Look for double-mount behavior
   - Check `vite.config.js` or React version
   - Add mount counter log

5. **Verify sprite data at runtime**: Check if sprite arrays are actually populated

---

## File Change Log
| Date | File | Change | Purpose |
|---|---|---|---|
| 2026-06-21 | Game.jsx | Red outline test added then removed | Attempt to verify render block execution |
| 2026-06-21 | docs/TROUBLESHOOTING.md | Created | This document |

## Session Notes
- **2026-06-21**: Initial troubleshooting session. User confirmed slimes cause damage and can be killed. No visual rendering at all. Previous red outline test failed. HP bars and name labels never seen by user. Full code review completed — all sprite data, palette, render logic verified as correct statically. **Root cause identified and fixed**: `parseInt('slime4')` returns `NaN` → `bobY = NaN` → all enemy draw calls silently fail. Fixed with `e.id.charCodeAt(e.id.length - 1)`.
