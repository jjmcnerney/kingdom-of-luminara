// Tile IDs reference:
// 0 = grass, 1 = grass+flower1, 2 = grass+flower2
// 3 = water, 4 = path, 5 = path_cross
// 6 = tree, 7 = tree_small, 8 = wall
// 9 = fence, 10 = rock
// 11 = house_roof, 12 = house_wall
// 13 = bridge, 14 = chest, 15 = sign
// 16 = well

// 40x30 tile map - The Kingdom of Luminara
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

const worldMap = [
  // Row 0   - Forest edge
  [0, 2, 0, 0, 7, 0, 0, 0, 7, 0, 0, 2, 0, 0, 7, 0, 0, 0, 1, 0, 0, 2, 7, 0, 0, 0, 0, 0, 7, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0],
  // Row 1   - Dense forest
  [0, 7, 1, 0, 0, 2, 7, 0, 0, 0, 0, 0, 1, 0, 0, 7, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 7, 1, 0, 0, 2, 7, 0, 0, 0],
  // Row 2   - Forest with clearing start
  [7, 0, 0, 7, 0, 0, 1, 0, 0, 7, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 7, 0, 0, 1, 0, 0, 2],
  // Row 3   - Forest thinning
  [1, 0, 7, 2, 0, 0, 0, 0, 0, 0, 1, 7, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 7, 0, 0, 0, 0],
  // Row 4   - Trees with path entering
  [0, 0, 0, 0, 7, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 7, 4, 4],
  // Row 5   - Forest edge, path continues
  [0, 2, 0, 0, 0, 7, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 4],
  // Row 6   - Open area, trees
  [7, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 4, 4, 5, 4],
  // Row 7   - Open grassland
  [0, 7, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4],
  // Row 8   - Path leading to village
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 4, 4, 4, 4, 4, 4],
  // Row 9   - Path continues, flowers
  [1, 0, 0, 0, 1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 10  - Path to village crossroad
  [0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4],
  // Row 11  - Village area begins
  [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 12  - Village entrance with well
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 16, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 13  - Village - houses, paths
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4],
  // Row 14  - Village center - houses
  [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 4, 4, 11, 11, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 15  - Village - more houses
  [0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 4, 4, 12, 12, 4, 4, 4, 4, 11, 11, 4, 4, 4, 4, 4],
  // Row 16  - Village - houses and walls
  [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 4, 4, 12, 12, 4, 4, 4, 4, 12, 12, 4, 4, 4, 4, 4],
  // Row 17  - Village south
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 4, 4, 12, 12, 4, 4, 4, 4, 12, 12, 4, 5, 4, 4, 4],
  // Row 18  - Path south from village
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 19  - Path continues south
  [2, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 20  - Path to river
  [0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 21  - River begins
  [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 6, 3, 3, 3, 3, 13, 13, 3, 3, 3, 3, 4, 4, 4, 4],
  // Row 22  - River with bridge
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 6, 3, 3, 3, 3, 13, 13, 3, 3, 3, 4, 4, 4, 4, 4],
  // Row 23  - River continues
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 6, 3, 3, 3, 3, 3, 13, 13, 3, 3, 4, 4, 4, 4, 4, 4],
  // Row 24  - South of river
  [0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 6, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 25  - Open area with rocks
  [1, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 10, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 26  - Ruins area
  [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 10, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 27  - Ruins with walls
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 10, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 28  - Ruins entrance
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  // Row 29  - South forest
  [0, 0, 0, 7, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0],
];

// NPCs definition
const npcs = [
  {
    id: 'elder',
    x: 30,
    y: 14,
    sprite: 'villagerBrown',
    name: 'Elder Thorn',
    dialogue: [
      "Welcome to Luminara, young adventurer.",
      "Our kingdom faces a great darkness...",
      "The Crystal of Dawn has been stolen — Shadow Slimes took it to the ruins south!",
      "Venture south, defeat the Shadow Slimes with your sword, and retrieve the Crystal!",
      "Press X to attack them in real-time — don't let them touch you!",
    ],
    currentDialogue: 0,
  },
  {
    id: 'merchant',
    x: 35,
    y: 14,
    sprite: 'villagerRed',
    name: 'Merchant Fenn',
    dialogue: [
      "Ah, a traveler! Watch your step out there.",
      "I heard the Shadow Slimes are getting bolder.",
      "Press X to swing your sword at 'em!",
    ],
    currentDialogue: 0,
  },
  {
    id: 'scholar',
    x: 28,
    y: 16,
    sprite: 'villagerBlue',
    name: 'Scholar Mira',
    dialogue: [
      "I've studied the old ruins for years.",
      "The Crystal Chamber lies deep beneath them.",
      "Beware of the shadow slimes that guard it...",
      "They fear the light of the Crystal itself.",
    ],
    currentDialogue: 0,
  },
  {
    id: 'guard',
    x: 33,
    y: 17,
    sprite: 'villagerBlue',
    name: 'Guard Kael',
    dialogue: [
      "The bridge south leads to the old ruins.",
      "Many have gone... few have returned.",
      "Take care out there, friend.",
    ],
    currentDialogue: 0,
  },
  {
    id: 'child',
    x: 31,
    y: 17,
    sprite: 'villagerRed',
    name: 'Young Lira',
    dialogue: [
      "My grandpa says you're the hero!",
      "Please find the Crystal and bring back the sunshine!",
      "I'll pray for your safe return!",
    ],
    currentDialogue: 0,
  },
];

// Enemies definition
const enemies = [
  { id: 'slime1', x: 12, y: 2, sprite: 'slimeGreen', hp: 3, maxHp: 3, damage: 1, xp: 10, rupees: [0, 3], speed: 0.6, range: 4 },
  { id: 'slime2', x: 25, y: 3, sprite: 'slimeGreen', hp: 3, maxHp: 3, damage: 1, xp: 10, rupees: [0, 3], speed: 0.6, range: 4 },
  { id: 'slime3', x: 8, y: 8, sprite: 'slimeRed', hp: 5, maxHp: 5, damage: 2, xp: 20, rupees: [1, 5], speed: 0.8, range: 5 },
  { id: 'slime4', x: 35, y: 1, sprite: 'slimeGreen', hp: 3, maxHp: 3, damage: 1, xp: 10, rupees: [0, 3], speed: 0.6, range: 4 },
  { id: 'slime5', x: 15, y: 25, sprite: 'slimePurple', hp: 7, maxHp: 7, damage: 3, xp: 30, rupees: [2, 8], speed: 1.0, range: 5 },
  { id: 'slime6', x: 28, y: 26, sprite: 'slimePurple', hp: 7, maxHp: 7, damage: 3, xp: 30, rupees: [2, 8], speed: 1.0, range: 5 },
  { id: 'slime7', x: 35, y: 27, sprite: 'slimeRed', hp: 5, maxHp: 5, damage: 2, xp: 20, rupees: [1, 5], speed: 0.8, range: 5 },
  { id: 'slime8', x: 20, y: 5, sprite: 'slimeGreen', hp: 3, maxHp: 3, damage: 1, xp: 10, rupees: [0, 3], speed: 0.6, range: 4 },
  { id: 'slime9', x: 30, y: 7, sprite: 'slimeRed', hp: 5, maxHp: 5, damage: 2, xp: 20, rupees: [1, 5], speed: 0.8, range: 5 },
  { id: 'slime10', x: 10, y: 28, sprite: 'slimePurple', hp: 7, maxHp: 7, damage: 3, xp: 30, rupees: [2, 8], speed: 1.0, range: 5 },
];

// Chests definition
const chests = [
  { id: 'chest1', x: 15, y: 12, opened: false, item: 'sword', message: 'You found the Blade of Luminara!' },
  { id: 'chest2', x: 36, y: 28, opened: false, item: 'shield', message: 'You found the Shield of Dawn!' },
  { id: 'chest3', x: 5, y: 20, opened: false, item: 'hearts', message: 'You found a Heart Container! Max HP increased!' },
  { id: 'chest4', x: 35, y: 2, opened: false, item: 'rupees', message: 'You found 20 rupees!', value: 20 },
  { id: 'chest5', x: 22, y: 27, opened: false, item: 'rupees', message: 'You found 15 rupees!', value: 15 },
];

// Sign messages
const signs = {
  '0,9': 'Luminara Village ->',
  '35,28': 'The Crystal Ruins lie ahead...',
  '28,25': 'Warning: Shadow creatures beyond.',
};

// Starting position
const startPlayer = { x: 37, y: 10 };

export {
  MAP_WIDTH,
  MAP_HEIGHT,
  worldMap,
  npcs,
  enemies,
  chests,
  signs,
  startPlayer,
};
