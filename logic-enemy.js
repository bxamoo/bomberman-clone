/* ===== 壊せる壁を自力で探す ===== */
function findAnyBreakableWall() {
  let best = null;
  let bestDist = Infinity;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 2) { // 壊せる壁
        const d = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
        if (d < bestDist) {
          bestDist = d;
          best = { x, y };
        }
      }
    }
  }
  return best;
}

/* ===== 爆風範囲 ===== */
function simulateExplosion(x, y, power) {
  const tiles = new Set();
  tiles.add(`${x},${y}`);

  for (const [dx, dy] of DIRS) {
    for (let i = 1; i <= power; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;

      if (!map[ny] || map[ny][nx] === undefined) break;
      tiles.add(`${nx},${ny}`);
      if (map[ny][nx] === 1) break;
    }
  }
  return tiles;
}

/* ===== 爆弾から逃げる ===== */
function escapeFromBomb(bx, by) {
  const explosion = simulateExplosion(bx, by, enemyStats.firePower);

  const safeMoves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
    .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

  if (safeMoves.length > 0) {
    const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
    return true;
  }
  return false;
}

/* ===== メインAI ===== */
function enemyAI() {
  if (!enemy.alive) return;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  /* ===== 危険回避 ===== */
  const danger = dangerTiles();
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    const enemyBomb = bombs.find(b => b.owner === "enemy");
    if (enemyBomb) {
      escapeFromBomb(enemyBomb.x, enemyBomb.y);
      return;
    }
  }

  /* ===== 壁を探す（自力スキャン） ===== */
  const wall = findAnyBreakableWall();

  if (!wall) {
    // 壁がないなら動かない（ゲーム終盤）
    return;
  }

  /* ===== 壁に向かう ===== */
  const dx = Math.sign(wall.x - enemy.x);
  const dy = Math.sign(wall.y - enemy.y);

  const nx = enemy.x + dx;
  const ny = enemy.y + dy;

  /* ===== 壁の隣に来たら爆弾 ===== */
  if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

    if (!bombs.some(b => b.owner === "enemy")) {
      const bx = enemy.x;
      const by = enemy.y;

      bombs.push({ x: bx, y: by, timer: 120, owner: "enemy" });

      escapeFromBomb(bx, by);
      return;
    }
  }

  /* ===== 壁に近づく ===== */
  if (canMove(nx, ny)) {
    enemy.x = nx;
    enemy.y = ny;
    return;
  }

  /* ===== 回り込み ===== */
  const sideMoves = [
    { x: enemy.x + dy, y: enemy.y + dx },
    { x: enemy.x - dy, y: enemy.y - dx }
  ];

  for (const m of sideMoves) {
    if (canMove(m.x, m.y)) {
      enemy.x = m.x;
      enemy.y = m.y;
      return;
    }
  }
}
