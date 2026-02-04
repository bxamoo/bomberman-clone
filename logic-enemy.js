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

  // プレイヤー方向に壁がない → 最も近い壊せる壁を探す
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

    /* ===== 爆弾設置 → 即回避（自爆防止） ===== */
    if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

      // すでに爆弾があるなら置かない
      if (!bombs.some(b => b.owner === "enemy")) {

        // 爆弾を置く前に逃げ道を確認
        const dangerNow = dangerTiles();
        const safeMoves = DIRS
          .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
          .filter(p =>
            canMove(p.x, p.y) &&
            !dangerNow.has(`${p.x},${p.y}`)
          );

        // 逃げ道がない → 爆弾を置かない（自爆防止）
        if (safeMoves.length === 0) {
          return;
        }

        // 爆弾設置
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });

        // 爆弾を置いた瞬間に安全地帯へ逃げる
        const escape = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        enemy.x = escape.x;
        enemy.y = escape.y;
      }

      return;
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
