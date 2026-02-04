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

  if (!wall) {
    wall = findNearestBreakableWall(enemy);
  }

  if (wall) {
    const dx = Math.sign(wall.x - enemy.x);
    const dy = Math.sign(wall.y - enemy.y);

    const nx = enemy.x + dx;
    const ny = enemy.y + dy;

    if (canMove(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
    }

    if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {
      if (!bombs.some(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
      }
    }

    return;
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
