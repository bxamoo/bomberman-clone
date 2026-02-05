/* =========================================================
   ぬるっと移動（補間）
========================================================= */
function smoothMove(entity) {
  const targetX = entity.x * TILE;
  const targetY = entity.y * TILE;

  const dx = targetX - entity.renderX;
  const dy = targetY - entity.renderY;

  // 横移動が大きい → 横だけ補間
  if (Math.abs(dx) > Math.abs(dy)) {
    entity.renderX += dx * 0.25;
    entity.renderY = targetY; // ← Y は固定
  }
  // 縦移動が大きい → 縦だけ補間
  else {
    entity.renderY += dy * 0.25;
    entity.renderX = targetX; // ← X は固定
  }
}

/* =========================================================
   壁（メタル風）
========================================================= */
function drawSolidWall(x, y) {
  const px = x * TILE;
  const py = y * TILE;

  const g = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  g.addColorStop(0, "#bfbfbf");
  g.addColorStop(1, "#6b6b6b");

  ctx.fillStyle = g;
  ctx.fillRect(px, py, TILE, TILE);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, TILE, TILE);
}

/* =========================================================
   壊せる壁（レンガ模様）
========================================================= */
function drawBreakableWall(x, y) {
  const px = x * TILE;
  const py = y * TILE;

  // ベース色
  const g = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  g.addColorStop(0, "#c05a2f");
  g.addColorStop(1, "#8b3e2f");

  ctx.fillStyle = g;
  ctx.fillRect(px, py, TILE, TILE);

  // 横線（レンガ段）
  ctx.strokeStyle = "#5c2c1d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py + TILE * 0.33);
  ctx.lineTo(px + TILE, py + TILE * 0.33);
  ctx.moveTo(px, py + TILE * 0.66);
  ctx.lineTo(px + TILE, py + TILE * 0.66);
  ctx.stroke();

  // 縦線（レンガ区切り）
  ctx.beginPath();
  ctx.moveTo(px + TILE * 0.5, py);
  ctx.lineTo(px + TILE * 0.5, py + TILE * 0.33);

  ctx.moveTo(px + TILE * 0.25, py + TILE * 0.33);
  ctx.lineTo(px + TILE * 0.25, py + TILE * 0.66);

  ctx.moveTo(px + TILE * 0.75, py + TILE * 0.66);
  ctx.lineTo(px + TILE * 0.75, py + TILE);
  ctx.stroke();
}

/* =========================================================
   キャラ（chibi ボンバーマン風）
========================================================= */
function drawChar(px, py, color, outline) {
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;

  // 体（小さめ）
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 顔（大きめ）
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 目（白）
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // 黒目
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 2, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  // 手
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 4);
  ctx.lineTo(cx - 16, cy + 4);
  ctx.moveTo(cx + 10, cy + 4);
  ctx.lineTo(cx + 16, cy + 4);
  ctx.stroke();

  // 足
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 14);
  ctx.lineTo(cx - 6, cy + 20);
  ctx.moveTo(cx + 6, cy + 14);
  ctx.lineTo(cx + 6, cy + 20);
  ctx.stroke();
}

/* =========================================================
   爆弾（光沢つき）
========================================================= */
function drawBomb(b) {
  const cx = b.x * TILE + TILE / 2;
  const cy = b.y * TILE + TILE / 2;

  // 光沢グラデーション
  const g = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, 14);
  g.addColorStop(0, "#444");
  g.addColorStop(1, "#000");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // ハイライト
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 6, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 導火線
  ctx.strokeStyle = "brown";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 8);
  ctx.lineTo(cx + 14, cy - 14);
  ctx.stroke();

  // 火花
  ctx.fillStyle = Math.random() < 0.5 ? "yellow" : "orange";
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 14, 4, 0, Math.PI * 2);
  ctx.fill();
}

/* =========================================================
   爆風（本家風・中心が強く光る）
========================================================= */
function drawExplosionTile(x, y) {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  g.addColorStop(0, "#fff6a0");
  g.addColorStop(0.3, "#ffd000");
  g.addColorStop(0.7, "#ff7b00");
  g.addColorStop(1, "transparent");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
}

/* =========================================================
   アイテム（fire / speed / bomb）
========================================================= */
function drawItemFire(x, y) {
  const px = x * TILE;
  const py = y * TILE;

  // 背景（水色の四角）
  const bg = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  bg.addColorStop(0, "#4fc3f7");
  bg.addColorStop(1, "#0288d1");

  ctx.fillStyle = bg;
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);

  ctx.strokeStyle = "#01579b";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);

  // 丸っこい火の玉
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;

  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12);
  g.addColorStop(0, "#fff6a0");
  g.addColorStop(0.3, "#ffd000");
  g.addColorStop(0.7, "#ff7b00");
  g.addColorStop(1, "#d84315");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 火の揺らぎ（ちょっとだけ尖らせる）
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.quadraticCurveTo(cx + 6, cy - 6, cx, cy);
  ctx.quadraticCurveTo(cx - 6, cy - 6, cx, cy - 12);
  ctx.fill();
}

function drawItemBomb(x, y) {
  const px = x * TILE;
  const py = y * TILE;

  // 背景（緑の四角）
  const bg = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  bg.addColorStop(0, "#66bb6a");
  bg.addColorStop(1, "#2e7d32");

  ctx.fillStyle = bg;
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);

  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);

  // 爆弾（本体）
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;

  const g = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 12);
  g.addColorStop(0, "#555");
  g.addColorStop(1, "#000");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  // ハイライト
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 5, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 導火線
  ctx.strokeStyle = "brown";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 6);
  ctx.lineTo(cx + 12, cy - 12);
  ctx.stroke();

  // 火花
  ctx.fillStyle = Math.random() < 0.5 ? "yellow" : "orange";
  ctx.beginPath();
  ctx.arc(cx + 12, cy - 12, 3, 0, Math.PI * 2);
  ctx.fill();
}

/* =========================================================
   描画メイン
========================================================= */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 壁
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 1) drawSolidWall(x, y);
      else if (map[y][x] === 2) drawBreakableWall(x, y);
    }
  }

  // アイテム
  items.forEach(item => {
    if (!item.visible) return;

    if (item.type === "fire") drawItemFire(item.x, item.y);
    if (item.type === "bomb") drawItemBomb(item.x, item.y);
  });

  // 爆弾
  bombs.forEach(b => drawBomb(b));

  // 爆風
  explosions.forEach(e =>
    e.tiles.forEach(t => drawExplosionTile(t.x, t.y))
  );

  // キャラ（ぬるっと移動）
  drawChar(player.renderX, player.renderY, "#3498db", "#1f4e78");
  if (enemy.alive) drawChar(enemy.renderX, enemy.renderY, "#e74c3c", "#922b21");
}

/* =========================================================
   ゲーム終了
========================================================= */
function endGame(text) {
  gameOver = true;
  gamePaused = true;
  messageText.textContent = text;
  messageBox.classList.remove("hidden");
}

/* =========================================================
   ゲームループ
========================================================= */
function gameLoop() {
  if (!gameStarted || gamePaused || gameOver) return;

  updateBombs();
  updateItems();
  enemyAI();

  // ぬるっと移動
  smoothMove(player);
  smoothMove(enemy);

  draw();

  if (!enemy.alive && !gameOver) endGame("You Win!");

  requestAnimationFrame(gameLoop);
}

/* =========================================================
   UI
========================================================= */
startButton.onclick = () => {
  messageBox.classList.add("hidden");
  startGame();
};

retryButton.onclick = () => {
  messageBox.classList.add("hidden");
  startGame();
};
