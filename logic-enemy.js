/* ===== 壊せる壁を自力で探す ===== */
function findAnyBreakableWall(exclude = null) {
  let best = null;
  let bestDist = Infinity;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 2) { // 壊せる壁
        if (exclude && exclude.some(w => w.x === x && w.y === y)) continue;

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

/* ===== 壁の隣の空きマスを探す ===== */
function findAdjacentTarget(wall) {
  const candidates = DIRS
    .map(([dx, dy]) => ({ x: wall.x + dx, y: wall.y + dy }))
    .filter(p => canMove(p.x, p.y));

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const da = Math.abs(a.x - enemy.x) + Math.abs(a.y - enemy.y);
    const db = Math.abs(b.x - enemy.x) + Math.abs(b.y - enemy.y);
    return da - db;
  });

  return candidates[0];
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

  /* ===== 壁探索（到達不能な壁を除外する） ===== */
  let triedWalls = [];
  let wall = null;
  let target = null;
  let path = null;

  while (true) {
    wall = findAnyBreakableWall(triedWalls);
    if (!wall) return; // 壁がない

    target = findAdjacentTarget(wall);
    if (!target) {
      triedWalls.push(wall);
      continue;
    }

    path = findPath(enemy, target);
    if (path && path.length > 1) break; // ★ path[1] が存在することを確認

    triedWalls.push(wall);
  }

  /* ===== ターゲットに到達したら爆弾 ===== */
  if (enemy.x === target.x && enemy.y === target.y) {

    if (!bombs.some(b => b.owner === "enemy")) {

      const bx = enemy.x;
      const by = enemy.y;

      const explosion = simulateExplosion(bx, by, enemyStats.firePower);
      const safeMoves = DIRS
        .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
        .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

      if (safeMoves.length === 0) return;

      bombs.push({ x: bx, y: by, timer: 120, owner: "enemy" });

      const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;

      return;
    }
  }

  /* ===== A* の次の1歩（path[1] を使う） ===== */
  const next = path[1]; // ← ★ これが最重要修正
  if (!next) return;

  if (canMove(next.x, next.y)) {
    enemy.x = next.x;
    enemy.y = next.y;
    return;
  }

  /* ===== 回り込み ===== */
  const dx = Math.sign(target.x - enemy.x);
  const dy = Math.sign(target.y - enemy.y);

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
