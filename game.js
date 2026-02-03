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

let bomb = null;
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

    if (key === " " && !bomb) {
        bomb = { x: player.x, y: player.y, timer: 60, owner: "player" };
    }
}

/* ============================================================
   通行判定
   ============================================================ */
function canMove(x, y) {
    return map[y] && map[y][x] === 0;
}

/* ============================================================
   A* 風の簡易経路探索
   ============================================================ */
function findPath(start, goal, dangerTiles = new Set()) {
    const key = (x, y) => `${x},${y}`;

    let open = [];
    let cameFrom = {};
    let gScore = {};
    let fScore = {};
    let closed = new Set();

    const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

    gScore[key(start.x, start.y)] = 0;
    fScore[key(start.x, start.y)] = h(start.x, start.y);
    open.push({ x: start.x, y: start.y, f: fScore[key(start.x, start.y)] });

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        let current = open.shift();
        let ck = key(current.x, current.y);

        if (current.x === goal.x && current.y === goal.y) {
            let path = [];
            let curKey = ck;
            while (curKey in cameFrom) {
                let [cx, cy] = curKey.split(",").map(Number);
                path.unshift({ x: cx, y: cy });
                curKey = cameFrom[curKey];
            }
            return path;
        }

        closed.add(ck);

        let dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        for (let d of dirs) {
            let nx = current.x + d.x;
            let ny = current.y + d.y;
            let nk = key(nx, ny);

            if (!map[ny] || map[ny][nx] === undefined) continue;
            if (map[ny][nx] !== 0) continue;
            if (dangerTiles.has(nk)) continue;
            if (closed.has(nk)) continue;

            let tentativeG = (gScore[ck] ?? Infinity) + 1;
            if (tentativeG < (gScore[nk] ?? Infinity)) {
                cameFrom[nk] = ck;
                gScore[nk] = tentativeG;
                fScore[nk] = tentativeG + h(nx, ny);

                if (!open.find(n => n.x === nx && n.y === ny)) {
                    open.push({ x: nx, y: ny, f: fScore[nk] });
                }
            }
        }
    }

    return null;
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

function getDangerTiles() {
    let set = new Set();
    if (!bomb) return set;

    let tiles = getExplosionTiles(bomb);
    for (let t of tiles) {
        set.add(`${t.x},${t.y}`);
    }
    return set;
}

/* ============================================================
   敵 AI：爆風回避
   ============================================================ */
function enemyAvoidExplosion() {
    if (!bomb) return false;

    let danger = getDangerTiles();
    let ek = `${enemy.x},${enemy.y}`;
    if (!danger.has(ek)) return false;

    let bestPath = null;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] !== 0) continue;
            let k = `${x},${y}`;
            if (danger.has(k)) continue;

            let path = findPath({ x: enemy.x, y: enemy.y }, { x, y }, danger);
            if (path && path.length > 0) {
                if (!bestPath || path.length < bestPath.length) {
                    bestPath = path;
                }
            }
        }
    }

    if (bestPath && bestPath.length > 0) {
        let next = bestPath[0];
        enemy.x = next.x;
        enemy.y = next.y;
        return true;
    }

    return false;
}

/* ============================================================
   敵 AI：爆弾設置（置いたらすぐ逃げモード）
   ============================================================ */
function enemyTryPlaceBomb() {
    if (!enemy.alive || bomb) return;

    let dx = Math.abs(enemy.x - player.x);
    let dy = Math.abs(enemy.y - player.y);

    if (dx + dy <= 3) {
        bomb = { x: enemy.x, y: enemy.y, timer: 60, owner: "enemy" };
        enemyCooldown = 0;
        return;
    }

    let pathToPlayer = findPath(
        { x: enemy.x, y: enemy.y },
        { x: player.x, y: player.y },
        new Set()
    );

    if (!pathToPlayer) {
        let dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        for (let d of dirs) {
            let nx = enemy.x + d.x;
            let ny = enemy.y + d.y;
            if (map[ny] && map[ny][nx] === 2) {
                bomb = { x: enemy.x, y: enemy.y, timer: 60, owner: "enemy" };
                enemyCooldown = 0;
                return;
            }
        }
    }
}

/* ============================================================
   敵 AI：プレイヤー追跡
   ============================================================ */
function enemyChasePlayer() {
    let danger = getDangerTiles();
    let path = findPath(
        { x: enemy.x, y: enemy.y },
        { x: player.x, y: player.y },
        danger
    );

    if (path && path.length > 0) {
        let next = path[0];
        enemy.x = next.x;
        enemy.y = next.y;
    } else {
        let dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];
        dirs.sort(() => Math.random() - 0.5);
        for (let d of dirs) {
            let nx = enemy.x + d.x;
            let ny = enemy.y + d.y;
            if (canMove(nx, ny)) {
                enemy.x = nx;
                enemy.y = ny;
                break;
            }
        }
    }
}

/* ============================================================
   敵 AI：クールダウン付き総合行動
   ============================================================ */
let enemyCooldown = 0;

function updateEnemy() {
    if (!enemy.alive || gamePaused) return;

    if (enemyCooldown > 0) {
        enemyCooldown--;
        return;
    }

    enemyCooldown = 18 + Math.floor(Math.random() * 10);

    if (enemyAvoidExplosion()) return;

    enemyTryPlaceBomb();

    enemyChasePlayer();
}

/* ============================================================
   爆弾処理（勝敗判定込み）
   ============================================================ */
function updateBomb() {
    if (!bomb || gamePaused) return;

    bomb.timer--;

    if (bomb.timer <= 0) {
        explosions = getExplosionTiles(bomb);

        for (let e of explosions) {
            if (map[e.y] && map[e.y][e.x] === 2) {
                map[e.y][e.x] = 0;
            }
        }

        for (let e of explosions) {
            if (player.x === e.x && player.y === e.y) {
                showMessage("You Lose…", () => {
                    resetStage();
                });
                bomb = null;
                return;
            }
        }

        for (let e of explosions) {
            if (enemy.x === e.x && enemy.y === e.y) {
                enemy.alive = false;
            }
        }

        bomb = null;

        setTimeout(() =>
