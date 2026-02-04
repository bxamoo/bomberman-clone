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
      neighbors.sort((a, b) => {
        const da = Math.abs(a.x - enemy.x) + Math.abs(a.y - enemy.y);
        const db = Math.abs(b.x - enemy.x) + Math.abs(b.y - enemy.y);
        return da - db;
      });

      const target = neighbors[0];
      const pathToWall = findPath(enemy, target);

      if (pathToWall && pathToWall.length > 0) {
        const next = pathToWall[0];
        enemy.x = next.x;
        enemy.y = next.y;

        // 壁の隣に到達したら爆弾設置
        if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

          if (!bombs.some(b => b.owner === "enemy") &&
              bombs.filter(b => b.owner === "enemy").length < enemyStats.maxBombs) {

            // 爆弾を置く前に逃げ道チェック
            const dangerNow = dangerTiles();
            const safeMoves = DIRS
              .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
              .filter(p =>
                canMove(p.x, p.y) &&
                !dangerNow.has(`${p.x},${p.y}`)
              );

            if (safeMoves.length > 0) {
              bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });

              // 即逃げる
              const escape = safeMoves[Math.floor(Math.random() * safeMoves.length)];
              enemy.x = escape.x;
              enemy.y = escape.y;
            }
          }
        }

        return;
      }
    }
  }

  /* ===== 5. ランダム移動 ===== */
  const moves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
    .filter(p => canMove(p.x, p.y));

  if (moves.length) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
  }
}
