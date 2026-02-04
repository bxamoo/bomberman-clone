/* ===== 前回の移動方向 ===== */
let lastMove = null;

/* ===== 現在狙っている壁と隣接マス ===== */
let currentWall = null;
let currentTarget = null;

/* ===== 壊せる壁を自力で探す ===== */
function findAnyBreakableWall() {
  let best = null;
  let bestDist = Infinity;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 2) {
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
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy, dx, dy }))
    .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

  if (safeMoves.length > 0) {
    const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
    lastMove = { dx: m.dx, dy: m.dy };
    return true;
  }
  return false;
}

/* ===== メインAI ===== */
function enemyAI() {
  if (!enemy.alive) return;

  // ===== 開始直後の硬直を防ぐ =====
  if (gameTime < 30) enemyCooldown = 2;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  // ===== 危険回避 =====
  const danger = dangerTiles();
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    const enemyBomb = bombs.find(b => b.owner === "enemy");
    if (enemyBomb) {
      escapeFromBomb(enemyBomb.x, enemyBomb.y);
      return;
    }
  }

  // ===== 壁ターゲットの再設定 =====
  if (!currentWall || map[currentWall.y][currentWall.x] !== 2) {
    currentWall = findAnyBreakableWall();

    // 壁が無い → ランダム移動で停滞回避
    if (!currentWall) {
      randomMove();
      return;
    }

    currentTarget = findAdjacentTarget(currentWall);

    // 隣接マスが無い → 別の壁を探す
    if (!currentTarget) {
      currentWall = null;
      randomMove();
      return;
    }
  }

  // ===== 壁の隣に来たら爆弾 =====
  const distToWall = Math.abs(enemy.x - currentWall.x) + Math.abs(enemy.y - currentWall.y);
  if (distToWall === 1) {

    if (!bombs.some(b => b.owner === "enemy")) {

      const bx = enemy.x;
      const by = enemy.y;

      const explosion = simulateExplosion(bx, by, enemyStats.firePower);
      const safeMoves = DIRS
        .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy, dx, dy }))
        .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

      if (safeMoves.length === 0) return;

      bombs.push({ x: bx, y: by, timer: 120, owner: "enemy" });

      const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
      lastMove = { dx: m.dx, dy: m.dy };

      return;
    }
  }

  // ===== A* でターゲットへ移動 =====
  const path = findPath(enemy, currentTarget);

  if (!path || path.length < 2) {
    // パスが無い → ランダム移動で停滞回避
    randomMove();
    return;
  }

  const next = path[1];
  const dx = next.x - enemy.x;
  const dy = next.y - enemy.y;

  // ===== 逆方向禁止（弱め） =====
  if (lastMove && dx === -lastMove.dx && dy === -lastMove.dy) {

    const alternatives = DIRS
      .map(([adx, ady]) => ({
        x: enemy.x + adx,
        y: enemy.y + ady,
        dx: adx,
        dy: ady,
        dist: Math.abs((enemy.x + adx) - currentTarget.x) + Math.abs((enemy.y + ady) - currentTarget.y)
      }))
      .filter(p => canMove(p.x, p.y))
      .sort((a, b) => a.dist - b.dist);

    if (alternatives.length > 0) {
      const m = alternatives[0];
      enemy.x = m.x;
      enemy.y = m.y;
      lastMove = { dx: m.dx, dy: m.dy };
      return;
    }
  }

  // ===== 正常に進む =====
  if (canMove(next.x, next.y)) {
    enemy.x = next.x;
    enemy.y = next.y;
    lastMove = { dx, dy };
    return;
  }

  // ===== 最後の保険：ランダム移動 =====
  randomMove();
}

function randomMove() {
  const moves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy, dx, dy }))
    .filter(p => canMove(p.x, p.y));

  if (moves.length === 0) return;

  const m = moves[Math.floor(Math.random() * moves.length)];
  enemy.x = m.x;
  enemy.y = m.y;
  lastMove = { dx: m.dx, dy: m.dy };
}
