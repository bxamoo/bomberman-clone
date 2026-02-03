const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;
const DIRS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];

let gameStarted = false;
let gamePaused = false;
let animationId = null;

/* ================= 開始 ================= */

document.getElementById("startButton").onclick = () => {
    document.getElementById("titleScreen").style.display = "none";
    gameStarted = true;
    loop();
};

/* ================= ステージ ================= */

function generateStage(pattern) {
    const stage = [];
    for (let y = 0; y < ROWS; y++) {
        stage[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (y === 0 || x === 0 || y === ROWS - 1 || x === COLS - 1) {
                stage[y][x] = 1;
            } else if (y % 2 === 0 && x % 2 === 0) {
                stage[y][x] = 1;
            } else {
                stage[y][x] =
                    pattern[Math.floor(y / 3)][Math.floor(x / 3)] === 2 ? 2 : 0;
            }
        }
    }
    stage[1][1] = stage[1][2] = stage[2][1] = 0;
    stage[13][13] = stage[12][13] = stage[13][12] = 0;
    return stage;
}

const stages = [
    generateStage([[3,3,3,3,3],[3,2,0,2,3],[3,0,2,0,3],[3,2,0,2,3],[3,3,3,3,3]]),
    generateStage([[3,2,0,2,3],[2,0,2,0,2],[0,2,0,2,0],[2,0,2,0,2],[3,2,0,2,3]])
];

let currentStage = 0;
let map;

/* ================= 状態 ================= */

let player, enemy, bomb, explosions;
let enemyCooldown = 0;
let lookX = 0, lookY = 1;

function resetStage() {
    map = JSON.parse(JSON.stringify(stages[currentStage]));
    player = { x: 1, y: 1 };
    enemy = { x: 13, y: 13, alive: true };
    bomb = null;
    explosions = [];
    enemyCooldown = 0;
}

resetStage();

/* ================= 入力 ================= */

document.addEventListener("keydown", e => {
    if (!gameStarted || gamePaused) return;

    let nx = player.x;
    let ny = player.y;

    if (e.key === "ArrowUp") { ny--; lookX = 0; lookY = -1; }
    if (e.key === "ArrowDown") { ny++; lookX = 0; lookY = 1; }
    if (e.key === "ArrowLeft") { nx--; lookX = -1; lookY = 0; }
    if (e.key === "ArrowRight") { nx++; lookX = 1; lookY = 0; }

    if (map[ny]?.[nx] === 0) {
        player.x = nx;
        player.y = ny;
    }

    if (e.key === " " && !bomb) {
        bomb = { x: player.x, y: player.y, timer: 60 };
    }
});

/* ================= 爆弾 ================= */

function getExplosionTiles(b) {
    let tiles = [{ x: b.x, y: b.y }];
    for (let d of DIRS) {
        for (let i = 1; i <= 2; i++) {
            let nx = b.x + d.x * i;
            let ny = b.y + d.y * i;
            if (!map[ny] || map[ny][nx] === 1) break;
            tiles.push({ x: nx, y: ny });
            if (map[ny][nx] === 2) break;
        }
    }
    return tiles;
}

function updateBomb() {
    if (!bomb || gamePaused) return;
    bomb.timer--;

    if (bomb.timer <= 0) {
        explosions = getExplosionTiles(bomb);

        for (let e of explosions) {
            if (map[e.y][e.x] === 2) map[e.y][e.x] = 0;
            if (player.x === e.x && player.y === e.y) lose();
            if (enemy.alive && enemy.x === e.x && enemy.y === e.y) enemy.alive = false;
        }

        bomb = null;
        setTimeout(() => explosions = [], 300);
    }
}

/* ================= 敵AI ================= */

function updateEnemy() {
    if (!enemy.alive || gamePaused) return;

    if (enemyCooldown-- > 0) return;
    enemyCooldown = 20;

    let dx = Math.abs(enemy.x - player.x);
    let dy = Math.abs(enemy.y - player.y);

    if (!bomb && dx + dy <= 3) {
        bomb = { x: enemy.x, y: enemy.y, timer: 60 };
        return;
    }

    let best = null;
    let bestDist = Infinity;

    for (let d of DIRS) {
        let nx = enemy.x + d.x;
        let ny = enemy.y + d.y;
        if (map[ny]?.[nx] === 0) {
            let dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
            if (dist < bestDist) {
                bestDist = dist;
                best = { x: nx, y: ny };
            }
        }
    }

    if (best) {
        enemy.x = best.x;
        enemy.y = best.y;
    }
}

/* ================= 勝敗 ================= */

function showMessage(text, cb) {
    gamePaused = true;
    cancelAnimationFrame(animationId);

    const box = document.getElementById("messageBox");
    document.getElementById("messageText").textContent = text;
    box.classList.remove("hidden");

    setTimeout(() => box.classList.add("show"), 10);

    document.getElementById("retryButton").onclick = () => {
        box.classList.remove("show");
        setTimeout(() => {
            box.classList.add("hidden");
            cb();
            gamePaused = false;
            loop();
        }, 300);
    };
}

function lose() {
    showMessage("You Lose…", resetStage);
}

function win() {
    showMessage("You Win!", () => {
        currentStage = (currentStage + 1) % stages.length;
        resetStage();
    });
}

/* ================= 描画 ================= */

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawEyes(cx, cy, dx, dy) {
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    const ex = 5, ey = -3;

    for (let side of [-1, 1]) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(cx + ex * side, cy + ey, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(
            cx + ex * side + dx * 1.5,
            cy + ey + dy * 1.5,
            1.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) ctx.fillStyle = "#666";
            if (map[y][x] === 2) ctx.fillStyle = "#A66";
            if (map[y][x]) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
    }

    if (bomb)
        drawCircle(bomb.x * TILE + 16, bomb.y * TILE + 16, 12, "black");

    explosions.forEach(e =>
        drawCircle(e.x * TILE + 16, e.y * TILE + 16, 18, "orange")
    );

    const pcx = player.x * TILE + 16;
    const pcy = player.y * TILE + 16;
    drawCircle(pcx, pcy, 14, "cyan");
    drawEyes(pcx, pcy, lookX, lookY);

    if (enemy.alive) {
        const ecx = enemy.x * TILE + 16;
        const ecy = enemy.y * TILE + 16;
        drawCircle(ecx, ecy, 14, "red");
        drawEyes(ecx, ecy, player.x - enemy.x, player.y - enemy.y);
    }
}

/* ================= ループ ================= */

function loop() {
    if (!gameStarted || gamePaused) return;
    updateEnemy();
    updateBomb();
    if (!enemy.alive) win();
    draw();
    animationId = requestAnimationFrame(loop);
}
