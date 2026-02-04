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

  if (key === " " && !bombs.some(b => b.owner === "player")) {
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
    for (let i = 1; i <= 2; i++) {
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
      if (map[t.y][t.x] === 2) map[t.y][t.x] = 0;
      if (player.x === t.x && player.y === t.y) endGame("You Lose…");
      if (enemy.x === t.x && enemy.y === t.y) enemy.alive = false;
    });

    bombs.splice(i, 1);
  }

  explosions = explosions.filter(e => --e.timer > 0);
}

/* ===== A* 最短経路探索 ===== */
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

/* ===== 壊せる壁を探す ===== */
function findBreakableWallTowardsPlayer() {
  const dx = Math.sign(player.x - enemy.x);
  const dy = Math.sign(player.y - enemy.y);

  // プレイヤー方向にある壊せる壁を探す
  const tx = enemy.x + dx;
  const ty = enemy.y + dy;

  if (map[ty] && map[ty][tx] === 2) {
    return { x: tx, y: ty };
  }

  return null;
}

/* ===== 敵AI ===== */
function enemyAI() {
  if (!enemy.alive) return;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  const danger = dangerTiles();

  // 1. 危険地帯なら逃げる
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    const safeMoves = DIRS
      .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
      .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));

    if (safeMoves.length) {
      const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
      return;
    }
  }

  // 2. A* でプレイヤーへ最短経路
  const path = findPath(enemy, player);

  if (path && path.length > 0) {
    const next = path[0];
    enemy.x = next.x;
    enemy.y = next.y;
    return;
  }

  // 3. A* で道が見つからない → 壁破壊モード
  const wall = findBreakableWallTowardsPlayer();

  if (wall) {
    // 壁の隣に移動
    const dx = Math.sign(wall.x - enemy.x);
    const dy = Math.sign(wall.y - enemy.y);

    const nx = enemy.x + dx;
    const ny = enemy.y + dy;

    if (canMove(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
    }

    // 壁の隣に来たら爆弾設置
    if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {
      if (!bombs.some(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
      }
    }

    return;
  }

  // 4. 何もできないときはランダム移動
  const moves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
    .filter(p => canMove(p.x, p.y));

  if (moves.length) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
  }
}

/* ===== ゲームループ ===== */
function gameLoop() {
  if (!gameStarted || gamePaused || gameOver) return;

  updateBombs();
  enemyAI();
  draw();

  if (!enemy.alive && !gameOver) endGame("You Win!");

  requestAnimationFrame(gameLoop);
}
