import { TILE_SIZE, PALETTE, TILE_MAP } from './tiles';
import { SPRITE_SIZE, heroDown1, heroDown2 } from './sprites';

// ─── CANVAS RENDERING ───
function drawSprite(ctx, spriteData, x, y, size = SPRITE_SIZE) {
  const scale = size / SPRITE_SIZE;
  for (let row = 0; row < SPRITE_SIZE; row++) {
    for (let col = 0; col < SPRITE_SIZE; col++) {
      const colorIndex = spriteData[row]?.[col];
      if (colorIndex !== undefined && colorIndex !== 0 && PALETTE[colorIndex]) {
        ctx.fillStyle = PALETTE[colorIndex];
        ctx.fillRect(
          Math.floor(x + col * scale),
          Math.floor(y + row * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }
}

function drawTile(ctx, tileType, x, y) {
  if (!tileType || !tileType.render) return;
  const data = tileType.render;
  for (let row = 0; row < TILE_SIZE; row++) {
    for (let col = 0; col < TILE_SIZE; col++) {
      const colorIndex = data[row]?.[col];
      if (colorIndex !== undefined && colorIndex !== 0 && PALETTE[colorIndex]) {
        ctx.fillStyle = PALETTE[colorIndex];
        ctx.fillRect(x + col, y + row, 1, 1);
      }
    }
  }
}

function drawSpriteScaled(ctx, spriteData, x, y, pixelSize) {
  for (let row = 0; row < SPRITE_SIZE; row++) {
    for (let col = 0; col < SPRITE_SIZE; col++) {
      const colorIndex = spriteData[row]?.[col];
      if (colorIndex !== undefined && colorIndex !== 0 && PALETTE[colorIndex]) {
        ctx.fillStyle = PALETTE[colorIndex];
        ctx.fillRect(
          Math.floor(x + col * pixelSize),
          Math.floor(y + row * pixelSize),
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

function drawTileScaled(ctx, tileType, x, y, pixelSize) {
  if (!tileType || !tileType.render) return;
  const data = tileType.render;
  const tileSize = TILE_SIZE * pixelSize;
  for (let row = 0; row < TILE_SIZE; row++) {
    for (let col = 0; col < TILE_SIZE; col++) {
      const colorIndex = data[row]?.[col];
      if (colorIndex !== undefined && colorIndex !== 0 && PALETTE[colorIndex]) {
        ctx.fillStyle = PALETTE[colorIndex];
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

export { drawSprite, drawTile, drawSpriteScaled, drawTileScaled, PALETTE, TILE_SIZE, SPRITE_SIZE, TILE_MAP, heroDown1, heroDown2 };
