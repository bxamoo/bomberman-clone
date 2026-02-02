const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

// プレイヤー
let player = { x: 1, y: 1 };

// 敵（1体）
let enemy = { x: 13, y: 13, alive: true };

// 爆弾
let bomb = null;
let explosions = [];

// キー入力
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// マップ（0=空白, 1=壁）
let map = [];
for (let y = 0; y < ROWS; y++) {
    map[y] = [];
    for (let x = 0; x < COLS; x++) {
        if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
            map[y][x] = 1; // 外周は壁
        } else {
            map[y][x] = 0;
        }
    }
}

// 移動できるか判定
function canMove(x, y) {
    return map[y][x] === 0;
}

// プレイヤー移動
function updatePlayer() {
    let nx = player.x;
    let ny = player.y;

    if (keys["ArrowUp"]) ny--;
    if (keys["ArrowDown"]) ny++;
    if (keys["ArrowLeft"]) nx--;
    if (keys["ArrowRight"]) nx++;

    if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }

    // スペースで爆弾設置
    if (keys[" "] && !bomb) {
        bomb = { x: player.x, y: player.y, timer: 60 }; // 60フレーム後に爆発
    }
}

// 敵のランダム移動
function updateEnemy() {
    if (!enemy.alive) return;

    if (Math.random() < 0.02) {
        let dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        let d = dirs[Math.floor(Math.random() * dirs.length)];
        let nx = enemy.x + d.x;
        let ny = enemy.y + d.y;

        if (canMove(nx, ny)) {
            enemy.x = nx;
            enemy.y = ny;
        }
    }
}

// 爆弾と爆発処理
function updateBomb() {
    if (!bomb) return;

    bomb.timer--;

    if (bomb.timer <= 0) {
        // 爆発発生（上下左右に1マス）
        explosions = [
            { x: bomb.x, y: bomb.y },
            { x: bomb.x + 1, y: bomb.y },
            { x: bomb.x - 1, y: bomb.y },
            { x: bomb.x, y: bomb.y + 1 },
            { x: bomb.x, y: bomb.y - 1 }
        ];

        // 敵に当たったか
        for (let e of explosions) {
            if (enemy.x === e.x && enemy.y === e.y) {
                enemy.alive = false;
            }
        }

        bomb = null;

        // 爆風は30フレームで消える
        setTimeout(() => explosions = [], 300);
    }
}

// 描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // マップ
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "#888";
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            }
        }
    }

    // 爆弾
    if (bomb) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(bomb.x * TILE + 16, bomb.y * TILE + 16, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // 爆風
    ctx.fillStyle = "orange";
    for (let e of explosions) {
        ctx.fillRect(e.x * TILE, e.y * TILE, TILE, TILE);
    }

    // プレイヤー
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x * TILE, player.y * TILE, TILE, TILE);

    // 敵
    if (enemy.alive) {
        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x * TILE, enemy.y * TILE, TILE, TILE);
    }
}

// メインループ
function loop() {
    updatePlayer();
    updateEnemy();
    updateBomb();
    draw();
    requestAnimationFrame(loop);
}

loop();
