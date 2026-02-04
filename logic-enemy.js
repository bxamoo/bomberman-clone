/* ===== 爆風シミュレーション ===== */
function simulateExplosion(x, y, power) {
  const tiles = new Set();
  tiles.add(`${x},${y}`);

  for (const [dx, dy] of DIRS) {
    for (let i = 1; i <= power; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;

      if (!map[ny] || map[ny][nx] === undefined) break;

      tiles.add(`${nx},${ny}`);

      if (map[ny][nx] === 1) break; // 固定壁で止まる
    }
  }
  return tiles;
}

/* ===== 爆弾を置いたとき安全に逃げられるか ===== */
function hasSafeEscapeRouteFromBomb(bx, by) {
  const explosion = simulateExplosion(bx, by, enemyStats.firePower);

  const safe = DIRS
    .map(([dx, dy]) => ({ x: bx + dx, y: by + dy }))
    .filter(p =>
      canMove(p.x, p.y) &&
      !explosion.has(`${p.x},${p.y}`)
    );

  // 逃げ道が2つ以上あるときだけ安全
  return safe.length >= 2;
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

  /* ===== 1. 危険回避 ===== */
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

  /* ===== 2. アイテム探索 ===== */
  const visibleItems = items.filter(it => it.visible);
  if (visibleItems.length) {
    const target = visibleItems[0];
    const path = findPath(enemy, target);

    if (path && path.length > 0) {
      const next = path[0];
      enemy.x = next.x;
      enemy.y = next.y;
      return;
    }
  }

  /* ===== 3. プレイヤー追跡 ===== */
  const path = findPath(enemy, player);

  if (path && path.length > 0) {
    const next = path[0];
    enemy.x = next.x;
    enemy.y = next.y;
    return;
  }

  /* ===== 4. 壁破壊モード ===== */
  let wall = findBreakableWallTowardsPlayer();
  if (!wall) wall = findNearestBreakableWall(enemy);

  if (wall) {
    // 壁の隣の「空きマス」を探す
    const neighbors = DIRS
      .map(([dx, dy]) => ({ x: wall.x + dx, y: wall.y + dy }))
      .filter(p => canMove(p.x, p.y));

    if (neighbors.length > 0) {
      // 一番近い隣接マスを選ぶ
      neighbors.sort((a, b) => {
        const da = Math.abs(a.x - enemy.x) + Math.abs(a.y - enemy.y);
        const db = Math.abs(b.x - enemy.x) + Math.abs(b.y - enemy.y);
        return da - db;
      });

      const target = neighbors[0];
      const pathToWall = findPath(enemy, target);

      /* ===== A* が成功した場合 ===== */
      if (pathToWall && pathToWall.length > 0) {
        const next = pathToWall[0];
        enemy.x = next.x;
        enemy.y = next.y;

        /* ===== 壁の隣に到達したら爆弾設置 ===== */
        if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

          if (!bombs.some(b => b.owner === "enemy") &&
              bombs.filter(b => b.owner === "enemy").length < enemyStats.maxBombs) {

            // 爆弾を置く前に「爆風シミュレーション」で安全確認
            if (hasSafeEscapeRouteFromBomb(enemy.x, enemy.y)) {

              // 爆弾設置
              bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });

              // 爆風外の安全地帯へ逃げる
              const explosion = simulateExplosion(enemy.x, enemy.y, enemyStats.firePower);
              const safeMoves = DIRS
                .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
                .filter(p =>
                  canMove(p.x, p.y) &&
                  !explosion.has(`${p.x},${p.y}`)
                );

              if (safeMoves.length > 0) {
                const escape = safeMoves[Math.floor(Math.random() * safeMoves.length)];
                enemy.x = escape.x;
                enemy.y = escape.y;
              }
            }
          }
        }

        return;
      }

      /* ===== A* が失敗した場合（停止防止フォールバック） ===== */
      const dx = Math.sign(wall.x - enemy.x);
      const dy = Math.sign(wall.y - enemy.y);

      const nx = enemy.x + dx;
      const ny = enemy.y + dy;

      if (canMove(nx, ny)) {
        enemy.x = nx;
        enemy.y = ny;
      }

      return;
    }
  }

  /* ===== 5. 目的がないときは待機 ===== */
  return;
}
