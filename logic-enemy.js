function enemyAI() {
  if (!enemy.alive) return;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  /* ===== 1. 危険回避（最低限） ===== */
  const danger = dangerTiles();
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    const safeMoves = DIRS
      .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
      .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));

    if (safeMoves.length > 0) {
      const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
      return;
    }
  }

  /* ===== 2. アイテム探索（あれば向かう） ===== */
  const visibleItems = items.filter(it => it.visible);
  if (visibleItems.length > 0) {
    const target = visibleItems[0];
    const path = findPath(enemy, target);

    if (path && path.length > 0) {
      const next = path[0];
      enemy.x = next.x;
      enemy.y = next.y;
      return;
    }
  }

  /* ===== 3. 壁破壊モード（開始直後は必ずこれが動く） ===== */
  let wall = findBreakableWallTowardsPlayer();
  if (!wall) wall = findNearestBreakableWall(enemy);

  if (wall) {
    // 壁に最も近づく方向へ進む（A* が通らなくても必ず動く）
    const dx = Math.sign(wall.x - enemy.x);
    const dy = Math.sign(wall.y - enemy.y);

    const nx = enemy.x + dx;
    const ny = enemy.y + dy;

    if (canMove(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
      return;
    }

    // もし正面が塞がっていたら、左右どちらかに回り込む
    const sideMoves = [
      { x: enemy.x + dy,     y: enemy.y + dx },   // 右回り
      { x: enemy.x - dy,     y: enemy.y - dx }    // 左回り
    ];

    for (const m of sideMoves) {
      if (canMove(m.x, m.y)) {
        enemy.x = m.x;
        enemy.y = m.y;
        return;
      }
    }
  }

  /* ===== 4. プレイヤー追跡（最後の手段） ===== */
  const chase = findPath(enemy, player);
  if (chase && chase.length > 0) {
    const next = chase[0];
    enemy.x = next.x;
    enemy.y = next.y;
    return;
  }

  /* ===== 5. それでも動けない場合はランダム移動（完全停止防止） ===== */
  const moves = DIRS
    .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
    .filter(p => canMove(p.x, p.y));

  if (moves.length > 0) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    enemy.x = m.x;
    enemy.y = m.y;
  }
}
