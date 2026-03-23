/*
  Week 6 — Example 4: Adding HUD (Score/Health), Enemies, and Interactive Objects

  Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
  Date: Feb. 26, 2026

  Controls:
    A or D (Left / Right Arrow)   Horizontal movement
    W (Up Arrow)                  Jump
    Space Bar                     Attack
    R                             Restart (only when dead)

  Tile key:
    g = groundTile.png       (surface ground)
    d = groundTileDeep.png   (deep ground, below surface)
    L = platformLC.png       (platform left cap)  -> boars turn
    R = platformRC.png       (platform right cap) -> boars turn
    [ = wallL.png            (wall left side)     -> boars turn
    ] = wallR.png            (wall right side)    -> boars turn
    b = boar spawn
    x = leaf collectible (boars pass through)
    f = fire hazard (player takes damage, boars turn around if they "see" it ahead)
      = empty (no sprite)
*/

let player, sensor;
let playerImg;

// --- PLAYER TRAIL EFFECT ---
let trailPositions = [];
let trailTimer = 0;

// --- SOUND EFFECTS ---
let jump;
let candyCollect;
let hitEnemy;
let receiveDamage;
let swing;
let music;

let playerAnis = {
  idle: { row: 0, frames: 4, frameDelay: 10 },
  run: { row: 1, frames: 4, frameDelay: 3 },
  jump: { row: 2, frames: 3, frameDelay: Infinity, frame: 0 },
  attack: { row: 3, frames: 2, frameDelay: 7 },
  hurtPose: { row: 3, frames: 2, frameDelay: 6 },
  death: { row: 4.2, frames: 3, frameDelay: 12 },
};

let boar;
let boarImg;
let boarSpawns = [];

let boarAnis = {
  run: { row: 1, frames: 3, frameDelay: 10 },
  throwPose: { row: 2.5, frames: 2, frameDelay: Infinity, frame: 0 },
  death: { row: 2.3, frames: 3, frameDelay: 12 },
};

let attacking = false;
let attackFrameCounter = 0;
let attackHitThisSwing = false;

let invulnTimer = 0;
const INVULN_FRAMES = 45;

let knockTimer = 0;
const KNOCK_FRAMES = 30;

let won = false;

let ground, groundDeep, platformsL, platformsR, wallsL, wallsR;
let groundTileImg,
  groundTileDeepImg,
  platformLCImg,
  platformRCImg,
  wallLImg,
  wallRImg;

let bgLayers = [];
let bgForeImg,
  bgMidImg,
  bgFarImg,
  bgSkyImg,
  bgSkybackImg,
  bgYellowImg,
  bgMountainImg;

let candy;
let candyImg;
let candySpawns = [];

let fire;
let fireImg;

let fontImg;
let hudGfx;
let lastScore = null;
let lastHealth = null;
let lastMaxHealth = null;

let score = 0;
let maxHealth = 3;
let health = maxHealth;

let dead = false;
let pendingDeath = false;
let deathStarted = false;
let deathFrameTimer = 0;

// --- TILE MAP ---
/*
  Tile key:
    g = groundTile.png       (surface ground)
    d = groundTileDeep.png   (deep ground, below surface)
    L = platformLC.png       (platform left cap)  -> boars turn
    R = platformRC.png       (platform right cap) -> boars turn
    [ = wallL.png            (wall left side)     -> boars turn
    ] = wallR.png            (wall right side)    -> boars turn
    b = boar spawn
    x = leaf collectible (boars pass through)
    f = fire hazard (player takes damage, boars turn around if they "see" it ahead)
      = empty (no sprite)
*/
let level = [
  "                    g   g   b    x       ", // row  0 (2)
  "                b             LggR      ", // row  1 (2)
  "      x     x    LggR    x                ", // row  2
  "     LR   LgR          LR               ", // row  3 (1)
  "   x  b        x   b  x                 ", // row  4
  "   LgggR       LRg   LgR        b x       ", // row  5 (3)
  "         LgR   x f        ggg   LggggR    ", // row  6 (3)
  " f x           LgR                    x f  ", // row  7
  " LgR      xb                  x       LggR", // row  8 (1)
  "         LgR        x f      LR  LgR    x ", // row  9
  "   x     [d]       LggR            [dd]", // row 10 (2)
  "LgggRLggggggR      Lgggg] dd     Lgggggggg", // row 11 (1)
  "dddddddddddddddddddddddddddddddddddddddd", // row 12
];

// --- LEVEL CONSTANTS ---
const TILE_W = 24;
const TILE_H = 24;

const FRAME_W = 32;
const FRAME_H = 32;

const LEVELW = TILE_W * level[0].length;
const LEVELH = TILE_H * level.length;

const VIEWTILE_W = 10;
const VIEWTILE_H = 8;
const VIEWW = TILE_W * VIEWTILE_W;
const VIEWH = TILE_H * VIEWTILE_H;

const WIN_SCORE = 15; // total leaves in level

const PLAYER_START_Y = LEVELH - TILE_H * 4;

// player damage knockback tuning
const PLAYER_KNOCKBACK_X = 2.0;
const PLAYER_KNOCKBACK_Y = 3.2;
const PLAYER_JUMP = 4.5;

// combat tuning
const ATTACK_RANGE_X = 20;
const ATTACK_RANGE_Y = 16;

// boar tuning
const BOAR_W = 18;
const BOAR_H = 12;
const BOAR_SPEED = 0.6;
const BOAR_HP = 3;

const BOAR_KNOCK_FRAMES = 10;
const BOAR_KNOCK_X = 1.3;
const BOAR_KNOCK_Y = 1.6;
const BOAR_FLASH_FRAMES = 5;

// boar turning tuning
const BOAR_TURN_COOLDOWN = 12; // frames

// boar probe positioning (relative to boar)
const PROBE_FORWARD = 10; // how far ahead (smaller = closer to boar)
const PROBE_FRONT_Y = 10; // how far down from boar center to sample "ahead at feet"
const PROBE_HEAD_Y = 0; // how far UP from boar center to sample "ahead above"
const PROBE_SIZE = 4; // for debugging purposes

// HUD constants
const FONT_COLS = 19;
const FONT_ROWS = 5;
const CELL = 30;

const FONT_SCALE = 1 / 3;
const GLYPH_W = CELL * FONT_SCALE;
const GLYPH_H = CELL * FONT_SCALE;

const FONT_CHARS =
  " !\"#$%&'()*+,-./0123456789:;<=>?@" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`" +
  "abcdefghijklmnopqrstuvwxyz{|}~";

// gravity
const GRAVITY = 10;

// --- TILE HELPERS (only what we actually need) ---
function tileAt(col, row) {
  if (row < 0 || row >= level.length) return " ";
  if (col < 0 || col >= level[0].length) return " ";
  return level[row][col];
}

function tileAtWorld(x, y) {
  const col = Math.floor(x / TILE_W);
  const row = Math.floor(y / TILE_H);
  return tileAt(col, row);
}

function preload() {
  playerImg = loadImage("assets/catSpriteSheet.png");
  boarImg = loadImage("assets/monsterSpriteSheet.png");
  candyImg = loadImage("assets/candySpriteSheet.png");
  fireImg = loadImage("assets/fireSpriteSheet.png");

  bgFarImg = loadImage("assets/background_layer_1.png");
  bgMidImg = loadImage("assets/background_layer_2.png");
  bgForeImg = loadImage("assets/background_layer_3.png");
  bgSkyImg = loadImage("assets/background_layer_4.png");
  bgSkybackImg = loadImage("assets/background_layer_5.png");
  bgYellowImg = loadImage("assets/background_layer_6.png");
  bgMountainImg = loadImage("assets/background_layer_7.png");

  groundTileImg = loadImage("assets/groundTile.png");
  groundTileDeepImg = loadImage("assets/groundTileDeep.png");
  platformLCImg = loadImage("assets/platformLC.png");
  platformRCImg = loadImage("assets/platformRC.png");
  wallLImg = loadImage("assets/wallL.png");
  wallRImg = loadImage("assets/wallR.png");

  fontImg = loadImage("assets/bitmapFont.png");

  jump = loadSound("./assets/sfx/jump.wav");
  candyCollect = loadSound("./assets/sfx/leafCollect.wav");
  hitEnemy = loadSound("./assets/sfx/hitEnemy.wav");
  receiveDamage = loadSound("./assets/sfx/receiveDamage.wav");
  swing = loadSound("./assets/sfx/swing.mp3");
  music = loadSound("./assets/sfx/music.wav");
}

function setup() {
  new Canvas(VIEWW, VIEWH, "pixelated");
  noSmooth();

  applyIntegerScale();
  window.addEventListener("resize", applyIntegerScale);

  allSprites.pixelPerfect = true;

  // Manual physics stepping for stable pixel rendering
  world.autoStep = false;

  // HUD buffer
  hudGfx = createGraphics(VIEWW, VIEWH);
  hudGfx.noSmooth();
  hudGfx.pixelDensity(1);

  makeWorld();

  // Leaves should be overlap-only (boars pass through, player collects)
  for (const s of candy) s.removeColliders();
  candySpawns = [];
  for (const s of candy) {
    s.active = true;
    candySpawns.push({ s, x: s.x, y: s.y });
  }

  // store boar spawns for restart
  boarSpawns = [];
  for (const e of boar) boarSpawns.push({ x: e.x, y: e.y, dir: e.dir });
}

function draw() {
  background(69, 61, 79);

  // 1) decide boar vel/turns using probes
  updateBoars();

  // 2) then let physics apply vel.x / gravity
  world.step();

  // --- CAMERA ---
  camera.width = VIEWW;
  camera.height = VIEWH;

  let targetX = constrain(player.x, VIEWW / 2, LEVELW - VIEWW / 2 - TILE_W / 2);
  let targetY = constrain(
    player.y,
    VIEWH / 2 - TILE_H * 2,
    LEVELH - VIEWH / 2 - TILE_H,
  );

  camera.x = Math.round(lerp(camera.x || targetX, targetX, 0.1));
  camera.y = Math.round(lerp(camera.y || targetY, targetY, 0.1));

  // --- PLAYER GROUNDED CHECK ---
  const grounded = isPlayerGrounded();

  // --- PLAYER INPUT (disabled during knockback / death) ---
  // ATTACK
  if (
    !dead &&
    !won &&
    knockTimer === 0 &&
    !pendingDeath &&
    grounded &&
    !attacking &&
    kb.presses("space")
  ) {
    attackHitThisSwing = false;
    attacking = true;
    attackHitThisSwing = false;
    attackFrameCounter = 0;
    player.vel.x = 0;
    player.ani.frame = 0;
    player.ani = "attack";
    player.ani.play();
    // --- PLAY SWING SOUND --//
    if (swing) swing.play();
  }

  // JUMP
  if (
    !dead &&
    !won &&
    knockTimer === 0 &&
    !pendingDeath &&
    grounded &&
    kb.presses("up")
  ) {
    player.vel.y = -1 * PLAYER_JUMP;

    if (jump) jump.play();
  }

  // --- PLAYER STATE / ANIMATION ---
  if (!dead && knockTimer > 0) {
    player.ani = "hurtPose";
    player.ani.frame = 1;
  } else if (!dead && pendingDeath) {
    player.ani = "hurtPose";
    player.ani.frame = 1;
  } else if (!dead && attacking) {
    attackFrameCounter++;

    if (
      !attackHitThisSwing &&
      attackFrameCounter >= 4 &&
      attackFrameCounter <= 8
    ) {
      tryHitBoar();
    }

    if (attackFrameCounter > 12) {
      attacking = false;
      attackFrameCounter = 0;
      attackHitThisSwing = false;
    }
  } else if (!dead && !grounded) {
    player.ani = "jump";
    player.ani.frame = player.vel.y < 0 ? 0 : 1;
  } else if (!dead) {
    player.ani = kb.pressing("left") || kb.pressing("right") ? "run" : "idle";
  }

  // --- PLAYER MOVEMENT ---
  if (dead || won) {
    player.vel.x = 0;
  } else if (knockTimer > 0) {
    // no control during knockback
  } else if (pendingDeath) {
    player.vel.x = 0;
  } else if (!attacking) {
    player.vel.x = 0;
    if (kb.pressing("left")) {
      player.vel.x = -1.5;
      player.mirror.x = true;
    } else if (kb.pressing("right")) {
      player.vel.x = 1.5;
      player.mirror.x = false;
    }
  }

  // keep player in world bounds
  player.x = constrain(player.x, FRAME_W / 2, LEVELW - FRAME_W / 2);

  // --- PARALLAX BACKGROUNDS (screen space) ---
  camera.off();
  imageMode(CORNER);
  drawingContext.imageSmoothingEnabled = false;

  for (const layer of bgLayers) {
    const img = layer.img;
    const w = img.width;

    let x = Math.round((-camera.x * layer.speed) % w);
    if (x > 0) x -= w;

    for (let tx = x; tx < VIEWW + w; tx += w) image(img, tx, 0);
  }

  camera.on();

  // --- FALL RESET (alive only) ---
  if (!dead && player.y > LEVELH + TILE_H * 3) {
    player.x = FRAME_W;
    player.y = PLAYER_START_Y;
    player.vel.x = 0;
    player.vel.y = 0;
  }

  // --- TIMERS ---
  if (invulnTimer > 0) invulnTimer--;
  if (knockTimer > 0) knockTimer--;

  // --- UPDATE PLAYER TRAIL ---
  trailTimer++;

  if (trailTimer % 2 === 0) {
    // every 2 frames
    trailPositions.push({
      x: player.x,
      y: player.y,
    });

    // keep only last 6 positions
    if (trailPositions.length > 6) {
      trailPositions.shift();
    }
  }

  // --- ENTER DEAD (only once, after landing) ---
  if (!dead && pendingDeath && knockTimer === 0 && grounded) {
    dead = true;
    pendingDeath = false;
    deathStarted = false;
  }

  // start death animation once
  if (dead && !deathStarted) {
    deathStarted = true;

    player.tint = "#ffffff";
    player.vel.x = 0;
    player.vel.y = 0;

    player.ani = "death";
    player.ani.frame = 0;

    deathFrameTimer = 0;
  }

  // advance death frames manually (non-looping)
  if (dead) {
    const frames = playerAnis.death.frames;
    const delayFrames = playerAnis.death.frameDelay;
    const msPerFrame = (delayFrames * 1000) / 60;

    deathFrameTimer += deltaTime;
    const f = Math.floor(deathFrameTimer / msPerFrame);
    player.ani.frame = Math.min(frames - 1, f);
  }

  // --- RENDER PIXEL SNAP (render-only, restores after draw) ---
  const px = player.x,
    py = player.y;
  const sx = sensor.x,
    sy = sensor.y;

  player.x = Math.round(player.x);
  player.y = Math.round(player.y);
  sensor.x = Math.round(sensor.x);
  sensor.y = Math.round(sensor.y);

  for (const s of candy) {
    if (!s.baseY) s.baseY = s.y;
    s.y = s.baseY + Math.sin(frameCount * 0.08 + s.x) * 3;
  }

  // hurt blink
  if (!dead && invulnTimer > 0) {
    player.tint = Math.floor(invulnTimer / 4) % 2 === 0 ? "#ff5050" : "#ffffff";
  } else {
    player.tint = "#ffffff";
  }

  allSprites.draw();

  // --- DRAW PLAYER TRAIL ---
  push();
  noFill();
  stroke("rgba(255,255,255,0.35)");
  strokeWeight(2);

  for (let i = 0; i < trailPositions.length - 1; i++) {
    const a = trailPositions[i];
    const b = trailPositions[i + 1];

    line(Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y));
  }

  pop();

  player.x = px;
  player.y = py;
  sensor.x = sx;
  sensor.y = sy;

  // --- HUD ---
  if (
    score !== lastScore ||
    health !== lastHealth ||
    maxHealth !== lastMaxHealth
  ) {
    redrawHUD();
    lastScore = score;
    lastHealth = health;
    lastMaxHealth = maxHealth;
  }

  camera.off();
  imageMode(CORNER);
  drawingContext.imageSmoothingEnabled = false;
  image(hudGfx, 0, 0);
  camera.on();

  // display a death or win overlay if those events happen
  if (dead) drawDeathOverlay();
  if (won) drawWinOverlay();

  // accept R to restart the game if player wins or dies
  if ((dead || won) && kb.presses("r")) restartGame();
}

function applyIntegerScale() {
  const c = document.querySelector("canvas");
  const scale = Math.max(
    1,
    Math.floor(Math.min(window.innerWidth / VIEWW, window.innerHeight / VIEWH)),
  );
  c.style.width = VIEWW * scale + "px";
  c.style.height = VIEWH * scale + "px";
}

// --- BITMAP FONT HUD ---
function drawBitmapTextToGfx(g, str, x, y, scale = FONT_SCALE) {
  str = String(str);

  const dw = CELL * scale;
  const dh = CELL * scale;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const idx = FONT_CHARS.indexOf(ch);
    if (idx === -1) continue;

    const col = idx % FONT_COLS;
    const row = Math.floor(idx / FONT_COLS);

    const sx = col * CELL;
    const sy = row * CELL;

    g.image(
      fontImg,
      Math.round(x + i * dw),
      Math.round(y),
      dw,
      dh,
      sx,
      sy,
      CELL,
      CELL,
    );
  }
}

function drawOutlinedTextToGfx(g, str, x, y, fillHex) {
  g.tint("#000000");
  drawBitmapTextToGfx(g, str, x - 1, y);
  drawBitmapTextToGfx(g, str, x + 1, y);
  drawBitmapTextToGfx(g, str, x, y - 1);
  drawBitmapTextToGfx(g, str, x, y + 1);

  g.tint(fillHex);
  drawBitmapTextToGfx(g, str, x, y);

  g.noTint();
}

function redrawHUD() {
  hudGfx.clear();
  hudGfx.drawingContext.imageSmoothingEnabled = false;
  hudGfx.imageMode(CORNER);

  drawOutlinedTextToGfx(hudGfx, `RESCUED ${score}/15`, 6, 6, "#ffdc00");

  const heartChar = "~";
  const heartX = 200;
  const heartY = 6;
  const spacing = GLYPH_W + 2;

  for (let i = 0; i < maxHealth; i++) {
    const x = heartX + i * spacing;
    const col = i < health ? "#ff5050" : "#783030";
    drawOutlinedTextToGfx(hudGfx, heartChar, x, heartY, col);
  }
}

// is player grounded
function isPlayerGrounded() {
  return (
    sensor.overlapping(ground) ||
    sensor.overlapping(groundDeep) ||
    sensor.overlapping(platformsL) ||
    sensor.overlapping(platformsR)
  );
}

// --- LEAF COLLECT ---
function rescueCandy(player, candy) {
  if (!candy.active) return;
  candy.active = false;
  candy.visible = false;
  candy.removeColliders();
  score++;
  if (candyCollect) candyCollect.play();
  // win condition
  if (score >= WIN_SCORE) {
    won = true;
    // optional: freeze player immediately
    player.vel.x = 0;
    player.vel.y = 0;
  }
}

// --- DAMAGE FROM FIRE ---
function takeDamageFromFire(player, fire) {
  if (invulnTimer > 0 || dead) return;

  health = max(0, health - 1);
  if (receiveDamage) receiveDamage.play();

  if (health <= 0) pendingDeath = true;

  invulnTimer = INVULN_FRAMES;
  knockTimer = KNOCK_FRAMES;

  const dir = player.x < fire.x ? -1 : 1;
  player.vel.x = dir * PLAYER_KNOCKBACK_X;
  player.vel.y = -PLAYER_KNOCKBACK_Y;

  attacking = false;
  attackFrameCounter = 0;
}

// --- BOAR: HIT PLAYER ---
function playerHitByBoar(player, e) {
  if (e.dying || e.dead) return;
  if (invulnTimer > 0 || dead) return;

  health = max(0, health - 1);

  if (receiveDamage) receiveDamage.play();
  if (health <= 0) pendingDeath = true;

  invulnTimer = INVULN_FRAMES;
  knockTimer = KNOCK_FRAMES;

  const dir = player.x < e.x ? -1 : 1;
  player.vel.x = dir * PLAYER_KNOCKBACK_X;
  player.vel.y = -PLAYER_KNOCKBACK_Y;

  attacking = false;
  attackFrameCounter = 0;
}

// --- PLAYER ATTACK -> BOAR ---
function tryHitBoar() {
  const grounded =
    sensor.overlapping(ground) ||
    sensor.overlapping(platformsL) ||
    sensor.overlapping(platformsR);
  if (!grounded) return;

  const facingDir = player.mirror.x ? -1 : 1;
  const playerFeetY = player.y + player.h / 2;

  for (const e of boar) {
    if (e.dead || e.dying) continue;

    const dx = e.x - player.x;
    if (Math.sign(dx) !== facingDir) continue;
    if (abs(dx) > ATTACK_RANGE_X + e.w / 2) continue;

    const boarFeetY = e.y + e.h / 2;
    if (abs(boarFeetY - playerFeetY) > ATTACK_RANGE_Y + 10) continue;

    damageBoar(e, facingDir);
    attackHitThisSwing = true;
    return;
  }
}

// --- BOAR TURN HELPER ---
function turnBoar(e, newDir) {
  if (e.turnTimer > 0) return; // cooldown prevents jitter / double-turns
  e.dir = newDir;
  e.turnTimer = BOAR_TURN_COOLDOWN;

  // small nudge so it separates from the thing it hit
  e.x += e.dir * 6;
  e.vel.x = 0; // kill sideways bounce/jitter impulse
}

function groundAheadForDir(e, dir) {
  const old = e.dir;
  e.dir = dir;
  updateBoarProbes(e);

  const ok =
    e.frontProbe.overlapping(ground) ||
    e.frontProbe.overlapping(groundDeep) ||
    e.frontProbe.overlapping(platformsL) ||
    e.frontProbe.overlapping(platformsR);

  e.dir = old;
  return ok;
}

function fixSpawnEdgeCase(e) {
  // requires probes already attached
  // choose a direction that has ground ahead (if possible)
  const leftOk = groundAheadForDir(e, -1);
  const rightOk = groundAheadForDir(e, 1);

  if (leftOk && !rightOk) e.dir = -1;
  else if (rightOk && !leftOk) e.dir = 1;
  // else keep whatever it already had (both ok or both bad)

  // IMPORTANT: after choosing dir, re-place probes and "freeze" for this frame
  updateBoarProbes(e);
  e.vel.x = 0; // don't let it take a step this frame
  e.turnTimer = 0; // allow turning immediately if your danger logic wants to
  e.wasDanger = false; // ensure rising-edge logic can trigger
}

function hookBoarSolids() {
  boar.collides(ground);
  boar.collides(groundDeep);
  boar.collides(platformsL);
  boar.collides(platformsR);
  boar.collides(wallsL);
  boar.collides(wallsR);
}

function damageBoar(e, facingDir) {
  if (e.dead || e.dying) return;

  if (hitEnemy) hitEnemy.play();

  e.hp = max(0, e.hp - 1);
  e.flashTimer = BOAR_FLASH_FRAMES;

  if (e.hp <= 0) {
    e.dying = true;
    e.vel.x = 0;
    e.collider = "none";
    e.removeColliders();
    e.ani = "throwPose";
    e.ani.frame = 0;
    return;
  }

  e.knockTimer = BOAR_KNOCK_FRAMES;
  e.vel.x = facingDir * BOAR_KNOCK_X;
  e.vel.y = -BOAR_KNOCK_Y;

  e.ani = "throwPose";
  e.ani.frame = 0;
}

function boarDiesInFire(e, f) {
  if (e.dead || e.dying) return;
  e.hp = 0;
  e.dying = true;
  e.knockTimer = 0;
  e.vel.x = 0;
}

function drawWinOverlay() {
  camera.off();
  drawingContext.imageSmoothingEnabled = false;

  push();
  noStroke();
  // slightly lighter overlay than death
  fill(0, 120);
  rect(0, 0, VIEWW, VIEWH);
  pop();

  const msg1 = "YOU WIN!";
  const msg2 = "Press R to restart";

  const x1 = Math.round((VIEWW - msg1.length * GLYPH_W) / 2);
  const x2 = Math.round((VIEWW - msg2.length * GLYPH_W) / 2);

  const y1 = Math.round(VIEWH / 2 - 18);
  const y2 = Math.round(VIEWH / 2 + 2);

  // colourful headline + white prompt
  drawOutlinedTextToGfx(window, msg1, x1, y1, "#00e5ff");
  drawOutlinedTextToGfx(window, msg2, x2, y2, "#ffffff");

  camera.on();
}

function drawDeathOverlay() {
  camera.off();
  drawingContext.imageSmoothingEnabled = false;

  push();
  noStroke();
  fill(0, 160);
  rect(0, 0, VIEWW, VIEWH);
  pop();

  const msg1 = "YOU DIED";
  const msg2 = "Press R to restart";

  const x1 = Math.round((VIEWW - msg1.length * GLYPH_W) / 2);
  const x2 = Math.round((VIEWW - msg2.length * GLYPH_W) / 2);

  const y1 = Math.round(VIEWH / 2 - 18);
  const y2 = Math.round(VIEWH / 2 + 2);

  // draw to screen (window) using same outlined font
  drawOutlinedTextToGfx(window, msg1, x1, y1, "#ffffff");
  drawOutlinedTextToGfx(window, msg2, x2, y2, "#ffffff");

  camera.on();
}

function placeProbe(probe, x, y) {
  probe.x = x;
  probe.y = y;
}

function attachBoarProbes(e) {
  e.footProbe = new Sprite(-9999, -9999, PROBE_SIZE, PROBE_SIZE);
  e.footProbe.color = "magenta";
  e.footProbe.stroke = "black";
  e.footProbe.collider = "none";
  e.footProbe.sensor = true;

  e.frontProbe = new Sprite(-9999, -9999, PROBE_SIZE, PROBE_SIZE);
  e.frontProbe.color = "cyan";
  e.frontProbe.stroke = "black";
  e.frontProbe.collider = "none";
  e.frontProbe.sensor = true;

  e.groundProbe = new Sprite(-9999, -9999, PROBE_SIZE, PROBE_SIZE);
  e.groundProbe.color = "yellow";
  e.groundProbe.stroke = "black";
  e.groundProbe.collider = "none";
  e.groundProbe.sensor = true;

  // keep them on/off consistently
  e.footProbe.visible = false;
  e.frontProbe.visible = false;
  e.groundProbe.visible = false;

  // make sure probes always render on top of tiles
  e.footProbe.layer = 999;
  e.frontProbe.layer = 999;
  e.groundProbe.layer = 999;
}

function updateBoarProbes(e) {
  const forwardX = e.x + e.dir * PROBE_FORWARD;

  // "front" probe: ahead + lower (near feet)
  placeProbe(e.frontProbe, forwardX, e.y + PROBE_FRONT_Y);

  // "foot probe" (your "above" probe): ahead + higher
  placeProbe(e.footProbe, forwardX, e.y - PROBE_HEAD_Y);
}

function updateGroundProbe(e) {
  if (!e.groundProbe) return;
  placeProbe(e.groundProbe, e.x, e.y + e.h / 2 + 4);
}

function frontProbeHasGroundAhead(e) {
  const p = e.frontProbe;
  return (
    p.overlapping(ground) ||
    p.overlapping(groundDeep) ||
    p.overlapping(platformsL) ||
    p.overlapping(platformsR)
  );
}

function frontProbeHitsWall(e) {
  const p = e.frontProbe;
  return p.overlapping(wallsL) || p.overlapping(wallsR);
}

function shouldTurnNow(e, dangerNow) {
  // only turn on the rising edge: false -> true
  const risingEdge = dangerNow && !e.wasDanger;
  e.wasDanger = dangerNow;
  return risingEdge;
}

function boarGrounded(e) {
  const p = e.groundProbe;
  return (
    p.overlapping(ground) ||
    p.overlapping(groundDeep) ||
    p.overlapping(platformsL) ||
    p.overlapping(platformsR)
  );
}

// --- BOAR AI (simple + reliable) ---
// Rules:
// 1) If boar collides with L/R/[ /], it turns (handled by collides callbacks)
// 2) If boar "sees" fire ahead (tile probe), it turns
// 3) Leaves do not affect boars (no colliders; no boar/leaf collisions)
function updateBoars() {
  // freeze boars if player wins
  if (won) {
    for (const e of boar) e.vel.x = 0;
    return;
  }

  for (const e of boar) {
    updateBoarProbes(e);
    updateGroundProbe(e);

    if (e.spawnFreeze > 0) {
      e.spawnFreeze--;
      e.vel.x = 0;
      e.ani = "run"; // or "throwPose" if you want a “wake up” pose
      continue;
    }

    // timers
    if (e.flashTimer > 0) e.flashTimer--;
    if (e.knockTimer > 0) e.knockTimer--;
    if (e.turnTimer > 0) e.turnTimer--;

    // tint flash when hit
    e.tint = e.flashTimer > 0 ? "#ff5050" : "#ffffff";

    // determine if the boar is on the ground
    const grounded = boarGrounded(e);

    // dying behavior (wait until grounded to start death)
    if (!e.dead && e.dying && grounded) {
      e.dead = true;
      e.deathStarted = false;
    }

    if (e.dying && !e.dead) {
      e.vel.x = 0;
      e.ani = "throwPose";
      e.ani.frame = 0;
      continue;
    }

    // start death once, then freeze + animate + remove
    if (e.dead && !e.deathStarted) {
      e.deathStarted = true;

      e.holdX = e.x;
      e.holdY = e.y;

      e.vel.x = 0;
      e.vel.y = 0;

      e.collider = "none";
      e.removeColliders();

      e.x = e.holdX;
      e.y = e.holdY;

      e.ani = "death";
      e.ani.frame = 0;

      e.deathFrameTimer = 0;
      e.vanishTimer = 24;
      e.visible = true;
    }

    if (e.dead) {
      e.x = e.holdX;
      e.y = e.holdY;

      const frames = boarAnis.death.frames;
      const delayFrames = boarAnis.death.frameDelay;
      const msPerFrame = (delayFrames * 1000) / 60;

      e.deathFrameTimer += deltaTime;
      const f = Math.floor(e.deathFrameTimer / msPerFrame);
      e.ani.frame = Math.min(frames - 1, f);

      if (f >= frames - 1) {
        if (e.vanishTimer > 0) {
          e.visible = Math.floor(e.vanishTimer / 3) % 2 === 0;
          e.vanishTimer--;
        } else {
          e.footProbe?.remove();
          e.frontProbe?.remove();
          e.groundProbe?.remove();
          e.remove();
        }
      }
      continue;
    }

    // knockback overrides patrol
    if (e.knockTimer > 0) {
      e.ani = "throwPose";
      e.ani.frame = 0;
      continue;
    }

    // if not grounded, don’t patrol
    if (!grounded) {
      e.ani = "throwPose";
      e.ani.frame = 0;
      continue;
    }

    // default direction if missing
    if (e.dir !== 1 && e.dir !== -1) e.dir = random([-1, 1]);

    // world bounds safety (optional, but prevents escaping if a cap is missing)
    if (e.x < e.w / 2) turnBoar(e, 1);
    if (e.x > LEVELW - e.w / 2) turnBoar(e, -1);

    // --- PROBE-BASED TURNING RULES ---
    // 1) turn if front probe is over "space" (no ground ahead)
    const noGroundAhead = !frontProbeHasGroundAhead(e);

    // 2) turn if front probe hits leaf or fire
    const frontHitsCandy = e.frontProbe.overlapping(candy);
    const frontHitsFire = e.frontProbe.overlapping(fire);
    const frontHitsWall = frontProbeHitsWall(e);

    // 3) extra: turn if the "above" probe sees fire (early warning)
    const headSeesFire = e.footProbe.overlapping(fire);

    const dangerNow =
      noGroundAhead ||
      frontHitsCandy ||
      frontHitsFire ||
      frontHitsWall ||
      headSeesFire;

    if (e.turnTimer === 0 && shouldTurnNow(e, dangerNow)) {
      turnBoar(e, -e.dir); // already nudges + vel.x=0
      updateBoarProbes(e); // probes match new direction immediately
      continue; // skip patrol velocity this frame
    }

    // patrol
    e.vel.x = e.dir * BOAR_SPEED;
    e.mirror.x = e.dir === -1;
    e.ani = "run";
  }
}

function restartGame() {
  won = false;
  score = 0;
  health = maxHealth;

  invulnTimer = 0;
  knockTimer = 0;

  dead = false;
  pendingDeath = false;
  deathStarted = false;
  deathFrameTimer = 0;

  attacking = false;
  attackFrameCounter = 0;

  player.x = FRAME_W;
  player.y = PLAYER_START_Y;
  player.vel.x = 0;
  player.vel.y = 0;

  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.vel.x = 0;
  sensor.vel.y = 0;

  player.ani = "idle";
  player.tint = "#ffffff";

  camera.x = undefined;
  camera.y = undefined;

  // respawn candies
  for (const item of candySpawns) {
    const s = item.s;
    s.x = item.x;
    s.y = item.y;
    s.active = true;
    s.visible = true;
    s.removeColliders(); // keep overlap-only
  }

  // respawn boars (simple rebuild)
  for (const e of boar) {
    e.footProbe?.remove();
    e.frontProbe?.remove();
    e.groundProbe?.remove();
    e.remove();
  }

  boar = new Group();
  boar.spriteSheet = boarImg;
  boar.anis.w = FRAME_W;
  boar.anis.h = FRAME_H;
  boar.anis.offset.y = -8;
  boar.addAnis(boarAnis);
  boar.overlaps(fire, boarDiesInFire);

  for (const s of boarSpawns) {
    const e = new Sprite(s.x, s.y, BOAR_W, BOAR_H);
    e.spriteSheet = boarImg;
    e.rotationLock = true;

    e.anis.w = FRAME_W;
    e.anis.h = FRAME_H;
    e.anis.offset.y = -8;
    e.addAnis(boarAnis);

    e.physics = "dynamic";
    e.w = BOAR_W;
    e.h = BOAR_H;
    e.friction = 0;
    e.bounciness = 0;

    e.hp = BOAR_HP;

    attachBoarProbes(e);

    // if you ever decide to store dir in boarSpawns later, use that here.
    // for now: random, then fix
    e.dir = random([-1, 1]);
    boar.add(e);
    fixSpawnEdgeCase(e);

    e.spawnFreeze = 1; // freeze AI movement for 1 frame
    updateBoarProbes(e);
    updateGroundProbe(e); // if you added this helper
    e.vel.x = 0;

    e.wasDanger = false;

    e.flashTimer = 0;
    e.knockTimer = 0;
    e.turnTimer = 0;

    e.dead = false;
    e.dying = false;
    e.deathStarted = false;
    e.deathFrameTimer = 0;

    e.vanishTimer = 0;
    e.holdX = e.x;
    e.holdY = e.y;

    e.mirror.x = e.dir === -1;
    e.ani = "run";
  }

  // re-hook collisions / rules for newly created boar group
  hookBoarSolids();
  player.overlaps(boar, playerHitByBoar);

  lastScore = lastHealth = lastMaxHealth = null;
}

function makeWorld() {
  world.gravity.y = GRAVITY;

  // --- ENEMIES (boar spawned from 'b') ---
  boar = new Group();
  boar.spriteSheet = boarImg;
  boar.anis.w = FRAME_W;
  boar.anis.h = FRAME_H;
  boar.anis.offset.y = -8;
  boar.addAnis(boarAnis);
  boar.physics = "dynamic";
  boar.tile = "b";

  // --- INTERACTIVES ---
  candy = new Group();
  candy.physics = "static";
  candy.img = candyImg;
  candy.scale = 0.8;

  candy.w = 14;
  candy.h = 14;

  candy.tile = "x";

  fire = new Group();
  fire.physics = "static";
  fire.spriteSheet = fireImg;
  fire.addAnis({ burn: { w: 32, h: 32, row: 0, frames: 16 } });
  fire.w = 18;
  fire.h = 16;
  fire.tile = "f";

  boar.overlaps(fire, boarDiesInFire); // make sure boars die in the fire

  // --- LEVEL TILES ---
  ground = new Group();
  ground.physics = "static";
  ground.img = groundTileImg;
  ground.tile = "g";

  groundDeep = new Group();
  groundDeep.physics = "static";
  groundDeep.img = groundTileDeepImg;
  groundDeep.tile = "d";

  platformsL = new Group();
  platformsL.physics = "static";
  platformsL.img = platformLCImg;
  platformsL.tile = "L";

  platformsR = new Group();
  platformsR.physics = "static";
  platformsR.img = platformRCImg;
  platformsR.tile = "R";

  wallsL = new Group();
  wallsL.physics = "static";
  wallsL.img = wallLImg;
  wallsL.tile = "[";

  wallsR = new Group();
  wallsR.physics = "static";
  wallsR.img = wallRImg;
  wallsR.tile = "]";

  // build world from tilemap
  new Tiles(level, 0, 0, TILE_W, TILE_H);

  // --- PLAYER ---
  player = new Sprite(FRAME_W, PLAYER_START_Y, FRAME_W, FRAME_H);
  player.spriteSheet = playerImg;
  player.rotationLock = true;

  player.anis.w = FRAME_W;
  player.anis.h = FRAME_H;
  player.anis.offset.y = -8;
  player.addAnis(playerAnis);

  player.ani = "idle";
  player.w = 18;
  player.h = 10;
  player.friction = 0;
  player.bounciness = 0;

  // player interactions
  player.overlaps(fire, takeDamageFromFire);
  player.overlaps(candy, rescueCandy);
  player.collides(boar, playerHitByBoar);

  // --- GROUND SENSOR (query-only) ---
  sensor = new Sprite();
  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.w = player.w;
  sensor.h = 2;
  sensor.mass = 0.01;
  sensor.removeColliders();
  sensor.visible = false;

  const sensorJoint = new GlueJoint(player, sensor);
  sensorJoint.visible = false;

  // make fire overlap-only (hazard, not solid)
  for (const s of fire) {
    s.collider = "static";
    s.sensor = true; // if supported by your p5play build
  }

  // --- BOAR SETUP ---
  for (const e of boar) {
    e.physics = "dynamic";
    e.rotationLock = true;

    e.w = BOAR_W;
    e.h = BOAR_H;
    e.anis.offset.y = -8;

    e.friction = 0;
    e.bounciness = 0;

    e.hp = BOAR_HP;

    attachBoarProbes(e);

    // choose a safe direction BEFORE the first frame of movement
    e.dir = random([-1, 1]);
    fixSpawnEdgeCase(e);

    e.wasDanger = false;

    e.flashTimer = 0;
    e.knockTimer = 0;
    e.turnTimer = 0;

    e.dead = false;
    e.dying = false;
    e.deathStarted = false;
    e.deathFrameTimer = 0;

    e.vanishTimer = 0;
    e.holdX = e.x;
    e.holdY = e.y;

    e.mirror.x = e.dir === -1;
    e.ani = "run";
  }

  // attach turning rules (L/R/[ ])
  hookBoarSolids();

  // --- BACKGROUND PARALLAX ---
  bgLayers = [
    { img: bgFarImg, speed: 0.2 },
    { img: bgMidImg, speed: 0.4 },
    { img: bgForeImg, speed: 0.6 },
    { img: bgSkyImg, speed: 0.2 },
    { img: bgSkybackImg, speed: 0.1 },
    { img: bgYellowImg, speed: 0.3 },
    { img: bgMountainImg, speed: 0.1 },
  ];
}

function keyPressed() {
  userStartAudio();

  if (music && !music.isPlaying()) {
    music.setVolume(0.4);
    music.loop();
  }
}
