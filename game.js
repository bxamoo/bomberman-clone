const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

/* ===============================
   状態
================================ */
let gameStarted = false;
let gamePaused = true;
let gameOver = false;

/* DOM */
const startButton = document.getElementById("startButton");
const messageBox = document.getElementById("messageBox");
const messageText = document.getElementById("messageText");
const retryButton = document.getElementById("retryButton");

/* 初期状態で完全に隠す（重要） */
messageBox.classList.add("hidden");

/* ===============================
   ステージ
================================ */
function generateStage() {
    const stage = [];
    for (let y = 0; y < ROWS; y++) {
        stage[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (
                y === 0 || y === ROWS - 1 ||
                x === 0 || x === COLS - 1 ||
                (y % 2 === 0 && x % 2 === 0)
            ) stage[y][x] = 1;
            else stage[y][x] = Math.random() < 0.35 ? 2 : 0;
        }
    }
    stage[1][1] = stage[1][2] = stage[2][1] = 0;
    stage[13][13] = stage[13][12] = stage[12][13] = 0;
    return stage;
}

let map, player, enemy, bombs, explosions, enemyCooldown;

/* ===============================
   リセット
================================ */
function resetStage() {
    map = generateStage();
    player = { x: 1, y: 1 };
    enemy = { x: 13, y: 13, alive: true };
    bombs = [];
    explosions = [];
    enemyCooldown = 0;

    gameOver = false;
    gamePaused = false;
}

/* ===============================
   入力
================================ */
let keyLock = {};
document.addEventListener("keydown", e => {
    if (!gameStarted || gamePaused || gameOver) return;
    if (keyLock[e.key]) return;
    keyLock[e.key] = true;
    handleKey(e.key);
});
document.addEventListener("keyup", e => keyLock[e.key] = false);

function handleKey(key) {
    let nx = player.x, ny = player.y;
    if (key === "ArrowUp") ny--;
    if (key === "ArrowDown") ny++;
    if (key === "ArrowLeft") nx--;
    if (key === "ArrowRight") nx++;

    if (canMove(nx, ny)) {
        player.x = nx;
        player.y = ny;
    }

    if (key === " " && !bombs.some(b => b.owner === "player")) {
        bombs.push({ x: player.x, y: player.y, timer: 120, owner: "player" });
    }
}

/* ===============================
   判定
================================ */
function canMove(x, y) {
    if (!map[y] || map[y][x] !== 0) return false;
    if (bombs.some(b => b.x === x && b.y === y)) return false;
    return true;
}

function explosionTiles(b) {
    const tiles = [{ x: b.x, y: b.y }];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx,dy] of dirs) {
        for (let i = 1; i <= 2; i++) {
            const nx = b.x + dx * i;
            const ny = b.y + dy * i;
            if (!map[ny] || map[ny][nx] === undefined) break;
            tiles.push({ x: nx, y: ny });
            if (map[ny][nx] === 1) break;
        }
    }
    return tiles;
}

function dangerTiles() {
    const set = new Set();
    bombs.forEach(b => {
        set.add(`${b.x},${b.y}`);
        explosionTiles(b).forEach(t => set.add(`${t.x},${t.y}`));
    });
    return set;
}

/* ===============================
   爆弾
================================ */
function updateBombs() {
    for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        b.timer--;
        if (b.timer <= 0) {
            const tiles = explosionTiles(b);
            explosions.push({ tiles, timer: 40 });

            tiles.forEach(t => {
                if (map[t.y][t.x] === 2) map[t.y][t.x] = 0;
                if (player.x === t.x && player.y === t.y && !gameOver)
                    endGame("You Lose…");
                if (enemy.x === t.x && enemy.y === t.y)
                    enemy.alive = false;
            });
            bombs.splice(i, 1);
        }
    }
    explosions = explosions.filter(e => --e.timer > 0);
}

/* ===============================
   CPU
================================ */
function enemyAI() {
    if (!enemy.alive || enemyCooldown-- > 0) return;
    enemyCooldown = 12;

    const danger = dangerTiles();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    const moves = dirs
        .map(([dx,dy]) => ({ x: enemy.x+dx, y: enemy.y+dy }))
        .filter(p => canMove(p.x,p.y) && !danger.has(`${p.x},${p.y}`));

    if (moves.length) {
        moves.sort((a,b) =>
            Math.abs(a.x-player.x)+Math.abs(a.y-player.y) -
            (Math.abs(b.x-player.x)+Math.abs(b.y-player.y))
        );
        enemy.x = moves[0].x;
        enemy.y = moves[0].y;
        return;
    }

    if (!bombs.some(b => b.owner === "enemy")) {
        bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
    }
}

/* ===============================
   勝敗
================================ */
function endGame(text) {
    gameOver = true;
    gamePaused = true;
    messageText.textContent = text;
    messageBox.classList.remove("hidden");
    messageBox.classList.add("show");
}

function checkWin() {
    if (!enemy.alive && !gameOver) endGame("You Win!");
}

/* ===============================
   描画
================================ */
function drawChar(x,y,color) {
    const cx=x*TILE+TILE/2, cy=y*TILE+TILE/2;
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(cx-5,cy-3,6,0,Math.PI*2);
    ctx.arc(cx+5,cy-3,6,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle="black";
    ctx.beginPath();
    ctx.arc(cx-5,cy-3,3,0,Math.PI*2);
    ctx.arc(cx+5,cy-3,3,0,Math.PI*2);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
        if(map[y][x]===1){ctx.fillStyle="#666";ctx.fillRect(x*TILE,y*TILE,TILE,TILE);}
        if(map[y][x]===2){ctx.fillStyle="#a66";ctx.fillRect(x*TILE,y*TILE,TILE,TILE);}
    }
    bombs.forEach(b=>{
        const cx=b.x*TILE+TILE/2, cy=b.y*TILE+TILE/2;
        ctx.fillStyle="orange";
        ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fill();
    });
    explosions.forEach(e=>e.tiles.forEach(t=>{
        const cx=t.x*TILE+TILE/2, cy=t.y*TILE+TILE/2;
        const g=ctx.createRadialGradient(cx,cy,5,cx,cy,20);
        g.addColorStop(0,"yellow"); g.addColorStop(1,"orange");
        ctx.fillStyle=g;
        ctx.beginPath();ctx.arc(cx,cy,20,0,Math.PI*2);ctx.fill();
    }));
    drawChar(player.x,player.y,"cyan");
    if(enemy.alive) drawChar(enemy.x,enemy.y,"red");
}

/* ===============================
   ループ（1回）
================================ */
function loop() {
    draw();
    if (gameStarted && !gamePaused) {
        enemyAI();
        updateBombs();
        checkWin();
    }
    requestAnimationFrame(loop);
}
loop();

/* ===============================
   ボタン
================================ */
startButton.onclick = () => {
    startButton.classList.add("hidden");
    messageBox.classList.add("hidden");
    gameStarted = true;
    gamePaused = false;
    resetStage();
};

retryButton.onclick = () => {
    messageBox.classList.add("hidden");
    messageBox.classList.remove("show");
    resetStage();
};
