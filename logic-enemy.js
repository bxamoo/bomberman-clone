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
    const moves = DIRS
      .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
      .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));

    if (moves.length > 0) {
      const m = moves[Math.floor(Math.random() * moves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
      return;
    }
  }

  /* ===== 壁を探す（null でも動くようにする） ===== */
  let wall = findBreakableWallTowardsPlayer();
  if (!wall) wall = findNearestBreakableWall(enemy);

  /* ===== 壁が見つからない場合でも動く ===== */
  if (!wall) {
    // とりあえず右方向へ進む（停止防止）
    const fallbackMoves = DIRS
      .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
      .filter(p => canMove(p.x, p.y));

    if (fallbackMoves.length > 0) {
      const m = fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
      enemy.x = m.x;
      enemy.y = m.y;
    }

    return;
  }

  /* ===== 壁に向かう ===== */
  const dx = Math.sign(wall.x - enemy.x);
  const dy = Math.sign(wall.y - enemy.y);

  const nx = enemy.x + dx;
  const ny = enemy.y + dy;

  // 壁の隣に来たら爆弾
  if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

    if (!bombs.some(b => b.owner === "enemy")) {
      const bx = enemy.x;
      const by = enemy.y;

      bombs.push({ x: bx, y: by, timer: 120, owner: "enemy" });

      // 爆弾の位置から逃げる
      const explosion = simulateExplosion(bx, by, enemyStats.firePower);
      const safeMoves = DIRS
        .map(([dx, dy]) => ({ x: enemy.x + dx, y: enemy.y + dy }))
        .filter(p => canMove(p.x, p.y) && !explosion.has(`${p.x},${p.y}`));

      if (safeMoves.length > 0) {
        const m = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        enemy.x = m.x;
        enemy.y = m.y;
      }

      return;
    }
  }

  // 壁に近づく
  if (canMove(nx, ny)) {
    enemy.x = nx;
    enemy.y = ny;
    return;
  }

  // 回り込み
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
