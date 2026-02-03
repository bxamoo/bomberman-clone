const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

/* ============================================================
   ステージ生成（固い壁は一個飛ばし、壊せる壁は5パターン）
   ============================================================ */
function generateStage(pattern5x5) {
    const stage = [];

    for (let y = 0; y < ROWS; y++) {
        stage[y] = [];
        for (let x = 0; x < COLS; x++) {

            // 外周は固い壁
            if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) {
                stage[y][x] = 1;
                continue;
            }

            // 固い壁（偶数行 × 偶数列）
            if (y % 2 === 0 && x % 2 === 0) {
                stage[y][x] = 1;
                continue;
            }

            // 壊せる壁パターンを 5×5 → 15×15 に拡大
            const py = Math.floor(y / 3);
            const px = Math.floor(x / 3);
            const v = pattern5x5[py][px];

            if (v === 2) {
                stage[y][x] = 2; // 壊せる壁
            } else {
                stage[y][x] = 0; // 空白
            }
        }
    }

    // プレイヤー初期位置は空白
    stage[1][1] = 0;
    stage[1][2] = 0;
    stage[2][1] = 0;

    // 敵初期位置も空白
    stage[13][13] = 0;
    stage[13][12] = 0;
    stage[12][13] = 0;

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
   キー入力（1クリック＝1マス移動）
   ============================================================ */
let keyPressed = {};
document.addEventListener("keydown", e => {
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
   爆風範囲
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
        let nx = b.x + d.x;
        let ny = b.y + d.y;
        if (!map[ny] || map[ny][nx] === undefined) continue;
        tiles.push({ x: nx, y: ny });
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
   敵 AI：爆弾設置
   ============================================================ */
function enemyTryPlaceBomb() {
    if (!enemy.alive || bomb) return;

    let dx = Math.abs(enemy.x - player.x);
    let dy = Math.abs(enemy.y - player.y);

    if (dx + dy <= 3) {
        bomb = { x: enemy.x, y: enemy.y, timer: 60, owner: "enemy" };
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
   敵 AI：総合
   ============================================================ */
function updateEnemy() {
    if (!enemy.alive) return;

    if (enemyAvoidExplosion()) return;

    enemyTryPlaceBomb();

    enemyChasePlayer();
}

/* ============================================================
   爆弾処理
   ============================================================ */
function updateBomb() {
    if (!bomb) return;

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
                alert("プレイヤーがやられました…");
                resetStage();
                return;
            }
        }

        for (let e of explosions) {
            if (enemy.x === e.x && enemy.y === e.y) {
                enemy.alive = false;
            }
        }

        bomb = null;

        setTimeout(() => explosions = [], 300);
    }
}

/* ============================================================
   ステージリセット
   ============================================================ */
function resetStage() {
    map = JSON.parse(JSON.stringify(stages[currentStage]));
    player = { x: 1, y: 1 };
    enemy = { x: 13, y: 13, alive: true };
    bomb = null;
    explosions = [];
}

/* ============================================================
   ステージクリア
   ============================================================ */
function checkStageClear() {
    if (!enemy.alive) {
        let prev = currentStage;

        do {
            currentStage = Math.floor(Math.random() * stages.length);
        } while (currentStage === prev);

        resetStage();
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

    if (bomb) {
        let cx = bomb.x * TILE + 16;
        let cy = bomb.y * TILE + 16;

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "orange";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 8);
        ctx.lineTo(cx + 14, cy - 14);
        ctx.stroke();
    }

    for (let e of explosions) {
        let cx = e.x * TILE + 16;
        let cy = e.y * TILE + 16;

        let gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 20);
        gradient.addColorStop(0, "yellow");
        gradient.addColorStop(1, "orange");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    {
        let cx = player.x * TILE + 16;
        let cy = player.y * TILE + 16;

        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    if (enemy.alive) {
        let cx = enemy.x * TILE + 16;
        let cy = enemy.y * TILE + 16;

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2
