const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

/* ============================================================
   ゲーム開始フラグ（タイトル画面からスタート）
   ============================================================ */
let gameStarted = false;
let gamePaused = false;

document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("titleScreen").style.display = "none";
    gameStarted = true;
    loop();
});

/* ============================================================
   ステージ生成（固い壁は一個飛ばし、壊せる壁は5パターン）
   ============================================================ */
function generateStage(pattern5x5) {
    const stage = [];

    for (let y = 0; y < ROWS; y++) {
        stage[y] = [];
        for (let x = 0; x < COLS; x++) {

            if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
                stage[y][x] = 1;
                continue;
            }

            if (y % 2 === 0 && x % 2 === 0) {
                stage[y][x] = 1;
                continue;
            }

            const py = Math.floor(y / 3);
            const px = Math.floor(x / 3);
            const v = pattern5x5[py][px];

            stage[y][x] = (v === 2 ? 2 : 0);
        }
    }

    stage[1][1] = stage[1][2] = stage[2][1] = 0;
    stage[13][13] = stage[13][12] = stage[12][13] = 0;

    return stage;
}

/* ============================================================
   ステージ 5 パターン
   ============================================================ */
const stages = [
    generateStage([
        [3,3,3,3,3],
        [3,2,0,2,3],
        [3,0,2,0,3],
        [3,2,0,2,3],
        [3,3,3,3,3]
    ]),
    generateStage([
        [3,2,0,2,3],
        [2,0,2,0,2],
        [0,2,0,2,0],
        [2,0,2,0,2],
        [3,2,0,2,3]
    ]),
    generateStage([
        [3,0,2,0,3],
        [0,2,0,2,0],
        [2,0,2,0,2],
        [0,2,0,2,0],
        [3,0,2,0,3]
    ]),
    generateStage([
        [3,2,2,2,3],
        [2,0,0,0,2],
        [2,0,2,0,2],
        [2,0,0,0,2],
        [3,2,2,2,3]
    ]),
    generateStage([
        [3,0,0,0,3],
        [0,2,2,2,0],
        [0,2,0,2,0],
        [0,2,2,2,0],
        [3,0,0,0,3]
    ])
];

let currentStage = 0;
let map = JSON.parse(JSON.stringify(stages[currentStage]));

/* ============================================================
   プレイヤー・敵・爆弾
   ============================================================ */
let player = { x: 1, y: 1 };
let enemy = { x: 13, y: 13, alive: true };

let bombs = [];
let explosions = [];

/* ============================================================
   メッセージボックス（You Win / You Lose）
   ============================================================ */
function showMessage(text, callback) {
    const box = document.getElementById("messageBox");
    const msg = document.getElementById("messageText");
    const retry = document.getElementById("retryButton");

    msg.textContent = text;
    box.classList.remove("hidden");

    gamePaused = true;

    setTimeout(() => {
        box.classList.add("show");
    }, 10);

    function close() {
        box.classList.remove("show");
        setTimeout(() => {
            box.classList.add("hidden");
            retry.removeEventListener("click", close);
            callback();
            gamePaused = false;
            loop();
        }, 300);
    }

    retry.addEventListener("click", close);
}

/* ============================================================
   キー入力（1クリック＝1マス移動）
   ============================================================ */
let keyPressed = {};
document.addEventListener("keydown", e => {
    if (!gameStarted || gamePaused) return;

    if (!keyPressed[e.key]) {
        keyPressed[e.key] = true;
        handleKeyPress(e.key);
    }
});
document.addEventListener("keyup", e => {
    keyPressed[e.key] = false;
});

function handleKeyPress(key) {
    let nx = player.x;
    let ny = player.y;

    if (key === "ArrowUp") ny--;
    if (key === "ArrowDown") ny++;
    if (key === "ArrowLeft") nx--;
    if (key === "ArrowRight") nx++;

    if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }

    if (key === " " && !bombs.find(b => b.owner === "player")) {
        bombs.push({ x: player.x, y: player.y, timer: 120, owner: "player" });
    }
}

/* ============================================================
   通行判定（壁・爆弾・マップ外）
   ============================================================ */
function canMove(x, y) {
    if (!map[y] || map[y][x] === undefined) return false;
    if (map[y][x] === 1 || map[y][x] === 2) return false;
    if (bombs.find(b => b.x === x && b.y === y)) return false;
    return true;
}

/* ============================================================
   爆風範囲（距離2マス・固い壁で遮断）
   ============================================================ */
function getExplosionTiles(b) {
    if (!b) return [];
    let tiles = [{ x: b.x, y: b.y }];

    let dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    for (let d of dirs) {
        for (let i = 1; i <= 2; i++) {
            let nx = b.x + d.x * i;
            let ny = b.y + d.y * i;
            if (!map[ny] || map[ny][nx] === undefined) break;
            tiles.push({ x: nx, y: ny });
            if (map[ny][nx] === 1) break;
        }
    }

    return tiles;
}

/* ============================================================
   危険タイルセット（爆風＋爆弾）
   ============================================================ */
function getDangerTiles() {
    let set = new Set();
    bombs.forEach(b => {
        set.add(`${b.x},${b.y}`);
        getExplosionTiles(b).forEach(t => set.add(`${t.x},${t.y}`));
    });
    return set;
}

/* ============================================================
   爆弾処理（爆発・勝敗判定）
   ============================================================ */
function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        let b = bombs[i];
        b.timer--;

        if (b.timer <= 0) {
            let tiles = getExplosionTiles(b);
            explosions.push({ tiles, timer: 60 });

            tiles.forEach(e => {
                if (map[e.y] && map[e.x] === 2) map[e.y][e.x] = 0;
            });

            tiles.forEach(e => {
                if (player.x === e.x && player.y === e.y) {
                    showMessage("You Lose…", () => resetStage());
                }
            });

            tiles.forEach(e => {
                if (enemy.x === e.x && enemy.y === e.y) enemy.alive = false;
            });

            bombs.splice(i, 1);
        }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer--;
        if (explosions[i].timer <= 0) explosions.splice(i, 1);
    }
}

/* ============================================================
   ステージリセット
   ============================================================ */
function resetStage() {
    map = JSON.parse(JSON.stringify(stages[currentStage]));
    player = { x: 1, y: 1 };
    enemy = { x: 13, y: 13, alive: true };
    bombs = [];
    explosions = [];
    enemyCooldown = 0;
}

/* ============================================================
   ステージクリア判定
   ============================================================ */
function checkStageClear() {
    if (!enemy.alive) {
        showMessage("You Win!", () => {
            let prev = currentStage;
            do {
                currentStage = Math.floor(Math.random() * stages.length);
            } while (currentStage === prev);
            resetStage();
        });
    }
}

/* ============================================================
   CPU 敵 AI（改良版：爆弾・爆風・壁を避ける）
   ============================================================ */
let enemyCooldown = 0;

function enemyAI() {
    if (!enemy.alive || gamePaused) return;

    if (enemyCooldown > 0) {
        enemyCooldown--;
        return;
    }
    enemyCooldown = 12 + Math.floor(Math.random() * 6);

    const danger = getDangerTiles();
    const ek = `${enemy.x},${enemy.y}`;
    const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    // 爆風・爆弾回避
    if (danger.has(ek)) {
        let safeMoves = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
            .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));
        if (safeMoves.length > 0) {
            let move = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            enemy.x = move.x;
            enemy.y = move.y;
            return;
        }
    }

    // 壊せる壁の横にいる場合、爆弾を置く
    let breakableDirs = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
        .filter(p => map[p.y] && map[p.y][p.x] === 2);
    if (breakableDirs.length > 0 && !bombs.find(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
        return;
    }

    // プレイヤー追跡（安全タイルのみ）
    let targetMoves = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
        .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));
    
    if (targetMoves.length > 0) {
        targetMoves.sort((a, b) => {
            let da = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
            let db = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
            return da - db;
        });
        enemy.x = targetMoves[0].x;
        enemy.y = targetMoves[0].y;
        return;
    }

    // それ以外は安全なランダム移動
    let safeDirs = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
        .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));
    if (safeDirs.length > 0) {
        let move = safeDirs[Math.floor(Math.random() * safeDirs.length)];
        enemy.x = move.x;
        enemy.y = move.y;
    }
}

/* ============================================================
   描画
   ============================================================ */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "#666";
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
                ctx.strokeStyle = "#999";
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            }
            if (map[y][x] === 2) {
                ctx.fillStyle = "#A66";
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
                ctx.strokeStyle = "#D99";
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            }
        }
    }

    bombs.forEach(b => {
        let cx = b.x * TILE + TILE / 2;
        let cy = b.y * TILE + TILE / 2;

        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 8);
        ctx.lineTo(cx + 8, cy + 8);
        ctx.stroke();
    });

    explosions.forEach(ex => {
        ex.tiles.forEach(e => {
            let cx = e.x * TILE + TILE / 2;
            let cy = e.y * TILE + TILE / 2;

            let gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 20);
            gradient.addColorStop(0, "yellow");
            gradient.addColorStop(1, "orange");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    drawCharacter(player.x, player.y, "cyan");
    if (enemy.alive) drawCharacter(enemy.x, enemy.y, "red");
}

function drawCharacter(x, y, color) {
    let cx = x * TILE + TILE / 2;
    let cy = y * TILE + TILE / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // ぷよ目（大きめ白目＋小黒目）
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 6, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
    ctx.fill();
}

/* ============================================================
   メインループ
   ============================================================ */
function loop() {
    if (!gameStarted || gamePaused) return;

    enemyAI();
    updateBombs();
    checkStageClear();
    draw();
    requestAnimationFrame(loop);
}
