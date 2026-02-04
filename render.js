/* ===== キャラ描画（目つき） ===== */
function drawChar(x, y, color) {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;

  // 体
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  // 白目
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 4, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // 黒目（くりくり）
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

  // 本体
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // 導火線
  ctx.strokeStyle = "brown";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 8);
  ctx.lineTo(cx + 14, cy - 14);
  ctx.stroke();

  // 火花（点滅アニメーション）
  ctx.fillStyle = Math.random() < 0.5 ? "yellow" : "orange";
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 14, 4, 0, Math.PI * 2);
  ctx.fill();
}

/* ===== 描画メイン ===== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 1) ctx.fillStyle = "#666";   // 固定壁
      if (map[y][x] === 2) ctx.fillStyle = "#a66";   // 壊せる壁
      if (map[y][x]) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // アイテム
  items.forEach(item => {
    if (!item.visible) return;
    ctx.fillStyle = item.type === "fire" ? "yellow" : "blue";
    ctx.beginPath();
    ctx.arc(item.x * TILE + 16, item.y * TILE + 16, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // 爆弾（導火線つき）
  bombs.forEach(b => drawBomb(b));

  // 爆風
  explosions.forEach(e =>
    e.tiles.forEach(t => {
      const cx = t.x * TILE + 16;
      const cy = t.y * TILE + 16;
      const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 20);
      g.addColorStop(0, "yellow");
      g.addColorStop(1, "orange");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    })
  );

  // キャラ
  drawChar(player.x, player.y, "cyan");
  if (enemy.alive) drawChar(enemy.x, enemy.y, "red");
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
  enemyAI();
  draw();

  if (!enemy.alive && !gameOver) endGame("You Win!");

  requestAnimationFrame(gameLoop);
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
