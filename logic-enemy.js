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
    const row = map[y];
    if (!row) continue;

    for (let x = 0; x < COLS; x++) {
      if (row[x] === 2) {
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
  if (!wall) return null;

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

/* ===== 特定の爆弾から逃げる（敵が置いた爆弾用） ===== */
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

/* ===== dangerTiles() ベースで危険から逃げる（全爆弾・爆風対象） ===== */
function escapeFromDanger(danger) {
  const safeMoves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy, dx, dy }))
    .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));

  if (safeMoves.length > 0) {
    const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
    lastMove = { dx: m.dx, dy: m.dy };
    return true;
  }
  return false;
}

/* ===== ランダム移動（停滞防止） ===== */
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

/* ===== メインAI ===== */
function enemyAI() {
  if (!enemy || !enemy.alive) return;

  // ===== 開始直後の硬直を防ぐ（gameTime があるときだけ） =====
  if (typeof gameTime !== "undefined" && gameTime < 30) {
    enemyCooldown = Math.min(enemyCooldown || 2, 2);
  }

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  // ===== 危険回避（最優先） =====
  const danger = dangerTiles();

  // 今いるマスが危険なら、まず逃げる
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    // 1. もし自分の爆弾があれば、その爆風シミュレーションで逃げる
    const enemyBomb = bombs.find(b => b.owner === "enemy");
    if (enemyBomb && escapeFromBomb(enemyBomb.x, enemyBomb.y)) {
      return;
    }
    // 2. それでもダメ or 自分の爆弾が無い → dangerTiles ベースで逃げる
    if (escapeFromDanger(danger)) {
      return;
    }
    // 逃げ場が無いなら仕方ない…
  }

  // ===== 危険でないとき：壁を探しに行く =====

  // 壁ターゲットの再設定
  if (
    !currentWall ||
    !map[currentWall.y] ||
    map[currentWall.y][currentWall.x] !== 2
  ) {
    currentWall = findAnyBreakableWall();

    // 壁が無い → ランダム移動でうろうろ
    if (!currentWall) {
      randomMove();
      return;
    }

    currentTarget = findAdjacentTarget(currentWall);

    // 隣接マスが無い → 一旦リセットしてランダム移動
    if (!currentTarget) {
      currentWall = null;
      randomMove();
      return;
    }
  }

  // ===== 壁の隣に来たら爆弾を置く =====
  const distToWall =
    Math.abs(enemy.x - currentWall.x) + Math.abs(enemy.y - currentWall.y);

  if (distToWall === 1) {
    // まだ自分の爆弾が無いときだけ置く
    if (!bombs.some(b => b.owner === "enemy")) {
      const bx = enemy.x;
      const by = enemy.y;

      // 自分の爆風をシミュレートして、安全な退避先があるか確認
      const explosion = simulateExplosion(bx, by, enemyStats.firePower);
      const safeMoves = DIRS
        .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy, dx, dy }))
        .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

      if (safeMoves.length === 0) {
        // 逃げ場が無いなら置かない
        // ここでターゲットを変えてもいいけど、まずは置かないだけにしておく
        return;
      }

      // 爆弾設置
      bombs.push({ x: bx, y: by, timer: 120, owner: "enemy" });

      // 即座に安全マスへ退避
      const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
      lastMove = { dx: m.dx, dy: m.dy };

      return;
    }
  }

  // ===== A* でターゲット（壁の隣マス）へ移動 =====
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
        dist:
          Math.abs((enemy.x + adx) - currentTarget.x) +
          Math.abs((enemy.y + ady) - currentTarget.y)
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
