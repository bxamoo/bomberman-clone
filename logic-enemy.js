let enemyCooldown = 0;

/* ===== 前回の移動方向 ===== */
let lastMove = null;

/* ===== 現在狙っている壁・隣接マス・アイテム ===== */
let currentWall = null;
let currentTarget = null;
let currentItem = null;

/* ===== 行動フェーズ管理 ===== */
let enemyState = "idle";   // idle, collectItem, moveToWall, placeBomb, escape, huntPlayer, wait
let enemyWaitTimer = 0;

/* ===== 壊せる壁を探す ===== */
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

/* ===== アイテムを探す ===== */
function findNearestItem() {
  if (!Array.isArray(items) || items.length === 0) return null;

  let best = null;
  let bestDist = Infinity;

  for (const item of items) {
    const d = Math.abs(enemy.x - item.x) + Math.abs(enemy.y - item.y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
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

/* ===== dangerTiles() を使って安全マスへの最短パスを探す ===== */
function findSafePath(danger) {
  const visited = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );
  const queue = [];
  const parent = new Map();

  const startKey = `${enemy.x},${enemy.y}`;
  queue.push({ x: enemy.x, y: enemy.y });
  visited[enemy.y][enemy.x] = true;

  let goal = null;

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;

    if (!danger.has(key)) {
      goal = { x, y };
      break;
    }

    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        ny < 0 ||
        ny >= ROWS ||
        nx < 0 ||
        nx >= COLS ||
        visited[ny][nx] ||
        !canMove(nx, ny)
      ) {
        continue;
      }

      visited[ny][nx] = true;
      queue.push({ x: nx, y: ny });
      parent.set(`${nx},${ny}`, key);
    }
  }

  if (!goal) return null;

  const path = [];
  let curKey = `${goal.x},${goal.y}`;
  while (curKey !== startKey) {
    const [cx, cy] = curKey.split(",").map(Number);
    path.push({ x: cx, y: cy });
    curKey = parent.get(curKey);
    if (!curKey) break;
  }
  path.push({ x: enemy.x, y: enemy.y });
  path.reverse();

  return path;
}

/* ===== dangerTiles() ベースで危険から逃げる ===== */
function escapeFromDanger(danger) {
  const path = findSafePath(danger);
  if (!path || path.length < 2) return false;

  const next = path[1];
  const dx = next.x - enemy.x;
  const dy = next.y - enemy.y;

  if (canMove(next.x, next.y)) {
    enemy.x = next.x;
    enemy.y = next.y;
    lastMove = { dx, dy };
    return true;
  }
  return false;
}

/* ===== ランダム移動 ===== */
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

  /* ===== 移動クールダウン ===== */
  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 8;

  /* ===== 待機フェーズ ===== */
  if (enemyState === "wait") {
    if (enemyWaitTimer > 0) {
      enemyWaitTimer--;
      return;
    }
    enemyState = "idle";
  }

  /* ===== 危険回避（最優先） ===== */
  const danger = dangerTiles();
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    enemyState = "escape";
    if (escapeFromDanger(danger)) return;
    return;
  }

  /* ===== 危険がないときの行動 ===== */
  switch (enemyState) {

    /* -------------------------
       ① idle：優先順位で行動決定
    ------------------------- */
    case "idle": {

      // 1. アイテムがあるなら取りに行く
      currentItem = findNearestItem();
      if (currentItem) {
        enemyState = "collectItem";
        return;
      }

      // 2. 壁を壊す
      currentWall = findAnyBreakableWall();
      if (currentWall) {
        currentTarget = findAdjacentTarget(currentWall);
        if (currentTarget) {
          enemyState = "moveToWall";
          return;
        }
      }

      // 3. プレイヤーを追う（距離が近いとき）
      const distToPlayer =
        Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);

      if (distToPlayer <= 6) {
        enemyState = "huntPlayer";
        return;
      }

      // 4. 何もなければ軽く動く
      randomMove();
      return;
    }

    /* -------------------------
       ② アイテムを取りに行く
    ------------------------- */
    case "collectItem": {
      if (!currentItem) {
        enemyState = "idle";
        return;
      }

      const path = findPath(enemy, { x: currentItem.x, y: currentItem.y });
      if (!path || path.length < 2) {
        enemyState = "idle";
        return;
      }

      const next = path[1];
      if (canMove(next.x, next.y)) {
        enemy.x = next.x;
        enemy.y = next.y;
      }

      // 取れたら idle に戻る
      if (enemy.x === currentItem.x && enemy.y === currentItem.y) {
        currentItem = null;
        enemyState = "wait";
        enemyWaitTimer = 20;
      }
      return;
    }

    /* -------------------------
       ③ 壁の隣へ移動
    ------------------------- */
    case "moveToWall": {
      const path = findPath(enemy, currentTarget);

      if (!path || path.length < 2) {
        enemyState = "idle";
        return;
      }

      const next = path[1];
      if (canMove(next.x, next.y)) {
        enemy.x = next.x;
        enemy.y = next.y;
      }

      const dist =
        Math.abs(enemy.x - currentWall.x) +
        Math.abs(enemy.y - currentWall.y);

      if (dist === 1) {
        enemyState = "placeBomb";
      }
      return;
    }

    /* -------------------------
       ④ 爆弾を置く
    ------------------------- */
    case "placeBomb":
      if (!bombs.some(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
      }
      enemyState = "escape";
      return;

    /* -------------------------
       ⑤ プレイヤーを追う
    ------------------------- */
    case "huntPlayer": {
      const path = findPath(enemy, { x: player.x, y: player.y });

      if (!path || path.length < 2) {
        enemyState = "idle";
        return;
      }

      const next = path[1];
      if (canMove(next.x, next.y)) {
        enemy.x = next.x;
        enemy.y = next.y;
      }

      // プレイヤーが近いなら爆弾を置く
      const dist =
        Math.abs(enemy.x - player.x) +
        Math.abs(enemy.y - player.y);

      if (dist === 1 && !bombs.some(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
        enemyState = "escape";
      }
      return;
    }

    /* -------------------------
       ⑥ 爆風から逃げる
    ------------------------- */
    case "escape": {
      const dangerNow = dangerTiles();

      if (!dangerNow.has(`${enemy.x},${enemy.y}`)) {
        enemyState = "wait";
        enemyWaitTimer = 40;
        return;
      }

      escapeFromDanger(dangerNow);
      return;
    }
  }
}
