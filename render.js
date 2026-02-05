/* ===== 壁（メタル風） ===== */
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

/* ===== 壊せる壁（レンガ風） ===== */
function drawBreakableWall(x, y) {
  const px = x * TILE;
  const py = y * TILE;

  // ベースのレンガ色
  const g = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  g.addColorStop(0, "#c05a2f");
  g.addColorStop(1, "#8b3e2f");

  ctx.fillStyle = g;
  ctx.fillRect(px, py, TILE, TILE);

  // レンガの溝（横線）
  ctx.strokeStyle = "#5c2c1d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py + TILE * 0.33);
  ctx.lineTo(px + TILE, py + TILE * 0.33);
  ctx.moveTo(px, py + TILE * 0.66);
  ctx.lineTo(px + TILE, py + TILE * 0.66);
  ctx.stroke();

  // レンガの溝（縦線）
  ctx.beginPath();
  ctx.moveTo(px + TILE * 0.5, py);
  ctx.lineTo(px + TILE * 0.5, py + TILE * 0.33);

  ctx.moveTo(px + TILE * 0.25, py + TILE * 0.33);
  ctx.lineTo(px + TILE * 0.25, py + TILE * 0.66);

  ctx.moveTo(px + TILE * 0.75, py + TILE * 0.66);
  ctx.lineTo(px + TILE * 0.75, py + TILE);
  ctx.stroke();
}

/* ===== キャラ描画（chibi ボンバーマン風） ===== */
function drawChar(px, py, color, outline) {
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;

  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 白目
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 4, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // 黒目
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 2, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();
}

/* ===== 導火線つき爆弾 ===== */
function drawBomb(b) {
  const cx = b.x * TILE + TILE / 2;
  const cy = b.y * TILE + TILE / 2;

  // 本体の光沢グラデーション
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

/* ===== 爆風（十字型の炎） ===== */
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

/* ===== 描画メイン ===== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 1) drawSolidWall(x, y);      // 固定壁
      else if (map[y][x] === 2) drawBreakableWall(x, y); // 壊せる壁
    }
  }

  // アイテム
  items.forEach(item => {
    if (!item.visible) return;
    const cx = item.x * TILE + 16;
    const cy = item.y * TILE + 16;

    ctx.fillStyle = item.type === "fire" ? "yellow" : "blue";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // 爆弾
  bombs.forEach(b => drawBomb(b));

  // 爆風
  explosions.forEach(e =>
    e.tiles.forEach(t => drawExplosionTile(t.x, t.y))
  );

  // キャラ
drawChar(player.renderX, player.renderY, "#3498db", "#1f4e78");
if (enemy.alive) drawChar(enemy.renderX, enemy.renderY, "#e74c3c", "#922b21");
}

/* ===== ゲーム終了 ===== */
function endGame(text) {
  gameOver = true;
  gamePaused = true;
  messageText.textContent = text;
  messageBox.classList.remove("hidden");
}

/* ===== ゲームループ ===== */
function gameLoop() {
  if (!gameStarted || gamePaused || gameOver) return;

  updateBombs();
  updateItems();
  smoothMove(player);
  smoothMove(enemy);
  enemyAI();
  draw();

  if (!enemy.alive && !gameOver) endGame("You Win!");

  requestAnimationFrame(gameLoop);
}

function smoothMove(entity) {
  const targetX = entity.x * TILE;
  const targetY = entity.y * TILE;

  // 0.25 は補間率（小さいほどゆっくり）
  entity.renderX += (targetX - entity.renderX) * 0.25;
  entity.renderY += (targetY - entity.renderY) * 0.25;
}

/* ===== UI ===== */
startButton.onclick = () => {
  messageBox.classList.add("hidden");
  startGame();
};

retryButton.onclick = () => {
  messageBox.classList.add("hidden");
  startGame();
};
