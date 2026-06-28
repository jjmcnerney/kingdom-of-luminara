import { useRef, useEffect, useState, useCallback } from 'react';
import { TILE_SIZE, PALETTE, TILE_MAP } from './tiles';
import {
  SPRITE_SIZE,
  heroDown1, heroDown2,
  slimeGreen, slimeRed, slimePurple,
  villagerBrown, villagerBlue, villagerRed,
  swordSprite, shieldSprite, heartSprite, rupeeGreen, arrowSprite,
} from './sprites';
import {
  MAP_WIDTH, MAP_HEIGHT, worldMap,
  npcs as npcDefs, enemies as enemyDefs,
  chests as chestDefs, signs,
  startPlayer,
} from './map';

const PIXEL_SIZE = 3;
const RENDER_TILE = TILE_SIZE * PIXEL_SIZE;
const RENDER_SPRITE = SPRITE_SIZE * PIXEL_SIZE;

const SPRITE_MAP = {
  heroDown1, heroDown2,
  slimeGreen, slimeRed, slimePurple,
  villagerBrown, villagerBlue, villagerRed,
  swordSprite, shieldSprite, heartSprite, rupeeGreen, arrowSprite,
};

function drawSprite(ctx, spriteData, x, y, ps, alpha = 1.0) {
  ctx.save();
  if (alpha < 1.0) ctx.globalAlpha = alpha;
  for (let row = 0; row < SPRITE_SIZE; row++) {
    for (let col = 0; col < SPRITE_SIZE; col++) {
      const ci = spriteData[row]?.[col];
      if (ci !== undefined && ci !== 0 && PALETTE[ci]) {
        ctx.fillStyle = PALETTE[ci];
        ctx.fillRect(Math.floor(x + col * ps), Math.floor(y + row * ps), ps, ps);
      }
    }
  }
  ctx.restore();
}

function drawTile(ctx, tileId, x, y, ps) {
  const tile = TILE_MAP[tileId];
  if (!tile || !tile.render) return;
  const data = tile.render;
  for (let row = 0; row < TILE_SIZE; row++) {
    for (let col = 0; col < TILE_SIZE; col++) {
      const ci = data[row]?.[col];
      if (ci !== undefined && ci !== 0 && PALETTE[ci]) {
        ctx.fillStyle = PALETTE[ci];
        ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
      }
    }
  }
}

export default function Game() {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Refs for move/shake accumulators so they survive effect re-runs
  const moveAccRef = useRef(0);
  const shakeRef = useRef(0);

  const [inventory, setInventory] = useState({
    hp: 6, maxHp: 6, attack: 1, defense: 0,
    rupees: 0, xp: 0, level: 1,
    items: [],
    hasSword: false, hasShield: false,
  });

  // State for rendering + parallel refs for game-loop reads
  const [dialogue, setDialogue] = useState(null);
  const dialogueRef = useRef(null);
  useEffect(() => { dialogueRef.current = dialogue; }, [dialogue]);

  const [gameMessage, setGameMessage] = useState('');
  const messageRef = useRef({ text: '', timer: 0 });

  const [combatLog, setCombatLog] = useState([]);
  const combatLogRef = useRef([]);

  const [showWin, setShowWin] = useState(false);

  // Stable refs for inventory
  const invRef = useRef(inventory);
  useEffect(() => { invRef.current = inventory; }, [inventory]);

  const showMsg = useCallback((msg) => {
    setGameMessage(msg);
    messageRef.current = { text: msg, timer: 180 };
  }, []);

  const addCombatLog = useCallback((msg) => {
    const newLog = [...combatLogRef.current.slice(-4), { text: msg, timer: 90 }];
    combatLogRef.current = newLog;
    setCombatLog(newLog);
  }, []);

  const getSprite = (name) => {
    const s = SPRITE_MAP[name];
    if (!s) console.warn(`[Sprite] Missing sprite: "${name}". Available:`, Object.keys(SPRITE_MAP).join(', '));
    return s || heroDown1;
  };

  const initGame = useCallback(() => {
    const enemies = enemyDefs.map(e => ({
      ...e, baseX: e.x, baseY: e.y,
      alive: true, moveTimer: 0,
      hurtTimer: 0, facing: 1,
      patrolAngle: Math.random() * Math.PI * 2,
    }));
    const npcs = npcDefs.map(n => ({ ...n, dialogueIndex: 0 }));
    const chests = chestDefs.map(c => ({ ...c }));

    return {
      player: {
        x: startPlayer.x,
        y: startPlayer.y,
        dir: 'down',
        animFrame: 0,
        attacking: false,
        attackTimer: 0,
        attackCooldown: 0,
        invincible: 0,
        hurtTimer: 0,
      },
      camera: { x: 0, y: 0 },
      enemies,
      npcs,
      chests,
      particles: [],
      floatingTexts: [],
      tick: 0,
    };
  }, []);

  useEffect(() => {
    gameRef.current = initGame();
  }, [initGame]);

  const isPassable = (gx, gy, game) => {
    if (gx < 0 || gx >= MAP_WIDTH || gy < 0 || gy >= MAP_HEIGHT) return false;
    const tileId = worldMap[gy]?.[gx];
    if (tileId === undefined) return false;
    const tile = TILE_MAP[tileId];
    if (tile && !tile.passable) return false;
    for (const n of game.npcs) {
      if (n.x === gx && n.y === gy) return false;
    }
    return true;
  };

  const tryMove = (game, dx, dy) => {
    const newX = Math.round(game.player.x) + dx;
    const newY = Math.round(game.player.y) + dy;

    // Check enemy collision — can't walk through
    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (Math.round(e.x) === newX && Math.round(e.y) === newY) return false;
    }

    if (!isPassable(newX, newY, game)) return false;

    game.player.x = newX;
    game.player.y = newY;
    game.player.animFrame = game.player.animFrame === 0 ? 1 : 0;

    if (dy < 0) game.player.dir = 'up';
    else if (dy > 0) game.player.dir = 'down';
    else if (dx < 0) game.player.dir = 'left';
    else if (dx > 0) game.player.dir = 'right';

    // Chests
    for (const c of game.chests) {
      if (!c.opened && c.x === newX && c.y === newY) {
        c.opened = true;
        setDialogue({ speaker: 'Treasure Chest', text: c.message });

        setInventory(prev => {
          const next = { ...prev };
          switch (c.item) {
            case 'sword':
              next.hasSword = true;
              next.items.push('Sword');
              next.attack = 3;
              break;
            case 'shield':
              next.hasShield = true;
              next.items.push('Shield');
              next.defense = 2;
              break;
            case 'hearts':
              next.maxHp += 4;
              next.hp = Math.min(next.hp + 4, next.maxHp + 4);
              next.items.push('Heart Container');
              break;
            case 'rupees':
              next.rupees += c.value || 10;
              break;
          }
          return next;
        });
        showMsg(c.message);
      }
    }

    // Signs
    const signKey = `${newX},${newY}`;
    if (signs[signKey]) {
      setDialogue({ speaker: 'Sign', text: signs[signKey] });
    }

    // Crystal victory
    if (invRef.current.items.includes('Crystal') && newX >= 30 && newX <= 34 && newY >= 14 && newY <= 16) {
      setShowWin(true);
    }

    return true;
  };

  const swordAttack = (game) => {
    if (game.player.attackCooldown > 0) return;

    game.player.attacking = true;
    game.player.attackTimer = 12;
    game.player.attackCooldown = 20;

    let dx = 0, dy = 0;
    if (game.player.dir === 'up') dy = -1;
    else if (game.player.dir === 'down') dy = 1;
    else if (game.player.dir === 'left') dx = -1;
    else if (game.player.dir === 'right') dx = 1;

    const hitX = Math.round(game.player.x) + dx;
    const hitY = Math.round(game.player.y) + dy;

    const inv = invRef.current;
    const dmg = inv.hasSword ? inv.attack + 1 : inv.attack;

    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (Math.round(e.x) === hitX && Math.round(e.y) === hitY) {
        e.hp -= dmg;
        e.hurtTimer = 15;
        e.facing = dx !== 0 ? dx : 1;

        e.x += dx * 0.5;
        e.y += dy * 0.5;
        e.x = Math.max(0, Math.min(MAP_WIDTH - 1, e.x));
        e.y = Math.max(0, Math.min(MAP_HEIGHT - 1, e.y));

        for (let i = 0; i < 5; i++) {
          game.particles.push({
            x: hitX * RENDER_TILE + RENDER_TILE / 2,
            y: hitY * RENDER_TILE + RENDER_TILE / 2,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            life: 20, maxLife: 20,
            color: ['#ffcc00', '#ff6600', '#ffffff'][Math.floor(Math.random() * 3)],
          });
        }

        addCombatLog(`Hit ${e.sprite === 'slimeGreen' ? 'Slime' : e.sprite === 'slimeRed' ? 'Red Slime' : 'Shadow Slime'} for ${dmg}!`);

        if (e.hp <= 0) {
          e.alive = false;
          const xpGain = e.xp;
          const rupeeGain = Math.floor(Math.random() * (e.rupees[1] - e.rupees[0] + 1)) + e.rupees[0];

          game.floatingTexts.push({
            x: Math.round(e.x) * RENDER_TILE + RENDER_TILE / 2,
            y: Math.round(e.y) * RENDER_TILE,
            text: `+${xpGain} XP`, timer: 60, color: '#eeff44',
          });
          game.floatingTexts.push({
            x: Math.round(e.x) * RENDER_TILE + RENDER_TILE / 4,
            y: Math.round(e.y) * RENDER_TILE - 12,
            text: `+${rupeeGain} R`, timer: 60, color: '#5bc450',
          });

          for (let i = 0; i < 12; i++) {
            game.particles.push({
              x: Math.round(e.x) * RENDER_TILE + RENDER_TILE / 2,
              y: Math.round(e.y) * RENDER_TILE + RENDER_TILE / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5 - 2,
              life: 30, maxLife: 30,
              color: e.sprite === 'slimeGreen' ? '#4aad3e' : e.sprite === 'slimeRed' ? '#cc2233' : '#6633aa',
            });
          }

          setInventory(prev => {
            const newXp = prev.xp + xpGain;
            const newLevel = Math.floor(newXp / 50) + 1;
            return {
              ...prev,
              xp: newXp,
              level: newLevel,
              rupees: prev.rupees + rupeeGain,
              attack: prev.hasSword ? Math.max(prev.attack, newLevel >= 4 ? 5 : newLevel >= 2 ? 4 : 3) : newLevel >= 3 ? 2 : 1,
            };
          });

          showMsg(`${e.sprite === 'slimeGreen' ? 'Slime' : e.sprite === 'slimeRed' ? 'Red Slime' : 'Shadow Slime'} defeated! +${xpGain} XP, +${rupeeGain} Rupees`);

          if (e.sprite === 'slimePurple' && !invRef.current.items.includes('Crystal')) {
            e.alive = true;
            e.hp = 1;
            game.floatingTexts.push({
              x: Math.round(e.x) * RENDER_TILE + RENDER_TILE / 4,
              y: Math.round(e.y) * RENDER_TILE - 24,
              text: 'Crystal of Dawn!', timer: 90, color: '#66ccff',
            });
            setInventory(prev => ({ ...prev, items: [...prev.items, 'Crystal'] }));
            showMsg('You found the Crystal of Dawn! Return it to the village!');
          }
        }
        return;
      }
    }
  };

  const talkToNpc = (npc) => {
    const text = npc.dialogue[npc.dialogueIndex || 0];
    setDialogue({ speaker: npc.name, text });
    npc.dialogueIndex = ((npc.dialogueIndex || 0) + 1) % npc.dialogue.length;
  };

  // ── KEYBOARD (reads dialogue from ref so it doesn't stale) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;

      // If dialogue is active, dismiss with space/enter/z
      if (dialogueRef.current) {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
          setDialogue(null);
        }
        e.preventDefault();
        return;
      }

      // Interact / Talk
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        const game = gameRef.current;
        if (!game) return;
        const px = Math.round(game.player.x);
        const py = Math.round(game.player.y);
        for (const n of game.npcs) {
          if (Math.abs(n.x - px) + Math.abs(n.y - py) === 1) {
            talkToNpc(n);
            e.preventDefault();
            return;
          }
        }
      }

      // Attack
      if (e.key === 'x' || e.key === 'X' || e.key === 'y' || e.key === 'Y') {
        const game = gameRef.current;
        if (game) swordAttack(game);
        e.preventDefault();
      }

      // Prevent scrolling for game keys
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [talkToNpc, swordAttack]);

  // ── GAME LOOP (reads all volatile state from refs — stable deps) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const MOVE_INTERVAL = 120;

    const gameLoop = (timestamp) => {
      const game = gameRef.current;
      if (!game) {
        animRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const dt = timestamp - (lastTimeRef.current || timestamp);
      lastTimeRef.current = timestamp;
      game.tick++;

      // ── PLAYER MOVEMENT (reads keys from ref) ──
      const inDialogue = dialogueRef.current !== null;

      if (!inDialogue) {
        moveAccRef.current += dt;
        if (moveAccRef.current >= MOVE_INTERVAL) {
          moveAccRef.current = 0;

          if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) {
            tryMove(game, 0, -1);
          } else if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) {
            tryMove(game, 0, 1);
          } else if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
            tryMove(game, -1, 0);
          } else if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
            tryMove(game, 1, 0);
          }
        }
      }

      // ── PLAYER STATE ──
      if (game.player.attackTimer > 0) {
        game.player.attackTimer--;
        if (game.player.attackTimer <= 0) game.player.attacking = false;
      }
      if (game.player.attackCooldown > 0) game.player.attackCooldown--;
      if (game.player.invincible > 0) game.player.invincible--;
      if (game.player.hurtTimer > 0) game.player.hurtTimer--;

      // ── ENEMY AI ──
      for (const e of game.enemies) {
        if (!e.alive) continue;

        if (e.hurtTimer > 0) {
          e.hurtTimer--;
          continue;
        }

        e.moveTimer += dt;
        if (e.moveTimer > (1000 / e.speed)) {
          e.moveTimer = 0;
          const dist = Math.abs(e.x - game.player.x) + Math.abs(e.y - game.player.y);

          if (dist <= e.range && dist > 1.5) {
            const dx = Math.sign(game.player.x - e.x);
            const dy = Math.sign(game.player.y - e.y);
            if (Math.random() < 0.5) {
              const nx = Math.round(e.x) + dx;
              if (isPassable(nx, Math.round(e.y), game)) { e.x = nx; e.facing = dx; }
            } else {
              const ny = Math.round(e.y) + dy;
              if (isPassable(Math.round(e.x), ny, game)) { e.y = ny; }
            }
          } else if (dist > e.range + 2) {
            const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = Math.round(e.x) + dir[0];
            const ny = Math.round(e.y) + dir[1];
            if (isPassable(nx, ny, game)) {
              e.x = nx;
              e.y = ny;
              if (dir[0] !== 0) e.facing = dir[0];
            }
          }
        }

        // Contact damage
        if (Math.abs(e.x - game.player.x) < 0.8 && Math.abs(e.y - game.player.y) < 0.8) {
          if (game.player.invincible <= 0) {
            const inv = invRef.current;
            const dmg = Math.max(1, e.damage - inv.defense);
            game.player.hurtTimer = 10;
            game.player.invincible = 45;
            shakeRef.current = 8;

            const pushX = Math.sign(game.player.x - e.x);
            const pushY = Math.sign(game.player.y - e.y);
            if (isPassable(Math.round(game.player.x) + pushX, Math.round(game.player.y), game)) {
              game.player.x += pushX;
            } else if (isPassable(Math.round(game.player.x), Math.round(game.player.y) + pushY, game)) {
              game.player.y += pushY;
            }

            for (let i = 0; i < 4; i++) {
              game.particles.push({
                x: game.player.x * RENDER_TILE + RENDER_TILE / 2,
                y: game.player.y * RENDER_TILE + RENDER_TILE / 2,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15, maxLife: 15, color: '#ff4444',
              });
            }

            game.floatingTexts.push({
              x: game.player.x * RENDER_TILE + RENDER_TILE / 2,
              y: game.player.y * RENDER_TILE,
              text: `-${dmg}`, timer: 40, color: '#ff4444',
            });

            setInventory(prev => {
              const newHp = prev.hp - dmg;
              if (newHp <= 0) {
                game.player.x = startPlayer.x;
                game.player.y = startPlayer.y;
                game.player.invincible = 90;
                showMsg('Defeated... Reviving at village...');
                return { ...prev, hp: Math.floor(prev.maxHp / 2), rupees: Math.max(0, prev.rupees - 5) };
              }
              return { ...prev, hp: newHp };
            });
          }
        }
      }

      // ── PARTICLES ──
      game.particles = game.particles.filter(p => p.life > 0);
      game.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
      });

      // ── FLOATING TEXTS ──
      game.floatingTexts = game.floatingTexts.filter(ft => ft.timer > 0);
      game.floatingTexts.forEach(ft => { ft.y -= 0.4; ft.timer--; });

      // ── MESSAGE TIMER ──
      if (messageRef.current.timer > 0) {
        messageRef.current.timer--;
        if (messageRef.current.timer <= 0) {
          messageRef.current.text = '';
          setGameMessage('');
        }
      }

      // ── COMBAT LOG TIMER ──
      const log = combatLogRef.current;
      const updated = log.map(l => ({ ...l, timer: l.timer - 1 })).filter(l => l.timer > 0);
      if (updated.length !== log.length) {
        combatLogRef.current = updated;
        setCombatLog([...updated]);
      }

      // ── CAMERA ──
      const targetCX = game.player.x * RENDER_TILE - W / 2 + RENDER_SPRITE / 2;
      const targetCY = game.player.y * RENDER_TILE - H / 2 + RENDER_SPRITE / 2;
      game.camera.x += (targetCX - game.camera.x) * 0.12;
      game.camera.y += (targetCY - game.camera.y) * 0.12;
      game.camera.x = Math.max(0, Math.min(MAP_WIDTH * RENDER_TILE - W, game.camera.x));
      game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * RENDER_TILE - H, game.camera.y));

      // ── RENDER ──
      ctx.fillStyle = '#1a2e1a';
      ctx.fillRect(0, 0, W, H);

      let camX = game.camera.x;
      let camY = game.camera.y;
      if (shakeRef.current > 0) {
        camX += (Math.random() - 0.5) * 5;
        camY += (Math.random() - 0.5) * 5;
        shakeRef.current--;
      }

      ctx.save();
      ctx.translate(-camX, -camY);

      const startTX = Math.max(0, Math.floor(camX / RENDER_TILE) - 1);
      const startTY = Math.max(0, Math.floor(camY / RENDER_TILE) - 1);
      const endTX = Math.min(MAP_WIDTH, Math.ceil((camX + W) / RENDER_TILE) + 1);
      const endTY = Math.min(MAP_HEIGHT, Math.ceil((camY + H) / RENDER_TILE) + 1);

      for (let ty = startTY; ty < endTY; ty++) {
        for (let tx = startTX; tx < endTX; tx++) {
          const tileId = worldMap[ty]?.[tx];
          if (tileId !== undefined) {
            drawTile(ctx, tileId, tx * RENDER_TILE, ty * RENDER_TILE, PIXEL_SIZE);
          }
        }
      }

      // Depth-sorted entities
      const renderables = [];
      for (const n of game.npcs) renderables.push({ y: n.y + 0.5, type: 'npc', data: n });
      for (const e of game.enemies) {
        if (!e.alive) continue;
        renderables.push({ y: e.y + 0.5, type: 'enemy', data: e });
      }
      renderables.push({ y: game.player.y + 0.5, type: 'player', data: game.player });
      renderables.sort((a, b) => a.y - b.y);

      for (const r of renderables) {
        if (r.type === 'player') {
          const p = r.data;
          const sprite = p.animFrame === 0 ? heroDown1 : heroDown2;
          const px = p.x * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          const py = p.y * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          let alpha = 1.0;
          if (p.invincible > 0 && game.tick % 6 < 3) alpha = 0.3;
          drawSprite(ctx, sprite, px, py, PIXEL_SIZE, alpha);

          if (p.attacking && p.attackTimer > 4) {
            let sx = px, sy = py;
            if (p.dir === 'right') sx += RENDER_SPRITE;
            else if (p.dir === 'left') sx -= RENDER_SPRITE;
            else if (p.dir === 'up') sy -= RENDER_SPRITE;
            else sy += RENDER_SPRITE;
            drawSprite(ctx, swordSprite, sx - RENDER_SPRITE / 2, sy - RENDER_SPRITE / 2, PIXEL_SIZE, 0.8);
          }
        } else if (r.type === 'npc') {
          const n = r.data;
          const sprite = getSprite(n.sprite);
          const nx = n.x * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          const ny = n.y * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          drawSprite(ctx, sprite, nx, ny, PIXEL_SIZE);
          ctx.fillStyle = '#ffee44';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', nx + RENDER_SPRITE / 2, ny - 6);
        } else if (r.type === 'enemy') {
          const e = r.data;
          const sprite = getSprite(e.sprite);
          const ex = e.x * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          const ey = e.y * RENDER_TILE + (RENDER_TILE - RENDER_SPRITE) / 2;
          const bobY = Math.sin(game.tick * 0.08 + e.id.charCodeAt(e.id.length - 1)) * 2;
          let alpha = 1.0, offsetX = 0;
          if (e.hurtTimer > 0) {
            alpha = 0.5 + Math.sin(game.tick * 0.5) * 0.5;
            offsetX = (Math.random() - 0.5) * 4;
          }
          drawSprite(ctx, sprite, ex + offsetX, ey + bobY, PIXEL_SIZE, alpha);

          // HP bar
          const hpPct = e.hp / e.maxHp;
          const barW = RENDER_SPRITE - 4, barH = 3;
          const barX = ex + 2, barY = ey + bobY - 6;
          ctx.fillStyle = '#333';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = hpPct > 0.5 ? '#4aad3e' : hpPct > 0.25 ? '#ddaa22' : '#cc2233';
          ctx.fillRect(barX, barY, barW * hpPct, barH);

          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(barX - 2, barY - 9, barW + 4, 9);
          ctx.fillStyle = hpPct > 0.5 ? '#aaffaa' : hpPct > 0.25 ? '#ffdd88' : '#ff8888';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            e.sprite === 'slimeGreen' ? 'SLIME' : e.sprite === 'slimeRed' ? 'RED SLIME' : 'SHADOW SLIME',
            barX + barW / 2, barY - 2
          );
        }
      }

      // Chest sparkles + render
      for (const c of game.chests) {
        if (c.opened) continue;
        // Draw the actual chest
        drawTile(ctx, 14, c.x * RENDER_TILE, c.y * RENDER_TILE, PIXEL_SIZE);
        // Sparkle above
        if (Math.sin(game.tick * 0.1) > 0.5) {
          ctx.fillStyle = '#ffee44';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('★', c.x * RENDER_TILE + RENDER_TILE / 2, c.y * RENDER_TILE + 4);
        }
      }

      // Draw signs
      for (const [key] of Object.entries(signs)) {
        const [sx, sy] = key.split(',').map(Number);
        drawTile(ctx, 15, sx * RENDER_TILE, sy * RENDER_TILE, PIXEL_SIZE);
      }

      // Particles
      for (const p of game.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
      }
      ctx.globalAlpha = 1.0;

      // Floating texts
      for (const ft of game.floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.timer / 15);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        if (ft.text) ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      }
      ctx.globalAlpha = 1.0;

      // Day/night
      const nightAlpha = 0.12 * (1 - (Math.sin(game.tick * 0.0004) + 1) / 2);
      if (nightAlpha > 0.01) {
        ctx.fillStyle = `rgba(15, 15, 50, ${nightAlpha})`;
        ctx.fillRect(camX, camY, W, H);
      }

      ctx.restore();

      // ── HUD ──
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#5a3d2b';
      ctx.fillRect(0, 38, W, 2);

      const inv = invRef.current;
      const heartsTotal = Math.ceil(inv.maxHp / 2);
      const heartsPerRow = 10;

      for (let i = 0; i < heartsTotal; i++) {
        const row = Math.floor(i / heartsPerRow);
        const col = i % heartsPerRow;
        const hx = 10 + col * 14;
        const hy = 8 + row * 13;
        const hpLeft = inv.hp - i * 2;
        if (hpLeft >= 2) drawHeartFull(ctx, hx, hy, 12, 11, '#cc2233');
        else if (hpLeft === 1) drawHeartHalf(ctx, hx, hy, 12, 11, '#cc2233');
        else drawHeartEmpty(ctx, hx, hy, 12, 11);
      }

      const statX = 10 + heartsPerRow * 14 + 6;
      ctx.fillStyle = '#e8d5a3';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Lv.${inv.level}`, statX, 16);
      ctx.fillText(`XP ${inv.xp}/50`, statX, 30);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#5bc450';
      ctx.fillText(`R: ${inv.rupees}`, W / 2 + 60, 24);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#e8d5a3';
      ctx.fillText(inv.items.length > 0 ? inv.items.slice(-4).join(', ') : 'No items', W - 12, 16);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText(`ATK:${inv.attack} DEF:${inv.defense}`, W - 12, 30);

      // Combat log
      const logEntries = combatLogRef.current;
      if (logEntries.length > 0) {
        ctx.textAlign = 'left';
        ctx.font = '10px monospace';
        logEntries.forEach((entry, i) => {
          ctx.globalAlpha = Math.min(1, entry.timer / 30);
          ctx.fillStyle = '#ffcc66';
          ctx.fillText(entry.text, 12, 50 + i * 14);
        });
        ctx.globalAlpha = 1.0;
      }

      // Message
      const msg = messageRef.current;
      if (msg.text) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const msgW = Math.min(400, ctx.measureText(msg.text).width + 30);
        ctx.fillRect(W / 2 - msgW / 2, H - 60, msgW, 26);
        ctx.strokeStyle = '#ddaa22';
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - msgW / 2, H - 60, msgW, 26);
        ctx.fillStyle = '#e8d5a3';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(msg.text, W / 2, H - 42);
      }

      // Minimap
      const mmW = MAP_WIDTH * 3, mmH = MAP_HEIGHT * 3;
      const mmX = W - mmW - 10, mmY = H - mmH - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
      ctx.strokeStyle = '#5a3d2b';
      ctx.lineWidth = 1;
      ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
      for (let ty = 0; ty < MAP_HEIGHT; ty++) {
        for (let tx = 0; tx < MAP_WIDTH; tx++) {
          const tileId = worldMap[ty]?.[tx];
          const tile = TILE_MAP[tileId];
          if (tile) {
            if (tileId === 3) ctx.fillStyle = '#2266aa';
            else if (tileId === 4 || tileId === 5) ctx.fillStyle = '#8b5e3c';
            else if (tileId === 13) ctx.fillStyle = '#a8774e';
            else if (!tile.passable) ctx.fillStyle = '#1a3a1a';
            else ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(mmX + tx * 3, mmY + ty * 3, 3, 3);
          }
        }
      }
      for (const e of game.enemies) {
        if (!e.alive) continue;
        ctx.fillStyle = e.sprite === 'slimePurple' ? '#aa44ff' : e.sprite === 'slimeRed' ? '#ff4444' : '#44ff44';
        ctx.fillRect(mmX + Math.round(e.x) * 3, mmY + Math.round(e.y) * 3, 3, 3);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mmX + Math.round(game.player.x) * 3 - 1, mmY + Math.round(game.player.y) * 3 - 1, 4, 4);

      // Controls
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, H - 22, W, 22);
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('WASD/Arrows:Move  X:Attack  SPACE/Enter:Talk', 8, H - 7);

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // STABLE — all volatile state read via refs

  // ── Heart drawing helpers ──
  const drawHeartFull = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.35, w * 0.3, Math.PI, 0);
    ctx.arc(x + w * 0.7, y + h * 0.35, w * 0.3, Math.PI, 0);
    ctx.lineTo(x + w, y + h * 0.35);
    ctx.bezierCurveTo(x + w, y + h * 0.8, x + w * 0.5, y + h, x + w * 0.5, y + h);
    ctx.bezierCurveTo(x + w * 0.5, y + h, x, y + h * 0.8, x, y + h * 0.35);
    ctx.fill();
  };

  const drawHeartHalf = (ctx, x, y, w, h, color) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w / 2, h);
    ctx.clip();
    drawHeartFull(ctx, x, y, w, h, color);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + w / 2, y, w / 2, h);
    ctx.clip();
    drawHeartFull(ctx, x, y, w, h, '#555');
    ctx.restore();
  };

  const drawHeartEmpty = (ctx, x, y, w, h) => {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.35, w * 0.3, Math.PI, 0);
    ctx.arc(x + w * 0.7, y + h * 0.35, w * 0.3, Math.PI, 0);
    ctx.lineTo(x + w, y + h * 0.35);
    ctx.bezierCurveTo(x + w, y + h * 0.8, x + w * 0.5, y + h, x + w * 0.5, y + h);
    ctx.bezierCurveTo(x + w * 0.5, y + h, x, y + h * 0.8, x, y + h * 0.35);
    ctx.fill();
  };

  const CANVAS_W = 800;
  const CANVAS_H = 560;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace',
      color: '#e8d5a3', padding: '10px', userSelect: 'none',
    }}>
      <div style={{
        fontSize: '22px', fontWeight: 'bold', letterSpacing: '4px',
        color: '#ddaa22', marginBottom: '8px',
        textShadow: '2px 2px 0 #5a3d2b, -1px -1px 0 #5a3d2b',
      }}>
        ⚔ THE KINGDOM OF LUMINARA ⚔
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          border: '3px solid #5a3d2b',
          imageRendering: 'pixelated',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.3)',
          outline: 'none',
        }}
        tabIndex={0}
        autoFocus
      />

      {dialogue && (
        <div style={{
          marginTop: '8px', width: CANVAS_W,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          border: '3px solid #ddaa22', borderRadius: '4px',
          padding: '14px 20px',
        }}>
          <div style={{ color: '#ddaa22', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            {dialogue.speaker}
          </div>
          <div style={{ color: '#e8d5a3', fontSize: '13px', lineHeight: '1.5' }}>
            {dialogue.text}
          </div>
          <div style={{ textAlign: 'right', color: '#888', fontSize: '10px', marginTop: '4px' }}>
            ▸ [SPACE] continue
          </div>
        </div>
      )}

      {showWin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            textAlign: 'center', padding: '40px', maxWidth: '500px',
            background: 'linear-gradient(180deg, #1a1a3e 0%, #0a0a2e 100%)',
            border: '4px solid #ddaa22', borderRadius: '8px',
          }}>
            <div style={{ fontSize: '36px', color: '#ddaa22', marginBottom: '16px' }}>✦ VICTORY ✦</div>
            <div style={{ fontSize: '15px', color: '#e8d5a3', marginBottom: '16px', lineHeight: '1.6' }}>
              You returned the Crystal of Dawn to Luminara!<br/>
              Light floods the kingdom. The people cheer your name!
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>
              Level {inventory.level} | {inventory.rupees} Rupees | {inventory.items.join(', ') || '—'}
            </div>
            <div style={{ fontSize: '28px', marginBottom: '20px' }}>⚔️🛡️💎✨🏰✨💎🛡️⚔️</div>
            <button
              onClick={() => setShowWin(false)}
              style={{
                padding: '10px 30px', background: '#ddaa22', color: '#1a1a2e',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold',
              }}
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
