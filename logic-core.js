const keyLock = {};

/* ===== キー入力 ===== */
document.addEventListener("keydown", e => {
  if (!gameStarted || gamePaused || gameOver) return;
  if (keyLock[e.key]) return;
  keyLock[e.key] = true;
  handleKey(e.key);
});

document.addEventListener("keyup", e => keyLock[e.key] = false);

/* ===== プレイヤー操作 ===== */
function handleKey(key) {
  let nx = player.x;
  let ny = player.y;

  if (key === "ArrowUp") ny--;
  if (key === "ArrowDown") ny++;
  if (key === "ArrowLeft") nx--;
  if (key === "ArrowRight") nx++;

  if (canMove(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }

  if (key === " " &&
      bombs.filter(b => b.owner === "player").length < maxBombs) {
    bombs.push({ x: player.x, y: player.y, timer: 120, owner: "player" });
  }
}

/* ===== 移動可能判定 ===== */
function canMove(x, y) {
  if (!map[y] || map[y][x] !== 0) return false;
  return !bombs.some(b => b.x === x && b.y === y);
}

/* ===== 爆風範囲 ===== */
function explosionTiles(b) {
  const tiles = [{ x: b.x, y: b.y }];
  for (const [dx, dy] of DIRS) {
    for (let i = 1; i <= firePower; i++) {
      const x = b.x + dx * i;
      const y = b.y + dy * i;
      if (!map[y] || map[y][x] === undefined) break;
      tiles.push({ x, y });
      if (map[y][x] === 1) break;
    }
  }
  return tiles;
}

/* ===== 危険タイル ===== */
function dangerTiles() {
  const set = new Set();
  bombs.forEach(b =>
    explosionTiles(b).forEach(t => set.add(`${t.x},${t.y}`))
  );
  return set;
}

/* ===== 爆弾更新 ===== */
function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (--b.timer > 0) continue;

    const tiles = explosionTiles(b);
    explosions.push({ tiles, timer: 40 });

    tiles.forEach(t => {
      if (map[t.y][t.x] === 2) {
        map[t.y][t.x] = 0;

        const item = items.find(it => it.x === t.x && it.y === t.y);
        if (item) item.visible = true;
      }

      if (player.x === t.x && player.y === t.y) endGame("You Lose…");
      if (enemy.x === t.x && enemy.y === t.y) enemy.alive = false;
    });

    bombs.splice(i, 1);
  }

  explosions = explosions.filter(e => --e.timer > 0);
}

/* ===== アイテム取得 ===== */
function updateItems() {
  items.forEach(item => {
    if (!item.visible) return;

    if (player.x === item.x && player.y === item.y) {
      if (item.type === "fire") firePower++;
      if (item.type === "bomb") maxBombs++;
      item.visible = false;
    }

    if (enemy.x === item.x && enemy.y === item.y) {
      if (item.type === "fire") firePower++;
      if (item.type === "bomb") maxBombs++;
      item.visible = false;
    }
  });
}

/* ===== A* ===== */
function findPath(start, goal) {
  const open = [start];
  const came = {};
  const g = {};
  g[`${start.x},${start.y}`] = 0;

  while (open.length) {
    open.sort((a, b) =>
      g[`${a.x},${a.y}`] - g[`${b.x},${b.y}`]
    );
    const cur = open.shift();
    const key = `${cur.x},${cur.y}`;

    if (cur.x === goal.x && cur.y === goal.y) {
      const path = [];
      let k = key;
      while (came[k]) {
        const [x, y] = k.split(",").map(Number);
        path.push({ x, y });
        k = came[k];
      }
      return path.reverse();
    }

    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = `${nx},${ny}`;

      if (!canMove(nx, ny)) continue;

      const cost = g[key] + 1;
      if (g[nk] === undefined || cost < g[nk]) {
        g[nk] = cost;
        came[nk] = key;
        open.push({ x: nx, y: ny });
      }
    }
  }
  return null;
}

/* ===== プレイヤー方向の壁 ===== */
function findBreakableWallTowardsPlayer() {
  const dx = Math.sign(player.x - enemy.x);
  const dy = Math.sign(player.y - enemy.y);

  const tx = enemy.x + dx;
  const ty = enemy.y + dy;

  if (map[ty] && map[ty][tx] === 2) {
    return { x: tx, y: ty };
  }

  return null;
}

/* ===== 最も近い壊せる壁 ===== */
function findNearestBreakableWall(start) {
  const walls = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 2) {
        walls.push({ x, y });
      }
    }
  }

  if (walls.length === 0) return null;

  walls.sort((a, b) => {
    const da = Math.abs(a.x - start.x) + Math.abs(a.y - start.y);
    const db = Math.abs(b.x - start.x) + Math.abs(b.y - start.y);
    return da - db;
  });

  return walls[0];
}
