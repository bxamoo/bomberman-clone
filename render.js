function drawChar(x, y, color) {
  const cx = x * TILE + TILE / 2;
  const cy = y * TILE + TILE / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === 1) ctx.fillStyle = "#666";
      if (map[y][x] === 2) ctx.fillStyle = "#a66";
      if (map[y][x]) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  bombs.forEach(b => {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(b.x * TILE + 16, b.y * TILE + 16, 12, 0, Math.PI * 2);
    ctx.fill();
  });

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

  drawChar(player.x, player.y, "cyan");
  if (enemy.alive) drawChar(enemy.x, enemy.y, "red");
}

function endGame(text) {
  gameOver = true;
  gamePaused = true;
  messageText.textContent = text;
  messageBox.classList.remove("hidden");
}

/* UI */
startButton.onclick = () => {
  messageBox.classList.add("hidden");
  startGame();
};

retryButton.onclick = () => {
  messageBox.classList.add("hidden");
  resetStage();
};
