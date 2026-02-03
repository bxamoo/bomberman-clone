/* ===============================
   トップ画面キャラクター描画
   =============================== */
function drawTitle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#88f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // タイトル文字
    ctx.fillStyle = "white";
    ctx.font = "32px sans-serif";
    ctx.fillText("ぷよボンバーマン", 50, 100);

    // キャラクター
    drawCharacter(7, 7, "cyan");
}

/* ===============================
   トップ画面ループ
   =============================== */
function titleLoop() {
    if (gameStarted) return;
    drawTitle();
    requestAnimationFrame(titleLoop);
}
titleLoop();

/* ===============================
   Win/Lose画面 Topボタン
   =============================== */
function showMessage(text, callback) {
    const box = document.getElementById("messageBox");
    const msg = document.getElementById("messageText");
    const retry = document.getElementById("retryButton");
    let topBtn = document.getElementById("topButton");

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
            topBtn.removeEventListener("click", goTop);
            callback();
            gamePaused = false;
            loop();
        }, 300);
    }

    function goTop() {
        document.getElementById("titleScreen").style.display = "block";
        box.classList.add("hidden");
        gameStarted = false;
        gamePaused = false;
    }

    retry.addEventListener("click", close);
    topBtn.addEventListener("click", goTop);
}

/* ===============================
   CPU AI改良：自滅回避
   =============================== */
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

    // 壊せる壁の横にいる場合、退避可能なら爆弾を置く
    let breakableDirs = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
        .filter(p => map[p.y] && map[p.y][p.x] === 2);

    if (breakableDirs.length > 0 && !bombs.find(b => b.owner === "enemy")) {
        // 自分の周囲に少なくとも1つ安全な退避タイルがあるか確認
        let safeSpots = dirs.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y }))
            .filter(p => canMove(p.x, p.y) && !danger.has(`${p.x},${p.y}`));
        if (safeSpots.length > 0) {
            bombs.push({ x: enemy.x, y: enemy.y, timer: 120, owner: "enemy" });
            // 退避
            let move = safeSpots[Math.floor(Math.random() * safeSpots.length)];
            enemy.x = move.x;
            enemy.y = move.y;
            return;
        }
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
