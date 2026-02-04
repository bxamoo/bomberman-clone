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

/* ===== 敵AI ===== */
function enemyAI() {
  if (!enemy.alive) return;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 12;

  const danger = dangerTiles();

  const moves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
    .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));

  if (moves.length) {
    moves.sort((a, b) =>
      Math.abs(a.x - player.x) + Math.abs(a.y - player.y) -
      (Math.abs(b.x - player.x) + Math.abs(b.y - player.y))
    );
    enemy.x = moves[0].x;
    enemy.y = moves[0].y;
  } else if (!bombs.some(b => b.owner === "enemy")) {
    bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
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
