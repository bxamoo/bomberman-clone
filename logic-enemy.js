/* ===== 爆風範囲を計算 ===== */
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

/* ===== 爆弾から逃げる（爆弾位置 bx,by を基準に、敵の位置から逃げる） ===== */
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

/* ===== 壁破壊AI（メインループ） ===== */
function enemyAI() {
  if (!enemy.alive) return;

  if (enemyCooldown > 0) {
    enemyCooldown--;
    return;
  }
  enemyCooldown = 10;

  /* ===== 1. 爆風にいたら逃げる ===== */
  const danger = dangerTiles();
  if (danger.has(`${enemy.x},${enemy.y}`)) {
    // 直近の敵爆弾を探す
    const enemyBomb = bombs.find(b => b.owner === "enemy");
    if (enemyBomb) {
      escapeFromBomb(enemyBomb.x, enemyBomb.y);
      return;
    }
  }

  /* ===== 2. 壊せる壁を探す（最優先） ===== */
  let wall = findBreakableWallTowardsPlayer();
  if (!wall) wall = findNearestBreakableWall(enemy);

  if (wall) {
    const dx = Math.sign(wall.x - enemy.x);
    const dy = Math.sign(wall.y - enemy.y);

    const nx = enemy.x + dx;
    const ny = enemy.y + dy;

    /* ===== 2-1. 壁の隣に来たら爆弾設置 ===== */
    if (Math.abs(enemy.x - wall.x) + Math.abs(enemy.y - wall.y) === 1) {

      // 敵の爆弾がまだない場合のみ設置
      if (!bombs.some(b => b.owner === "enemy")) {

        const bombX = enemy.x;
        const bombY = enemy.y;

        // 爆弾設置
        bombs.push({ x: bombX, y: bombY, timer: 120, owner: "enemy" });

        // 爆弾の位置を基準に逃げる（ここが重要）
        escapeFromBomb(bombX, bombY);
        return;
      }
    }

    /* ===== 2-2. 壁に近づく（A* が通らなくても必ず動く） ===== */
    if (canMove(nx, ny)) {
      enemy.x = nx;
      enemy.y = ny;
      return;
    }

    // 正面が塞がっていたら左右に回り込む
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

    return;
  }

  /* ===== 3. 壁がない場合は待機 ===== */
  return;
}
