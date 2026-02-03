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

// 爆弾（1個だけ管理：owner: "player" | "enemy"）
let bomb = null;
let explosions = [];

// キー押しっぱなし防止
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

// 1マス移動処理（プレイヤー）
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

    // 爆弾設置
    if (key === " " && !bomb) {
        bomb = { x: player.x, y: player.y, timer: 60, owner: "player" };
    }
}

// 通行可能か
function canMove(x, y) {
    return map[y] && map[y][x] === 0;
}

// A* 風の簡易経路探索
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
            // 経路復元
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
            if (map[ny][nx] !== 0) continue; // 壁は通れない
            if (dangerTiles.has(nk)) continue; // 危険マスは避ける
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

// 爆風範囲を計算
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

// 危険マスセットを作る
function getDangerTiles() {
    let set = new Set();
    if (!bomb) return set;

    let tiles = getExplosionTiles(bomb);
    for (let t of tiles) {
        set.add(`${t.x},${t.y}`);
    }
    return set;
}

// 敵が爆風から逃げる
function enemyAvoidExplosion() {
    if (!bomb) return false;

    let danger = getDangerTiles();
    let ek = `${enemy.x},${enemy.y}`;
    if (!danger.has(ek)) return false;

    // 安全マス候補を探す（全マップから）
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

// 敵が爆弾を置くか判断
function enemyTryPlaceBomb() {
    if (!enemy.alive || bomb) return;

    let dx = Math.abs(enemy.x - player.x);
    let dy = Math.abs(enemy.y - player.y);

    // プレイヤーが近いとき
    if (dx + dy <= 3) {
        bomb = { x: enemy.x, y: enemy.y, timer: 60, owner: "enemy" };
        return;
    }

    // プレイヤーへの経路が塞がれている場合、近くの壊せる壁を壊そうとする
    let pathToPlayer = findPath(
        { x: enemy.x, y: enemy.y },
        { x: player.x, y: player.y },
        new Set()
    );

    if (!pathToPlayer) {
        // 周囲の壊せる壁を探す
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

// 敵がプレイヤーを追いかける
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
        // 経路がない場合はランダム移動
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

// 敵の行動
function updateEnemy() {
    if (!enemy.alive) return;

    // 1. 危険なら逃げる
    if (enemyAvoidExplosion()) return;

    // 2. 爆弾を置くか判断
    enemyTryPlaceBomb();

    // 3. プレイヤーを追いかける
    enemyChasePlayer();
}

// 爆弾と爆発処理
function updateBomb() {
    if (!bomb) return;

    bomb.timer--;

    if (bomb.timer <= 0) {
        explosions = getExplosionTiles(bomb);

        // 壊せる壁を破壊
        for (let e of explosions) {
            if (map[e.y] && map[e.y][e.x] === 2) {
                map[e.y][e.x] = 0;
            }
        }

        // プレイヤーに当たったか
        for (let e of explosions) {
            if (player.x === e.x && player.y === e.y) {
                alert("プレイヤーがやられました…");
                resetStage();
                return;
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

// ステージリセット
function resetStage() {
    map = JSON.parse(JSON.stringify(stages[currentStage]));
    player = { x: 1, y: 1 };
    enemy = { x: 13, y: 13, alive: true };
    bomb = null;
    explosions = [];
}

// ステージクリア判定
function checkStageClear() {
    if (!enemy.alive) {
        let prev = currentStage;

        // ランダムで次のステージを選ぶ（同じステージは避ける）
        do {
            currentStage = Math.floor(Math.random() * stages.length);
        } while (currentStage === prev);

        resetStage();
    }
}

// 描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // マップ
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === 1) {
                // 固い壁
                ctx.fillStyle = "#666";
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
                ctx.strokeStyle = "#999";
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            }
            if (map[y][x] === 2) {
                // 壊せる壁
                ctx.fillStyle = "#A66";
                ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
                ctx.strokeStyle = "#D99";
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            }
        }
    }

    // 爆弾
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

    // 爆風
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

    // プレイヤー
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

    // 敵
    if (enemy.alive) {
        let cx = enemy.x * TILE + 16;
        let cy = enemy.y * TILE + 16;

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// メインループ
function loop() {
    updateEnemy();
    updateBomb();
    checkStageClear();
    draw();
    requestAnimationFrame(loop);
}

loop();
