const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

// 0=空白, 1=固い壁, 2=壊せる壁
const stages = [
    // --- Stage 1 ---
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,1,0,2,0,2,0,1,0,2,0,1],
        [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
        [1,0,1,0,2,0,0,1,0,0,2,0,1,0,1],
        [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
        [1,2,0,0,0,1,0,2,0,1,0,0,0,2,1],
        [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,2,1,0,0,0,2,0,0,0,1,2,0,1],
        [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
        [1,2,0,0,0,1,0,1,0,1,0,0,0,2,1],
        [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,2,0,0,0,0,1,0,0,0,0,2,0,1],
        [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
        [1,0,0,2,0,0,0,0,0,0,0,2,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    // --- Stage 2 ---
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,1,2,0,0,1,0,0,2,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,2,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,2,1,0,0,0,1,0,0,0,1,2,0,1],
        [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,1,0,2,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,2,1,0,0,0,1,0,0,0,1,2,0,1],
        [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
        [1,0,0,1,2,0,0,1,0,0,2,1,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    // --- Stage 3 ---
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
        [1,0,2,0,2,0,2,0,2,0,2,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    // --- Stage 4 ---
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,2,2,2,0,2,2,2,0,0,0,1],
        [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1],
        [1,0,0,0,2,2,2,0,2,2,2,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,2,2,2,0,2,2,2,0,0,0,1],
        [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1],
        [1,0,0,0,2,2,2,0,2,2,2,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,2,2,2,0,2,2,2,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    // --- Stage 5 ---
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,0,0,2,0,2,0,0,0,2,0,1],
        [1,0,1,1,1,1,1,2,1,1,1,1,1,0,1],
        [1,2,0,0,0,2,0,0,0,2,0,0,0,2,1],
        [1,1,1,1,1,1,1,2,1,1,1,1,1,1,1],
        [1,0,2,0,0,0,2,0,2,0,0,0,2,0,1],
        [1,0,1,1,1,1,1,2,1,1,1,1,1,0,1],
        [1,2,0,0,0,2,0,0,0,2,0,0,0,2,1],
        [1,1,1,1,1,1,1,2,1,1,1,1,1,1,1],
        [1,0,2,0,0,0,2,0,2,0,0,0,2,0,1],
        [1,0,1,1,1,1,1,2,1,1,1,1,1,0,1],
        [1,2,0,0,0,2,0,0,0,2,0,0,0,2,1],
        [1,1,1,1,1,1,1,2,1,1,1,1,1,1,1],
        [1,0,2,0,0,0,2,0,2,0,0,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

let currentStage = 0;
let map = JSON.parse(JSON.stringify(stages[currentStage]));

// プレイヤー
let player = { x: 1, y: 1 };

// 敵
let enemy = { x: 13, y: 13, alive: true };

// 爆弾
let bomb = null;
let explosions = [];

// キー入力
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// 移動できるか
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

    // 爆弾設置
    if (keys[" "] && !bomb) {
        bomb = { x: player.x, y: player.y, timer: 60 };
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
        explosions = [
            { x: bomb.x, y: bomb.y },
            { x: bomb.x + 1, y: bomb.y },
            { x: bomb.x - 1, y: bomb.y },
            { x: bomb.x, y: bomb.y + 1 },
            { x: bomb.x, y: bomb.y - 1 }
        ];

        // 壁破壊処理
        for (let e of explosions) {
            if (map[e.y] && map[e.y][e.x] === 2) {
                map[e.y][e.x] = 0; // 壊せる壁を破壊
            }
        }

        // 敵に当たったか
        for (let e of explosions) {
            if (enemy.x === e.x && enemy.y === e.y) {
                enemy.alive = false;
            }
        }

        bomb = null;

        setTimeout(() => explosions = [], 300);
    }
}

// ステージクリア判定
function checkStageClear() {
    if (!enemy.alive) {

        let prev = currentStage;

        // ランダムで次のステージを選ぶ（同じステージは避ける）
        do {
            currentStage = Math.floor(Math.random() * stages.length);
        } while (currentStage === prev);

        map = JSON.parse(JSON.stringify(stages[currentStage]));
        player = { x: 1, y: 1 };
        enemy = { x: 13, y: 13, alive: true };
        bomb = null;
        explosions = [];
    }
}

// 描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // マップ
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "#888"; // 固い壁
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            }
            if (map[y][x] === 2) {
                ctx.fillStyle = "#AA6"; // 壊せる壁
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
    checkStageClear();
    draw();
    requestAnimationFrame(loop);
}

loop();
